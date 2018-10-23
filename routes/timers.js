
const make_draw = require('./make_draw');
const save_result_mongo = require('./save_result_mongo');
const game_over = require('./game_over');
const ObjectId = require('mongodb').ObjectId;


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
        });


        app.mongoDB.collection("users").find({ startTime: { $lte: new Date() }, is_started : 0, is_over : 0 }, function(err, cursor) {
            cursor.forEach(function (game) {
                //сохраняем завершение партии в монго
                app.mongoDB.collection("users").updateOne({_id: parseInt(game._id)},{$set: {is_over : 1}}, function (err, res) {

                    var send_data = {
                        id: game._id,
                    };

                    send_data.p1_won = 0;
                    send_data.p2_won = 1;
                    send_data.p1_id = game.p1_id;
                    send_data.p2_id = game.p2_id;
                    send_data.tourney_id = game.tournament_id;


                    app.io.to(game._id).emit('eventClient', JSON.stringify({
                        event: "game_over",
                        bitch: send_data,
                        is_over: 1
                    }));

                    game_over(send_data, app);

                });

            }, function () {});
        });


        app.mongoDB.collection("users").find({ is_over: 0 }, function(err, cursor) {
            cursor.forEach(function (game) {

                if (typeof app.globalPlayers[game.p1_id] !== "undefined"){
                    app.globalPlayers[game.p1_id].emit('game_start', JSON.stringify({
                        tournament_id: game.tournament_id, game_id : game._id
                    }));
                }

                if (typeof app.globalPlayers[game.p2_id] !== "undefined") {
                    app.globalPlayers[game.p2_id].emit('game_start', JSON.stringify({
                        tournament_id: game.tournament_id, game_id : game._id
                    }));
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

                let who_move_last = "", game_over = false;

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
                    if (mongoGame.p2_time_left + mongoGame.p2_last_move.getTime() < new Date().getTime()) {
                        send_data.p1_won = 1;
                        send_data.p2_won = 0;
                        send_data.p1_id = mongoGame.p1_id;
                        send_data.p2_id = mongoGame.p2_id;
                        send_data.p2_time_left = -1;
                        send_data.p1_time_left = mongoGame.p1_time_left;
                        send_data.tourney_id = mongoGame.tournament_id;
                        game_over = true;
                    }

                } else {
                    //последние ходили черные

                    //истекло ли время белых
                    if (mongoGame.p1_time_left + mongoGame.p1_last_move.getTime() < new Date().getTime()) {
                        send_data.p1_won = 0;
                        send_data.p2_won = 1;
                        send_data.p1_id = mongoGame.p1_id;
                        send_data.p2_id = mongoGame.p2_id;
                        send_data.p1_time_left = -1;
                        send_data.p2_time_left = mongoGame.p2_time_left;
                        send_data.tourney_id = mongoGame.tournament_id;
                        game_over = true;
                    }
                }


                if (game_over) {
                    save_result_mongo(send_data, mongoGame, app);
                }

            }, function () {});
        });
    }, 2000);


}