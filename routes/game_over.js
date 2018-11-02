const save_result = require('./save_result');

const game_over = function (msg, app) {
    console.log("=====");
    console.log(msg);
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
        pool: app.pool,
        app : app,
    });

    if (!isNaN(tournament_id)) {
        respond.then(function (data) {
            app.io.to(msg.id).emit('eventClient', JSON.stringify({
                event: "rating_change",
                rating_change_p1: data.rating_change_p1,
                rating_change_p2: data.rating_change_p2
            }));
        })
    }

}


module.exports = game_over;