
const make_draw = require('./make_draw');
const save_result_mongo = require('./save_result_mongo');
const game_over = require('./game_over');
const ObjectId = require('mongodb').ObjectId;
const is_draw = require('./is_draw');


module.exports = function (app) {
    const pool = app.pool;

    setInterval(function () {
        pool
            .query('SELECT * FROM tournaments WHERE is_active = 0 AND start_time < ?', new Date())
            .then(games => {
                if (games.length > 0) {

                    for (var i = 0; i < games.length; i++) {
                        var obj = games[i];
                        pool
                            .query('UPDATE tournaments SET is_active = 1  WHERE is_active = 0 AND start_time < ?', new Date()).then(rows => {

                                make_draw({
                                    tournament_id : obj.id,
                                    pool : app.pool,
                                    app : app,
                                });
                            })
                    }
                }
        }).catch(function (err) {
            console.log(err);
        });


       app.mongoDB.collection("users").find({ startTime: { $lte: new Date() }, is_started : 0, is_over : 0 }, function(err, cursor) {
            cursor.forEach(function (game) {
                var send_data = {
                    id : game._id
                };

                if (game.p2_last_move == null) {
                    //черные выиграли так как белые не сходили
                    send_data.p1_won = 0;
                    send_data.p2_won = 1;
                    send_data.reason = "whitedidntmove";
                } else if (game.p1_last_move == null) {
                    //белые выиграли так как черные не сходили
                    send_data.p1_won = 1;
                    send_data.p2_won = 0;
                    send_data.reason = "blackdidntmove";
                }


                send_data.p1_id = game.p1_id;
                send_data.p2_id = game.p2_id;
                send_data.p1_time_left = game.p2_time_left;
                send_data.p2_time_left = game.p2_time_left;
                send_data.tourney_id = game.tournament_id;
                send_data.caller = "timers";

                //сохраняем завершение партии в монго
                save_result_mongo(send_data, game, app, "startTime: { $lte: new Date() }, is_started : 0, is_over : 0");

                if (game.tournament_id) {
                    game_over(send_data, app);
                }



            }, function () {});
        });


        app.mongoDB.collection("users").find({ is_over: 0 }, function(err, cursor) {
            cursor.forEach(function (game) {


               if (typeof app.globalPlayers[game.p1_id] !== "undefined"){
                    app.globalPlayers[game.p1_id].emit('eventClient', {
                        event : "start_game",
                        tournament_id: game.tournament_id,
                        game_id : game._id
                    });
                }

                if (typeof app.globalPlayers[game.p2_id] !== "undefined") {
                    app.globalPlayers[game.p2_id].emit('eventClient', {
                        event : "start_game",
                        tournament_id: game.tournament_id,
                        game_id : game._id
                    });
                }



            }, function () {});
        });

    }, 5000);

    setInterval(function () {
        app.mongoDB.collection("users").find({ is_started : 1, is_over : 0 }, function(err, cursor) {
            cursor.forEach(function (mongoGame) {
                //debugger;
                var send_data = {
                    id: mongoGame._id,
                };

                let who_move_last = "", is_over = false;

                //белые пошли а черные не ответили
                if (mongoGame.p1_last_move == null) {
                    who_move_last = "p1";
                } else if (mongoGame.p2_last_move.getTime() < mongoGame.p1_last_move.getTime()) {
                    who_move_last = "p2";
                } else {
                    who_move_last = "p1";
                }

                //последний кто двигал фигуры - белые
                if (who_move_last === "p1") {
                    //истекло ли время черных
                    if (mongoGame.p2_last_move !== null && (mongoGame.p2_time_left + mongoGame.p2_last_move.getTime() + 1000) < new Date().getTime()) {
                        if (is_draw(mongoGame, "black")) {
                            send_data.p1_won = 0.5;
                            send_data.p2_won = 0.5;
                            send_data.reason = "insufficient_material";
                        } else {
                            send_data.p1_won = 1;
                            send_data.p2_won = 0;
                            send_data.reason = "time_run_out";
                        }
                        send_data.p1_id = mongoGame.p1_id;
                        send_data.p2_id = mongoGame.p2_id;
                        send_data.p2_time_left = 0;
                        send_data.p1_time_left = mongoGame.p1_time_left;
                        send_data.tourney_id = mongoGame.tournament_id;
                        is_over = true;
                    }

                } else {
                    //последние ходили черные

                    //истекло ли время белых
                    if (mongoGame.p1_last_move !== null && (mongoGame.p1_time_left + mongoGame.p1_last_move.getTime() + 1000) < new Date().getTime()) {
                        if (is_draw(mongoGame, "white")) {
                            send_data.p1_won = 0.5;
                            send_data.p2_won = 0.5;
                            send_data.reason = "insufficient_material";
                        } else {
                            send_data.p1_won = 0;
                            send_data.p2_won = 1;
                            send_data.reason = "time_run_out";
                        }
                        send_data.p1_id = mongoGame.p1_id;
                        send_data.p2_id = mongoGame.p2_id;
                        send_data.p1_time_left = 0;
                        send_data.p2_time_left = mongoGame.p2_time_left;
                        send_data.tourney_id = mongoGame.tournament_id;
                        is_over = true;
                    }
                }


                if (is_over) {
                    //console.log('если это турнирная партия сохранияем в mysql');
                    //console.log(send_data);
                    send_data.caller = "timers";
                    save_result_mongo(send_data, mongoGame, app, "setInterval");
                }


                //если это турнирная партия сохранияем в mysql
                if (send_data.tourney_id != null) {
                    game_over(send_data, app);
                }

            }, function () {});
        });
    }, 2000);


}