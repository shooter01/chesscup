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
const bluebird = require('bluebird');

var elo = new Elo(uscf, min_score, max_score);

module.exports = function (app) {

    const pool = bluebird.promisifyAll(app.pool);

    io.on('connection', function (socket) {

        var handshakeData = socket.request;

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
                //console.log(msg);
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
                        var lm = (mongoGame.p1_last_move) ? mongoGame.p1_last_move.getTime() : actual_time
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
                            // p1_time_left: mongoGame.p1_time_end.getTime() - new Date().getTime(),
                            // p2_time_left: mongoGame.p2_time_end.getTime() - new Date().getTime(),
                            is_over: msg.is_over
                        };

                        a[p_time_left] = obj[p_time_left];
                        a[p__another_time_left] = mongoGame[p__another_time_left];


                            io.sockets.emit('eventClient', JSON.stringify(a));

                            app.mongoDB.collection("users").updateOne({
                                    _id: parseInt(msg.id)
                                },
                                {$addToSet: {"moves": msg.move}}
                            );

                            if (msg.is_over == 1) {
                                socketApi.game_over(msg);
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
                    console.log(mongoGame);


                    if (mongoGame && mongoGame.p2_last_move && (mongoGame.p2_last_move.getTime() - new Date().getTime()) <= 0) {

                    } else if (mongoGame && mongoGame.p2_last_move && (mongoGame.p2_last_move.getTime() - new Date().getTime()) <= 0){

                    } else {
                        return false;
                    }


                        io.sockets.emit('eventClient', JSON.stringify({
                            event: "game_over",
                            bitch: msg,
                            is_over: 1
                        }));

                        socketApi.game_over(msg);



                        var obj = {
                            "fen": msg.data,
                            "is_over": 1,
                        }

                        var p_time_left;
                        var p__another_time_left;
                        var actual_time = new Date().getTime();
                        if (msg.player === "p1") {
                            p_time_left = "p1_time_left";
                            p__another_time_left = "p2_time_left";
                            var lm = (mongoGame.p1_last_move) ? mongoGame.p1_last_move.getTime() : actual_time;
                            var spent_time = actual_time - lm;
                            obj[p_time_left] = mongoGame.p1_time_left - spent_time;
                            obj.p2_last_move = new Date();

                        } else if (msg.player === "p2") {
                            p_time_left = "p2_time_left";
                            p__another_time_left = "p1_time_left";
                            var lm = (mongoGame.p2_last_move) ? mongoGame.p2_last_move.getTime() : actual_time;
                            var spent_time = actual_time - lm;
                            obj[p_time_left] = mongoGame.p2_time_left - spent_time;
                            obj.p1_last_move = new Date();
                        }

                        console.log("=====================");
                        console.log(obj);

                        //  console.log(mongoGame);

                        app.mongoDB.collection("users").updateOne({_id: parseInt(msg.id)},{$set: obj}, function () {
                            console.log(arguments);
                        });






                });
            } else {
                console.log("id not defined");
            }


        });

        socket.on('disconnect', function () {
            console.log('user disconnected');
        });
    });

        socketApi.game_over = function (msg) {
            //console.log(msg);
            let tournament_id = msg.tourney_id;
            let result = {
                p1_id: msg.p1_id,
                p2_id: msg.p2_id,
                p1_won: msg.p1_won,
                p2_won: msg.p2_won
            };


            var respond = save_result({
                tournament_id: parseInt(tournament_id),
                result: result,
                pool: pool,
            });

            if (!isNaN(tournament_id)) {
                respond.then(function (data) {
                    //console.log(data);
                    io.sockets.emit('eventClient', JSON.stringify({
                        event: "rating_change",
                        rating_change_p1: data.rating_change_p1,
                        rating_change_p2: data.rating_change_p2
                    }));

                })
            } else {
                /*res.json({
                 "status": "error",
                 "msg": "tournament_id не определен",
                 });*/
            }
        };
        socketApi.sendNotification = function () {
            io.sockets.emit('hello', {msg: 'Hello World!'});
        };

        return socketApi
};