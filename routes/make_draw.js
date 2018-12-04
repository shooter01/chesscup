const DRAW = require('./draw_functions');
const moment = require('moment');
const invite_user_to_game = require('./invite_user_to_game');
const create_game_mongo = require('./create_game_mongo');
const bluebird = require('bluebird');

DRAW.makeResultsForSwissSystem = bluebird.promisifyAll(DRAW.makeResultsForSwissSystem)

const make_draw = function (data) {
    const tournament_id = data.tournament_id;
    const pool = data.pool;
    const req = data.req;
    const res = data.res;
    let app = data.app;

    if (!tournament_id) {
        console.log("tournament_id not defined");
        return false
    }
    let let_insert = true;
    let let_tournament_insert = true;

    let tourney,
        participants = [],
        participants_object = {}, //объект участников,
        bye_participants = {}, //кто покинул турнир
        scores_array = [], //массив для добавления в tournament_scores
        tournament_results = [];

    //console.log(tournament_id);

    if (!isNaN(tournament_id)) {

        pool
            .query('SELECT * FROM tournaments WHERE id = ?', tournament_id)
            .then(rows => {
                tourney = rows[0];
            })
            .then(res => {
                if (tourney.is_closed === 1) {
                    throw new Error("Tournament closed");
                }

                //собираем участников
                return  pool.query("SELECT * FROM tournaments_participants WHERE tournament_id = ?", tourney.id);
            })
            .then(rows => {
                participants = rows;
                //собираем результаты
                return  pool.query("SELECT * FROM tournaments_results WHERE tournament_id = ?", tourney.id);
            })
            .then(rows => {

                if (participants.length < 2) {
                    pool.query('UPDATE tournaments SET ? WHERE tournaments.id = ?',[{
                        current_tour : 0,
                        is_active : 1,
                        is_closed : 1,
                        is_canceled : 1,
                    }, tourney.id]).then(function () {

                        console.log("CANCELED");


                        app.ROOMS.emit('t' + tournament_id,
                            JSON.stringify({
                                "action" : "tournament_event"
                            }));
                    });
                    throw new Error("Too small quantity of participants");
                }


                tournament_results = rows;

                //создает объект участников - ключ - id участника - значение - сколько набрал очков
                participants_object = DRAW.makeObject(tournament_results);

                bye_participants = DRAW.getByePlayers(participants);


                if (tourney.current_tour !== 0) {
                    //проверяем пустые результаты
                    if (DRAW.checkEmptyResults(tournament_results, tourney)) {
                        throw new Error("Fill all results");
                    }
                }

              //  var g = DRAW.makeResultsForRoundRobinSystem(tournament_results, participants, tourney);
                return DRAW.makeResultsForSwissSystem(tournament_results, participants, tourney, bye_participants, pool).then(function (g) {

                    console.log("ggg");
                    console.log(g);


                    const pairs = DRAW.sortSwiss(g.swiss, participants_object);



                    const berger_object = g.berger_object;
                    const colors = g.colors;
                    const for_addition = DRAW.makeInsertObject(pairs, participants_object, tourney, {}, colors);
                    const berger = DRAW.sumBergerObject(berger_object, participants_object);

                    const buhgolz = DRAW.getBuhgolz(tournament_results, participants_object);
                    scores_array = DRAW.makeScoresArray(participants_object, berger, buhgolz, tourney);

                    if (let_insert && ((tourney.current_tour + 1) <= tourney.tours_count)) {
                        return pool.query('INSERT INTO tournaments_results (' +
                            'p1_id, p2_id, p1_won, p2_won,p1_scores,p2_scores, tournament_id,created_at,tour,board, ' +
                            'rating_change_p1, rating_change_p2, p1_rating_for_history, p2_rating_for_history) VALUES ?',
                            [for_addition]);
                    } else {
                        return true;
                    }

                });


               // throw new Error("STOPPED");








        }).then((rows, error) => {

            //console.log("PROCCESS");
            //console.log(arguments);

            if (tourney.current_tour != 0) {
                return pool.query('INSERT INTO tournaments_scores (user_id, tournament_id, tour, scores, bh, rating, rating_change, berger) VALUES ?', [scores_array])
            }
            //throw new Error("STOPPED");

        }).then(function(){
            return  pool.query("SELECT * FROM tournaments_results WHERE tournament_id = ? AND tour = ?", [tourney.id, tourney.current_tour + 1]);
        }).then(function(data){


                if (data && data.length && tourney.is_online == 1) {
                    var newDateObj = moment(new Date()).add(30, 'm').toDate();
                    var addition = [];
                    const startTime = moment(new Date()).add(1, 'm').toDate();

                    for (var i = 0; i < data.length; i++) {
                        var obj = data[i];
                        //console.log(obj);



                        if (obj.p1_id != null && obj.p2_id != null) {


                            let temp = {
                                _id : obj.id,
                                "moves": [],
                                "is_over": 0,
                                "p1_id": obj.p1_id,
                                "p2_id": obj.p2_id,
                                "p1_won": 0,
                                "p2_won": 0,
                                "tournament_id": tournament_id,
                                "startTime": startTime,
                                "playzone" : false,
                                "time_inc" :  tourney.time_inc * 1000,
                                "amount" : tourney.amount,
                                "p1_last_move": null,
                                "p2_last_move": null,
                                "p1_time_left": tourney.amount * 60000,
                                "p2_time_left": tourney.amount * 60000,
                                "is_started": 0,
                                "reason": null,
                                "time_addition": 0,
                            };

                            addition.push(temp);
                        }
                    }


                   // console.log(addition);

                    app.mongoDB.collection("users").insertMany(addition);
                }
            }).then(function(){

                const tours_count = DRAW.getToursCount(tourney, participants);


            if (let_insert || let_tournament_insert) {
              //  console.log("PROCCESS2");
              //  console.log(arguments);
                if (tourney.current_tour < tourney.tours_count) {
                    return pool.query('UPDATE tournaments SET ? WHERE tournaments.id = ?',[{
                        current_tour : tourney.current_tour + 1,
                        is_active : 1,
                        tours_count : tours_count
                    },tourney.id]);
                } else {
                    return pool.query('UPDATE tournaments SET ? WHERE tournaments.id = ?',[{
                        current_tour : tourney.current_tour + 1,
                        is_active : 1,
                        is_closed : 1,
                    }, tourney.id]);

                }
            }
        }).then(rows => {

                var tour = ((tourney.current_tour + 1) <= tourney.tours_count) ? tourney.current_tour + 1 : null;

                app.mongoDB.collection("cache").deleteMany({tournament_id: tourney.id}, function (err, mongoGame) {
                    app.ROOMS.emit('t' + tournament_id,
                        JSON.stringify({
                            "action" : "tournament_event"
                        }));
                });

                if (typeof res != "undefined") {
                    res.json({
                        "status": "ok",
                        "updated_tour" : tour
                    });
                }

            }).catch(function (err) {
                console.log(err);
                if (typeof res != "undefined") {
                    res.json({
                        "status": "error",
                        "msg": err.message
                    });

                }
        });

    } else {
        res.json({
            "status": "error",
            "msg": "tournament_id is null",
        });
    }

}


module.exports = make_draw;