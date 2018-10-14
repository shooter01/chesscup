var socket_io = require('socket.io');
var io = socket_io();
var socketApi = {};

socketApi.io = io;
var Elo = require('arpad');
var uscf = {
    default: 20,
    2100: 15,
    2400: 10
};

var min_score = 100;
var max_score = 10000;
const save_result = require('./routes/save_result');
const game_over = require('./routes/game_over');
const save_result_mongo = require('./routes/save_result_mongo');
const bluebird = require('bluebird');


let online_players = {};

var elo = new Elo(uscf, min_score, max_score);

module.exports = function (app) {

    const pool = bluebird.promisifyAll(app.pool);

    io.on('connection', function (socket) {

        var handshakeData = socket.request;
        let data = handshakeData._query;

        if (handshakeData._query['h'] && handshakeData._query['h'] != "undefined") {
            socket.p_id = data.h;
            app.globalPlayers[socket.p_id] = socket;
        }

        if ((handshakeData._query['t1'] && handshakeData._query['t1'] != "undefined")) {
            socket.join('t' + handshakeData._query['t1']);


        }
        console.log(Object.keys(app.globalPlayers));

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
                JSON.stringify(online_players[handshakeData._query['g']]));


           // io.sockets.emit('playerOnline', JSON.stringify(online_players[handshakeData._query['g']]));

           // console.log(Object.keys(app.globalPlayers).length);



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
                    } else {
                        console.log("GAME : " + handshakeData._query['g'] + " NOT FOUND");
                    }


                });

            socket.on('eventServer', function (msg) {
                try {
                    msg = JSON.parse(msg);
                    console.log(msg);
                    console.log(socket.p_id);
                    msg.id = parseInt(msg.id);
                    app.mongoDB.collection("users").findOne({_id: msg.id}, function (err, mongoGame) {


                        var obj = {
                            "fen": msg.data,
                            "is_over": msg.is_over,
                            "is_started" : 1
                        }

                        var p_time_left;
                        var p__another_time_left;
                        var actual_time = new Date().getTime();
                        if (msg.player === "p1") {
                            p_time_left = "p1_time_left";
                            p__another_time_left = "p2_time_left";
                            var lm = (mongoGame.p1_last_move) ? mongoGame.p1_last_move.getTime() : actual_time;
                            var spent_time = actual_time - lm;
                            // console.log("spent_time : " + spent_time/1000  + " s");
                            obj[p_time_left] = mongoGame.p1_time_left - spent_time;
                            obj.p2_last_move = new Date();

                        } else if (msg.player === "p2") {
                            p_time_left = "p2_time_left";
                            p__another_time_left = "p1_time_left";

                            // var p2_time_left = mongoGame.p2_time_left.getTime() - new Date().getTime();
                            var lm = (mongoGame.p2_last_move) ? mongoGame.p2_last_move.getTime() : actual_time;
                            var spent_time = actual_time - lm;
                            //   console.log("spent_time : " + spent_time/1000  + " s");
                            obj[p_time_left] = mongoGame.p2_time_left - spent_time;
                            obj.p1_last_move = new Date();
                        }


                        //  console.log(mongoGame);

                        app.mongoDB.collection("users").updateOne({
                                _id: msg.id
                            },
                            {
                                $set: obj,
                                $setOnInsert: {
                                    "moves": [],
                                    "is_over": 0,
                                }
                            },

                            {upsert: true},
                            function (err, data) {


                                var a = {
                                    event: "move",
                                    fen: msg.data,
                                    san: msg.move,
                                    captured: msg.captured,
                                    from: msg.from,
                                    to: msg.to,
                                    // p1_time_left: mongoGame.p1_time_end.getTime() - new Date().getTime(),
                                    // p2_time_left: mongoGame.p2_time_end.getTime() - new Date().getTime(),
                                    is_over: msg.is_over
                                };

                                a[p_time_left] = obj[p_time_left];
                                a[p__another_time_left] = mongoGame[p__another_time_left];


                                io.to(msg.id).emit('eventClient', JSON.stringify(a));

                                //io.sockets.emit('eventClient', JSON.stringify(a));

                                app.mongoDB.collection("users").updateOne({
                                        _id: parseInt(msg.id)
                                    },
                                    {$push: {"moves": msg.move}}
                                );

                                if (msg.is_over == 1) {
                                    game_over(msg, app);
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

                // console.log(msg);

                if (msg.id) {
                    app.mongoDB.collection("users").findOne({_id: parseInt(msg.id)}, function (err, mongoGame) {
                        //console.log(mongoGame);


                        if (mongoGame && mongoGame.p2_last_move && (mongoGame.p2_last_move.getTime() - new Date().getTime()) <= 0) {

                        } else if (mongoGame && mongoGame.p2_last_move && (mongoGame.p2_last_move.getTime() - new Date().getTime()) <= 0){

                        } else {
                            return false;
                        }

                        //сохраняем завершение партии в монго
                        save_result_mongo(msg, mongoGame, app);

                        io.to(msg.id).emit('eventClient', JSON.stringify({
                            event: "game_over",
                            bitch: msg,
                            is_over: 1
                        }));

                        /*io.sockets.emit('eventClient', JSON.stringify({
                            event: "game_over",
                            bitch: msg,
                            is_over: 1
                        }));*/

                        game_over(msg, app);

                    });
                } else {
                    console.log("id not defined");
                }


            });

            socket.on('playerOnOff', function (data) {
                data = JSON.parse(data);
                io.to(data.game_id).emit('playerOnline', JSON.stringify(online_players[data.game_id]));

               // io.sockets.emit('playerOnline', JSON.stringify(online_players[data.game_id]));
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
        }

        socket.on('disconnect', function () {
            console.log("disconnect");
            console.log(Object.keys(app.globalPlayers));

            if (typeof online_players[socket.game_id] !== "undefined"
                && typeof online_players[socket.game_id][this.p_id] !== "undefined") {
                online_players[socket.game_id][socket.p_id] = --online_players[socket.game_id][socket.p_id];

                if (online_players[socket.game_id][socket.p_id] <= 0) {
                    delete online_players[socket.game_id][socket.p_id];
                    io.to(socket.game_id).emit('playerOnline', JSON.stringify(online_players[socket.game_id]));
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


          //  console.log(Object.keys(app.globalPlayers));
          //  console.log(Object.keys(app.viewers).length);

           // console.log('user disconnected');
        });
    });

        socketApi.game_over = function (msg) {

        };
        socketApi.sendNotification = function () {
            io.sockets.emit('hello', {msg: 'Hello World!'});
        };



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


