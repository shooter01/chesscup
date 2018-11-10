const ObjectId = require('mongodb').ObjectId;

const save_result_mongo = function (msg, mongoGame, app, caller) {
    //console.log("save_result_mongo");
    //console.log(caller);
    //console.log(msg);
   // console.log(mongoGame);
   // console.log("==================================================");

    let obj1 = {
        "is_over": 1,
        "p1_time_left" : msg.p1_time_left,
        "p2_time_left" : msg.p2_time_left,
        "p1_won" : msg.p1_won,
        "p2_won" : msg.p2_won,
        "reason" : msg.reason,
    };

    if (!mongoGame) {
        //console.log("Игра не найдена (save_result_mongo)");
        //console.log("Полученные данные:");
        //console.log(msg);
        //console.log("Данные игры");
        //console.log(mongoGame);
        const a = {
            event: "game_aborted",
        };
        app.ROOMS.emit(msg.id, JSON.stringify(a));
        return false;
    }




    let temp;
    if (msg.tourney_id) {
        temp = {_id: msg.id};
    } else {
        temp = {_id: ObjectId(msg.id)};
    }



  app.mongoDB.collection("users").updateOne(
        temp,
        {$set: obj1},
        {
            writeConcern: true
        }, function (err, res) {

          app.ROOMS.emit(mongoGame._id, JSON.stringify({
              action: "game_over",
              "p1_time_left" : msg.p1_time_left,
              "p2_time_left" : msg.p2_time_left,
              "p1_won" : msg.p1_won,
              "p2_won" : msg.p2_won,
              "reason" : msg.reason,
              "flagged" : msg.flagged, //кто проиграл по времени
              is_over: 1
          }));


          //app.io.to(mongoGame._id).emit('eventClient', );
    });



}


module.exports = save_result_mongo;