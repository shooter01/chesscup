
const make_draw = require('./make_draw');
const save_result_mongo = require('./save_result_mongo');
const game_over = require('./game_over');
const ObjectId = require('mongodb').ObjectId;
const is_draw = require('./is_draw');
const moment = require('moment');


module.exports = function (app) {
    const pool = app.pool;

    setInterval(function () {
        pool
            .query('SELECT * FROM tournaments WHERE is_online = 1 AND is_active = 0 AND start_time < ?', new Date())
            .then(games => {
                if (games.length > 0) {
                   // console.log(games);
                    for (var i = 0; i < games.length; i++) {
                        var obj = games[i];
                        //pool
                        //    .query('UPDATE tournaments SET is_active = 1  WHERE is_active = 0 AND start_time < ?', new Date()).then(rows => {

                                make_draw({
                                    tournament_id : obj.id,
                                    pool : app.pool,
                                    app : app,
                                });
                           // })
                    }
                }
        }).catch(function (err) {
            console.log("ERROR");
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
                console.log("TIMERS SAVE RESULT1");
                console.log(game);

                if (game.tournament_id) {
                    console.log("TIMERS SAVE RESULT2");
                    game_over(send_data, app);
                }



            }, function () {});
        });


        app.mongoDB.collection("users").find({ is_over: 0 }, function(err, cursor) {
            cursor.forEach(function (game) {

               // console.log(Object.keys(app.globalPlayers));
               if (typeof app.globalPlayers[game.p1_id] !== "undefined"){
                    app.globalPlayers[game.p1_id].send(JSON.stringify({
                        action : "start_game",
                        tournament_id: game.tournament_id,
                        game_id : game._id
                    }));
                }

                if (typeof app.globalPlayers[game.p2_id] !== "undefined") {
                    app.globalPlayers[game.p2_id].send(JSON.stringify({
                        action : "start_game",
                        tournament_id: game.tournament_id,
                        game_id : game._id
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




    //раз в полчаса проверяем на авто турниры
    setInterval(function () {

        const cur = new Date();

        if (cur.getHours() >= 1 && cur.getHours() < 4) {
            const time_start = "20:00:00";
            const time_start2 = "21:00:00";

            let newDateObj = moment(cur.getDate() + "-" + (cur.getMonth() + 1) + "-" + cur.getFullYear() + " " + time_start, 'DD-MM-YYYYTHH:mm').toDate();
            let newDateObj2 = moment(cur.getDate() + "-" + (cur.getMonth() + 1) + "-" + cur.getFullYear() + " " + time_start, 'DD-MM-YYYYTHH:mm').toDate();
            const yyyy = "" + cur.getFullYear() + (cur.getMonth() + 1) + cur.getDate();
            let office = {
                title: "Ежедневный блиц-турнир",
                city: "Moscow",
                tours_count: 9,
                country: 'RU',
                type: 2,
                time_inc: 0,
                is_active : 0,
                start_date: cur,
                amount: 3,
                start_time: newDateObj,
                is_online: 1,
                // wait_minutes: parseInt(req.body.wait_minutes),
                accurate_date_start: cur.getFullYear() + "-" + (cur.getMonth() + 1) + "-" + cur.getDate(),
                accurate_time_start: time_start,
                end_date: cur.getFullYear() + "-" + (cur.getMonth() + 1) + "-" + cur.getDate(),
                team_boards: null,
                start_type: 'accurate',
                current_tour: 0,
                created_at: new Date(),
                system_id: yyyy + 'BLITZROBIN30',
                creator_id: 1,
                is_system: 1,
            };


            let team = {
                title: "Ежедневный командный блиц-турнир",
                city: "Moscow",
                tours_count: 9,
                country: 'RU',
                type: 12,
                time_inc: 0,
                is_active : 0,
                start_date: cur,
                amount: 3,
                start_time: newDateObj2,
                is_online: 1,
                // wait_minutes: parseInt(req.body.wait_minutes),
                accurate_date_start: cur.getFullYear() + "-" + (cur.getMonth() + 1) + "-" + cur.getDate(),
                accurate_time_start: time_start,
                end_date: cur.getFullYear() + "-" + (cur.getMonth() + 1) + "-" + cur.getDate(),
                team_boards: 2,
                start_type: 'accurate',
                current_tour: 0,
                created_at: new Date(),
                system_id: yyyy + 'TEAMBROBIN30',
                creator_id: 1,
                is_system: 1,
            };

            pool
                .query('SELECT * FROM tournaments WHERE is_online = 1 AND is_system = 1 AND system_id = ?', yyyy + 'BLITZROBIN30')
                .then(games => {
                    if (games.length === 0) {
                        return pool.query('INSERT INTO tournaments SET ?', office)
                    } else {
                        return true;
                    }
                }).then(games => {

                        return pool
                            .query('SELECT * FROM tournaments WHERE is_online = 1 AND is_system = 1 AND system_id = ?', yyyy + 'TEAMBROBIN30')

                }).then(games => {
                    if (games.length === 0) {
                        return pool.query('INSERT INTO tournaments SET ?', team)
                    } else {
                        return true;
                    }
                }).then(games => {
                    return pool.query('DELETE FROM tournaments WHERE is_canceled = ?', 1);
                }).catch(function (err) {
                    console.log("ERROR");
                    console.log(err);
                });
        }



       // let newDateObj = cur.getFullYear() + "-" + cur.getDate() + "-" + cur.getDate() +" " + "23:00:00";


    }, 1800000);
}