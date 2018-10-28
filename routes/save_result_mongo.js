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
            app.io.to(mongoGame._id).emit('eventClient', {
                event: "game_over",
                "p1_time_left" : msg.p1_time_left,
                "p2_time_left" : msg.p2_time_left,
                "p1_won" : msg.p1_won,
                "p2_won" : msg.p2_won,
                "flagged" : msg.flagged, //кто проиграл по времени
                is_over: 1
            });
    });


}


module.exports = save_result_mongo;