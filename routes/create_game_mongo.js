const moment = require('moment');

const create_game_mongo = function (data, app, callback) {
    var startTime = moment(new Date()).add(1, 'm').toDate();
    console.log(data);
    app.mongoDB.collection("users").insertOne({
        "moves": [],
        "is_over": 0,
        "p1_id": data.p1_id,
        "p2_id": data.p2_id,
        "p1_won": 0,
        "p2_won": 0,
        "tournament_id": data.tournament_id,
        "startTime": startTime,
        "p1_name" : data.p1_name,
        "p2_name" : data.p2_name,
        "playzone" : true,
        "amount" : data.amount,
        "p1_last_move": null,
        "p2_last_move": null,
        "p1_time_left": data.amount * 60000,
        "p2_time_left": data.amount * 60000,
        "is_started": 0,
        "time_addition": 0,
    }, callback);

};


module.exports = create_game_mongo;