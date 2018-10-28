var socket_io = require('socket.io');
var io = socket_io();
var socketApi = {};
const moment = require('moment');

socketApi.io = io;
var Elo = require('arpad');
var uscf = {
    default: 20,
    2100: 15,
    2400: 10
};

var Chess = require('chess.js').Chess;

var min_score = 100;
var max_score = 10000;
const save_result = require('./routes/save_result');
const game_over = require('./routes/game_over');
const save_result_mongo = require('./routes/save_result_mongo');
const create_game_mongo = require('./routes/create_game_mongo');
const invite_user_to_game = require('./routes/invite_user_to_game');
const bluebird = require('bluebird');
const ObjectId = require('mongodb').ObjectId;


let online_players = {};
let store = {};

var elo = new Elo(uscf, min_score, max_score);

module.exports = function (app) {


    const pool = bluebird.promisifyAll(app.pool);

    io.on('connection', function (socket) {


        var handshakeData = socket.request;
        let data = handshakeData._query;

        if (handshakeData._query['h'] && handshakeData._query['h'] != "undefined") {
            socket.p_id = data.h;
            app.globalPlayers[socket.p_id] = socket;
            store[socket.p_id] = socket.id;
        }

        if ((handshakeData._query['t1'] && handshakeData._query['t1'] != "undefined")) {
            socket.join('t' + handshakeData._query['t1']);
        }
        if ((handshakeData._query['chat'] && handshakeData._query['chat'] != "undefined")) {
            socket.join('chat' + handshakeData._query['chat']);
        }
        if ((handshakeData._query['lobby'] && handshakeData._query['lobby'] != "undefined")) {
            socket.join('lobby');
        }

        //события игры

        if (handshakeData._query['g'] && handshakeData._query['g'] != "undefined") {

            socket.game_id = data.g;

            if (handshakeData._query['h'] && handshakeData._query['h'] != "undefined") {
                online_players[socket.game_id] = online_players[socket.game_id] || {};
                online_players[socket.game_id][socket.p_id] = online_players[socket.game_id][socket.p_id] || 0;
                online_players[socket.game_id][socket.p_id] = ++online_players[socket.game_id][socket.p_id];
            }

            socket.join(socket.game_id);

            io.to(socket.game_id).emit('playerOnline',
                JSON.stringify(online_players[handshakeData._query['g']] || {}));






            pool
                .query('SELECT * FROM tournaments_results WHERE id = ?', handshakeData._query['g'])
                .then(rows => {
                    var game = rows[0];
                    if (game) {
                        var time = game.created_at;
                        var a = time.getTime() - new Date().getTime();
                        var diffDays = Math.ceil(a / (1000 * 3600 ));
                        var isPlayer = false;
                        var color = null;
                        if (game.p1_id == handshakeData._query['h']) {
                            isPlayer = true;
                            color = "white";
                        } else if (game.p2_id == handshakeData._query['h']) {
                            isPlayer = true;
                            color = "black";
                        }
                    }


                });


            function calculateTime(msg, mongoGame, obj) {
                var actual_time = new Date().getTime(), lm = 0, spent_time = 0;

                if (msg.player === "p1") {

                    //если премув - время не отнимается
                    if (msg.premoved || mongoGame.is_started === 0) {
                        obj["p1_time_left"] = mongoGame.p1_time_left;
                    } else {
                        lm = (mongoGame.p2_last_move) ? mongoGame.p2_last_move.getTime() : actual_time;
                        spent_time = actual_time - lm;
                        obj["p1_time_left"] = mongoGame.p1_time_left - spent_time;
                    }
                    obj["p2_last_move"] = new Date();
                    obj["p2_time_left"] = mongoGame.p2_time_left;


                } else {

                    //если премув - время не отнимается
                    if (msg.premoved || mongoGame.is_started === 0) {
                        obj["p2_time_left"] = mongoGame.p2_time_left;
                    } else {
                        lm = (mongoGame.p1_last_move) ? mongoGame.p1_last_move.getTime() : actual_time;
                        spent_time = actual_time - lm;
                        obj["p2_time_left"] = mongoGame.p2_time_left - spent_time;

                    }

                    obj["p1_last_move"] = new Date();
                    obj["p1_time_left"] = mongoGame.p1_time_left;

                }

                return obj;
            }

            socket.on('eventServer', function (msg) {
                try {
                    //msg = JSON.parse(msg);
                    console.log(msg);
                    let temp, is_over = false, send_data = {};
                    if (msg.tourney_id) {
                        msg.id = parseInt(msg.id);
                        temp = {_id: msg.id};
                    } else {
                        temp = {_id: ObjectId(msg.id)};
                    }

                    app.mongoDB.collection("users").findOne(temp, function (err, mongoGame) {


                        if (!mongoGame) {
                            console.log("Игра не найдена.");
                            const a = {
                                event: "game_aborted",
                            };
                            io.to(msg.id).emit('eventClient', a);
                            return false;
                        }

                        if (mongoGame.is_over === 1) {
                            console.log("Игра завершена. Отмена действия.");
                            console.log("Полученные данные:");
                            console.log(msg);
                            console.log("Данны игры");
                            console.log(mongoGame);


                            return false;
                        }


                       /* socket.emit('eventClient', {
                            event: "cancel_move",
                            "p1_time_left" : msg.p1_time_left,
                            "p2_time_left" : msg.p2_time_left,
                            "p1_won" : msg.p1_won,
                            "p2_won" : msg.p2_won,
                            is_over: 1
                        });*/
                       // console.log("cancel_move");
                        //return false;

                        //42["eventServer",{"data":"rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1","id":"5bd5827555dd16073270d111","tourney_id":null,"move":"e4","from":"e2","to":"e4","is_over":0,"player":"p1"}]
                        console.log(mongoGame);
                        console.log(new Date().getTime());

                        console.log(msg.player);

                        //последний кто двигал фигуры - черные
                        if (msg.player === "p2") {
                            //истекло ли время черных
                            if (mongoGame.p1_last_move !== null && (mongoGame.p2_time_left + mongoGame.p1_last_move.getTime() < new Date().getTime())) {
                                const chess = new Chess();
                                chess.load(mongoGame.fen);
                                if (chess.in_draw()) {
                                    send_data.p1_won = 0.5;
                                    send_data.p1_won = 0.5;
                                } else {
                                    send_data.p1_won = 1;
                                    send_data.p2_won = 0;
                                }

                                send_data.id = mongoGame._id;

                                send_data.p1_id = mongoGame.p1_id;
                                send_data.p2_id = mongoGame.p2_id;
                                send_data.p2_time_left = 0;
                                send_data.p1_time_left = mongoGame.p1_time_left;
                                send_data.tourney_id = mongoGame.tournament_id;
                                send_data.flagged = "black";
                                is_over = true;
                            }

                        } else if (msg.player === "p1") {
                            //истекло ли время белых
                            if (mongoGame.p2_last_move !== null && (mongoGame.p1_time_left + mongoGame.p2_last_move.getTime() < new Date().getTime())) {
                                //проверяем, а хватает ли матер
                                const chess = new Chess();
                                chess.load(mongoGame.fen);
                                if (chess.in_draw()) {
                                    send_data.p1_won = 0.5;
                                    send_data.p1_won = 0.5;
                                } else {
                                    send_data.p1_won = 1;
                                    send_data.p2_won = 0;
                                }

                                send_data.id = mongoGame._id;
                                send_data.p1_won = 0;
                                send_data.p2_won = 1;
                                send_data.p1_id = mongoGame.p1_id;
                                send_data.p2_id = mongoGame.p2_id;
                                send_data.p1_time_left = 0;
                                send_data.p2_time_left = mongoGame.p2_time_left;
                                send_data.tourney_id = mongoGame.tournament_id;
                                send_data.flagged = "white";
                                is_over = true;
                            }
                        }

                        if (is_over === true) {
                            console.log("flagged");
                            save_result_mongo(send_data, mongoGame, app);


                            //если это турнирная партия сохранияем в mysql
                            if (msg.tourney_id != null) {
                                game_over(msg, app);
                            }
                            //если игра завершена, останавливаем дальнейшее действие
                            return false;
                        }



                        var obj = {
                            "fen": msg.data,
                            "is_started" : (mongoGame.p1_last_move !== null) ? 1 : mongoGame.is_started
                        };

                        if (msg.is_over === 1){
                            obj.is_over = 1;
                            obj.p1_won = msg.p1_won;
                            obj.p2_won = msg.p2_won;
                        }


                        //игра не началась, но ход сделан, значит белые сходили
                        if (obj.is_started === 0) {
                            obj.startTime = moment(new Date()).add(1, 'm').toDate();

                            //уже второй ход (черные ответили), пора начинать игру
                            if (mongoGame.moves.length === 1) {
                                obj.is_started = 1;
                            }
                        }

                        calculateTime(msg, mongoGame, obj);

                             app.mongoDB.collection("users").updateOne(temp,
                                 {
                                     $set: obj,
                                     $setOnInsert: {
                                         "moves": [],
                                         "is_over": 0,
                                     }
                                 },

                                 {
                                     upsert: true,
                                     writeConcern: true
                                 },
                                 function (err, data) {

                                     var a = {
                                         event: "move",
                                         fen: msg.data,
                                         san: msg.move,
                                         captured: msg.captured,
                                         from: msg.from,
                                         to: msg.to,
                                         is_over: msg.is_over
                                     };

                                     a.p1_time_left = obj.p1_time_left;
                                     a.p2_time_left = obj.p2_time_left;

                                     io.to(msg.id).emit('eventClient',a);

                                     app.mongoDB.collection("users").updateOne(temp,
                                         {$push: {"moves": msg.move}},
                                         { writeConcern: true }
                                     ).catch(function () {
                                         console.log(arguments);
                                     });

                                     if (msg.is_over == 1) {
                                         save_result_mongo(obj, mongoGame, app);
                                         if (msg.tourney_id) {
                                             game_over(msg, app);
                                         }
                                     }

                                 }
                             );
                    })
                } catch (e) {
                    console.log(e.message);
                }
            });




            socket.on('checkTime1', function (data) {
                var msg = JSON.parse(data);


                var who_get_flagged = msg.player;

                let temp;
                if (msg.tourney_id) {
                    temp = {_id: parseInt(msg.id)};
                } else {
                    temp = {_id: ObjectId(msg.id)};
                }

                let who_move_last = "", is_over = false;


                if (msg.id) {
                    app.mongoDB.collection("users").findOne(temp, function (err, mongoGame) {
                        var send_data = {
                            id: mongoGame._id,
                        };

                        //последний кто двигал фигуры - белые
                    //    if (who_get_flagged === "p2") {
                            //истекло ли время черных
                            if ((mongoGame.p2_time_left + mongoGame.p1_last_move.getTime() + 1000) < new Date().getTime()) {
                                send_data.p1_won = 1;
                                send_data.p2_won = 0;
                                send_data.p1_id = mongoGame.p1_id;
                                send_data.p2_id = mongoGame.p2_id;
                                send_data.p2_time_left = 0;
                                send_data.p1_time_left = mongoGame.p1_time_left;
                                send_data.tourney_id = mongoGame.tournament_id;
                                is_over = true;
                            }

                    //    } else {
                            //последние ходили черные

                            //истекло ли время белых
                            if ((mongoGame.p1_time_left + mongoGame.p2_last_move.getTime() + 1000) < new Date().getTime()) {
                                send_data.p1_won = 0;
                                send_data.p2_won = 1;
                                send_data.p1_id = mongoGame.p1_id;
                                send_data.p2_id = mongoGame.p2_id;
                                send_data.p1_time_left = 0;
                                send_data.p2_time_left = mongoGame.p2_time_left;
                                send_data.tourney_id = mongoGame.tournament_id;
                                is_over = true;
                            }
                    //    }

                        if (is_over) {
                            save_result_mongo(send_data, mongoGame, app);
                        }

                        //если это турнирная партия сохранияем в mysql
                        if (msg.tourney_id != null) {
                            game_over(msg, app);
                        }
                    });
                } else {
                    console.log("id not defined");
                }
            });

            socket.on('playerOnOff', function (data) {
                data = JSON.parse(data);
                io.to(data.game_id).emit('eventClient', {
                    event : "playerOnline",
                    players : online_players[data.game_id]
                });
            });

            socket.on('decline_draw', function (data) {
                data = JSON.parse(data);
                io.to(data.game_id).emit('eventClient', {
                    event : "decline_draw",
                    game_id : data.game_id,
                });
            });


            socket.on('rematch_game', function (data) {
                data = JSON.parse(data);
                console.log(data);
                if (app.globalPlayers[data.enemy_id]) {
                    console.log(JSON.stringify(store));

                    io.to(store[data.enemy_id]).emit('eventClient', {
                        event : "rematch_offer"
                    });
                }
            });

            socket.on('draw_offer', function (data) {
                data = JSON.parse(data);
                if ( app.globalPlayers[data.enemy_id]) {
                    app.globalPlayers[data.enemy_id].emit('eventClient', {
                        event : "draw_offer",
                        game_id : data.game_id
                    });
                }
            });

            socket.on('rematch_accepted', function (data) {
                data = JSON.parse(data);

                //берем от клиента информацию
                data['amount'] = data.amount;
                data['p1_id'] = data.user_id;
                data['p2_id'] = data.enemy_id;
                data['p1_name'] = data.user_name;
                data['p2_name'] = data.enemy_name;
                data['p1_time_left'] = data.amount * 60000;
                data['p2_time_left'] = data.amount * 60000;
                data['tournament_id'] = null;

                create_game_mongo(data, app, function (err, insertedGame) {
                    invite_user_to_game(data.user_id, {event : "playzone_start_game", tournament_id: null, game_id : insertedGame.insertedId},app);
                    invite_user_to_game(data.enemy_id, {event : "playzone_start_game", tournament_id: null, game_id : insertedGame.insertedId},app);
                });
            });




        } else if (
            (!handshakeData._query['h'] ||
            handshakeData._query['h'] == "undefined"
            || handshakeData._query['h'] == "null")
            && (handshakeData._query['t1']
            &&  handshakeData._query['t1'] != "undefined")
        ) {

            var random = getRandomId(app.viewers);
            socket.viewer_id = random;
            socket.t1 = handshakeData._query['t1'];
            app.viewers[handshakeData._query['t1']] =  app.viewers[handshakeData._query['t1']] || {};
            app.viewers[handshakeData._query['t1']][random] = socket;
          //  console.log(Object.keys(app.viewers));
          //  console.log(Object.keys(app.viewers[handshakeData._query['t1']]));
            // console.log(Object.keys(app.globalPlayers));
            // console.log(handshakeData._query['h']);
        } else if (
            handshakeData._query['chat'] && handshakeData._query['chat'] != "undefined"
        ) {

            socket.on('message', function (data) {
               // data = JSON.parse(data);
                io.to("chat" + handshakeData._query['chat']).emit('message', data);
                var game = app.mongoDB.collection("chat").insertOne({
                    msg : data,
                    chat_id : parseInt(handshakeData._query['chat']),
                });
            });

        }else if (
            handshakeData._query['lobby'] && handshakeData._query['lobby'] != "undefined"
        ) {

            getCurrentPlayGames(socket, data.insertedId);


            socket.on('create_game', function (data) {
              //  console.log('create_game');
              //  console.log(data);
                data = JSON.parse(data);

                var game = app.mongoDB.collection("challenges").insertOne({
                    "owner" : data.user_id,
                    "user_name" : data.user_name,
                    "created_at" : new Date(),
                    "time_control" : data.amount
                }, function (err, data) {
                    getCurrentPlayGames(socket, data.insertedId);
                 //   console.log(data.insertedId);
                });
            });

            socket.on('cancel_game', function (data) {
               // console.log('cancel_game');
                console.log(data);
            });

            socket.on('accept_game', function (data) {
                data = JSON.parse(data);

                app.mongoDB.collection("challenges").findOne({_id: ObjectId(data.game_id)}, function (err, mongoGame) {
                    //владелец не найден
                    if (!mongoGame || !mongoGame.owner) {
                        return false;
                    }

                    //берем из монго
                    data['amount'] = mongoGame.time_control;
                    data['p2_name'] = mongoGame.user_name;
                    data['p1_id'] = mongoGame.owner;
                    data['p1_time_left'] = mongoGame.time_control * 60000;
                    data['p2_time_left'] = mongoGame.time_control * 60000;

                    //берем от клиента информацию
                    data['p1_name'] = data.user_name;
                    data['p2_id'] = data.user_id;
                    data['tournament_id'] = null;

                    create_game_mongo(data, app, function (err, insertedGame) {
                        app.mongoDB.collection("challenges").deleteMany({owner: mongoGame.owner}, function () {});

                        invite_user_to_game(mongoGame.owner, {event : "playzone_start_game", tournament_id: null, game_id : insertedGame.insertedId},app);

                        invite_user_to_game(data.user_id, {event : "playzone_start_game",tournament_id: null, game_id : insertedGame.insertedId},app);

                    });
                });
            });

            socket.on('remove', function (data) {
                data = JSON.parse(data);

                app.mongoDB.collection("challenges").deleteOne({_id: ObjectId(data.game_id)}, function (err, mongoGame) {
                    getCurrentPlayGames();
                });
            });
            socket.on('remove_all_challenges', function (data) {
                data = JSON.parse(data);

                app.mongoDB.collection("challenges").deleteMany({owner: data.user_id}, function (err, mongoGame) {
                    getCurrentPlayGames();
                });
            });
        }


        function getCurrentPlayGames(socket, created_id) {
            app.mongoDB.collection("challenges").find({}, function(err, cursor) {
                let challenges = [];
                cursor.forEach(function (message) {
                    challenges.push(message);
                 //   console.log(message);
                }, function () {


                    app.mongoDB.collection("users").find({"playzone" : true, "is_over" : 0}, function(err, cursor) {
                        let games = [];
                        cursor.forEach(function (message) {
                            games.push(message);
                         //   console.log(message);
                        }, function () {

                            io.to("lobby").emit('games_list',
                                {
                                    games: JSON.stringify(games),
                                    challenges: JSON.stringify(challenges),
                                    created_id: created_id,
                                }
                            );

                        });
                    });


                });
            });
        }

        socket.on('disconnect', function () {
          //  console.log("disconnect");
          //  console.log(Object.keys(app.globalPlayers));

            if (typeof online_players[socket.game_id] !== "undefined"
                && typeof online_players[socket.game_id][this.p_id] !== "undefined") {
                online_players[socket.game_id][socket.p_id] = --online_players[socket.game_id][socket.p_id];

                if (online_players[socket.game_id][socket.p_id] <= 0) {
                    delete online_players[socket.game_id][socket.p_id];

                    io.to(socket.game_id).emit('eventClient', {
                        event : "playerOnline",
                        players : online_players[socket.game_id]
                    });

                   // io.to(socket.game_id).emit('playerOnline', JSON.stringify(online_players[socket.game_id]));
                    //io.sockets.emit('playerOnline', JSON.stringify(online_players[socket.game_id]));
                }

                if (Object.keys(online_players[socket.game_id]).length === 0) {
                    delete online_players[socket.game_id];
                }
            }

            if (typeof app.globalPlayers[socket.p_id] !== "undefined"){
                delete app.globalPlayers[socket.p_id];
            }

            if (typeof socket.viewer_id !== "undefined" && typeof socket.t1 !== "undefined"){
                delete app.viewers[socket.t1][socket.viewer_id];

                if (Object.keys(app.viewers[socket.t1]).length === 0) {
                    delete app.viewers[socket.t1];
                }

            }

        });
    });

    return socketApi
};


 function getRandomId(viewers) {
    let random = Math.random()*100000000000000000;
    if (viewers[random]) {
        getRandomId(viewers);
    } else {
        return random;
    }
}


