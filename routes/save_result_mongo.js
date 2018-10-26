const ObjectId = require('mongodb').ObjectId;

const save_result_mongo = function (msg, mongoGame, app) {

    var obj = {
        "is_over": 1,
        "p1_time_left" : msg.p1_time_left,
        "p2_time_left" : msg.p2_time_left,
        "p1_won" : msg.p1_won,
        "p2_won" : msg.p2_won,
    };
    console.log("save_result_mongo");
    console.log(msg);
    console.log(mongoGame);
    if (msg && mongoGame) {
        msg["fen"] = msg.data;
        var p_time_left;
        var p__another_time_left;
        var actual_time = new Date().getTime();

        var actual_time = new Date().getTime();
        var p_time_left, lm, spent_time;
        var p__another_time_left;
/*        if (msg.player === "p1") {
            p_time_left = "p1_time_left";
            p__another_time_left = "p2_time_left";

            //если премув - время не отнимается
            if (msg.premoved || !mongoGame.p1_made_move || !mongoGame.p2_made_move) {
                obj[p_time_left] = mongoGame.p1_time_left;
                obj["p1_made_move"] = true;
            } else {
                lm = (mongoGame.p1_last_move) ? mongoGame.p1_last_move.getTime() : actual_time;
                spent_time = actual_time - lm;
                obj[p_time_left] = mongoGame.p1_time_left - spent_time;
            }

            obj.p2_last_move = new Date();
            game_over = (obj[p_time_left] < 0);

        } else if (msg.player === "p2") {
            p_time_left = "p2_time_left";
            p__another_time_left = "p1_time_left";

            //если премув - время не отнимается
            if (msg.premoved || !mongoGame.p1_made_move || !mongoGame.p2_made_move) {
                obj[p_time_left] = mongoGame.p2_time_left;
                obj["p2_made_move"] = true;
            } else {
                lm = (mongoGame.p2_last_move) ? mongoGame.p2_last_move.getTime() : actual_time;
                spent_time = actual_time - lm;
                obj[p_time_left] = mongoGame.p2_time_left - spent_time;
            }

            obj.p1_last_move = new Date();
            game_over = (obj[p_time_left] < 0);

        }*/


        /*if (msg.player === "p1") {
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
        }*/
    }


    let temp;
    if (msg.tourney_id) {
        temp = {_id: msg.id};
    } else {
        temp = {_id: ObjectId(msg.id)};
    }

    app.mongoDB.collection("users").updateOne(
        temp,
        {$set: obj},
        {
            writeConcern: true
        }, function (err, res) {
            app.io.to(mongoGame._id).emit('eventClient', JSON.stringify({
                event: "game_over",
                "p1_time_left" : msg.p1_time_left,
                "p2_time_left" : msg.p2_time_left,
                "p1_won" : msg.p1_won,
                "p2_won" : msg.p2_won,
                is_over: 1
            }));
       // console.log(res);
    });


}


module.exports = save_result_mongo;