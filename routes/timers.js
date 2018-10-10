
const make_draw = require('./make_draw');
const save_result_mongo = require('./save_result_mongo');
const game_over = require('./game_over');


module.exports = function (app) {
    const pool = app.pool;

    setInterval(function () {
        pool
            .query('SELECT * FROM tournaments WHERE is_active = 0 AND start_time < ?', new Date())
            .then(games => {
               // console.log(games);
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

                    /*return pool
                        .query('UPDATE tournaments SET is_active = 1  WHERE is_active = 0 AND start_time < ?', new Date()).then(rows => {
                            make_draw({
                                tournament_id : 43,
                                pool : app.pool,
                                app : app,
                            });
                        })*/
                }
        });


        app.mongoDB.collection("users").find({ startTime: { $lte: new Date() }, is_started : 0, is_over : 0 }, function(err, cursor) {
            cursor.forEach(function (game) {
                console.log("game mongo : " + game._id);
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

}