
const make_draw = require('./make_draw');
const save_result_mongo = require('./save_result_mongo');


module.exports = function (app) {
    const pool = app.pool;
    const socketApi = require('../socketApi')(app);

    setInterval(function () {
      //  console.log("aaa");

        pool
            .query('SELECT * FROM tournaments WHERE is_active = 0 AND start_time < ?', new Date())
            .then(games => {
               // console.log(games);
                if (games.length > 0) {
                    return pool
                        .query('UPDATE tournaments SET is_active = 1  WHERE is_active = 0 AND start_time < ?', new Date()).then(rows => {
                            make_draw({
                                tournament_id : 43,
                                pool : app.pool,
                                app : app,
                            });
                        })
                }
        });


        app.mongoDB.collection("users").find({ startTime: { $lte: new Date() }, is_started : 0, is_over : 0 }, function(err, cursor) {
            cursor.forEach(function (game) {
                console.log(game);
                //current_games[game._id] = game;



                var send_data = {
                    id: game._id,
                };

                send_data.p1_won = 0;
                send_data.p2_won = 1;
                send_data.p1_id = game.p1_id;
                send_data.p2_id = game.p2_id;
                send_data.tourney_id = game.tournament_id;

                //сохраняем завершение партии в монго
                save_result_mongo(send_data, game, app);


                app.io.sockets.emit('eventClient', JSON.stringify({
                    event: "game_over",
                    bitch: send_data,
                    is_over: 1
                }));

                socketApi.game_over(send_data);

            }, function () {



            });
        });


    }, 5000);

}