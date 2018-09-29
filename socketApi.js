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

            });
                socket.on('eventServer', function (msg) {
                    try {
                        msg = JSON.parse(msg);
                        console.log(msg);

                        msg.id = parseInt(msg.id);
                        app.mongoDB.collection("users").findOne({_id: msg.id}, function (err, mongoGame) {

                            app.mongoDB.collection("users").updateOne({
                                    _id: msg.id
                                },
                                {
                                    $set: {
                                        "fen": msg.data,
                                        "is_over": msg.is_over,
                                    },
                                    $setOnInsert: {
                                        "moves": [],
                                        "is_over": 0,
                                        "is_started": 1,
                                    }
                                },

                                {upsert: true},
                                function (err, data) {

                                    io.sockets.emit('eventClient', JSON.stringify({
                                        event: "move",
                                        fen: msg.data,
                                        p1_time_left: mongoGame.p1_time_end.getTime() - new Date().getTime(),
                                        p2_time_left: mongoGame.p2_time_end.getTime() - new Date().getTime(),
                                        is_over: msg.is_over
                                    }));

                                    app.mongoDB.collection("users").updateOne({
                                            _id: msg.id
                                        },
                                        {$addToSet: {"moves": msg.move}}
                                    );

                                    if (msg.is_over) {
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
                                                console.log(data);
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
                                    }
                                }
                            );

                        })


                    } catch (e) {
                        console.log(e.message);
                    }
                });


                socket.on('disconnect', function () {
                    console.log('user disconnected');
                });
            });

        socketApi.sendNotification = function () {
            io.sockets.emit('hello', {msg: 'Hello World!'});
        };

        return socketApi
};