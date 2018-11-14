const DRAW = require('./draw_functions');
const moment = require('moment');
const invite_user_to_game = require('./invite_user_to_game');
const create_game_mongo = require('./create_game_mongo');

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
                tournament_results = rows;


                //создает объект участников - ключ - id участника - значение - сколько набрал очков
                participants_object = DRAW.makeObject(tournament_results);

                bye_participants = DRAW.getByePlayers(participants);
                console.log(bye_participants);

                if (tourney.current_tour !== 0) {
                    //проверяем пустые результаты
                    if (DRAW.checkEmptyResults(tournament_results, tourney)) {
                        throw new Error("Fill all results");
                    }
                }

                var g = DRAW.makeResultsForSwissSystem(tournament_results, participants, tourney, bye_participants);

                const pairs = DRAW.sortSwiss(g.swiss, participants_object);

                for (var i = 0; i < pairs.length; i++) {
                    var obj = pairs[i];
                    console.log(participants_object[obj.home] + participants_object[obj.away]);
                    console.log(obj.home + "==" + obj.away);
                }
                console.log(bye_participants);

               // throw new Error("STOPPED");
                const berger_object = g.berger_object;
                const colors = g.colors;



                console.log(colors);
                var for_addition = DRAW.makeInsertObject(pairs, participants_object, tourney, {}, colors);
                const berger = DRAW.sumBergerObject(berger_object, participants_object);
                console.log(berger_object);
                console.log(berger);

                console.log("=======");

                var buhgolz = DRAW.getBuhgolz(tournament_results, participants_object);
                scores_array = DRAW.makeScoresArray(participants_object, berger, buhgolz, tourney);
                console.log(for_addition)
               // throw new Error("STOPPED");

                if (let_insert && ((tourney.current_tour + 1) <= tourney.tours_count)) {
                      return pool.query('INSERT INTO tournaments_results (' +
                          'p1_id, p2_id, p1_won, p2_won,p1_scores,p2_scores, tournament_id,created_at,tour,board, ' +
                          'rating_change_p1, rating_change_p2, p1_rating_for_history, p2_rating_for_history) VALUES ?',
                          [for_addition]);
                } else {
                    return true;
                }





        }).then(rows => {
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


                    console.log(addition);

                    app.mongoDB.collection("users").insertMany(addition);
                }
            }).then(function(){

            if (let_insert || let_tournament_insert) {
                if (tourney.current_tour < tourney.tours_count) {
                    return pool.query('UPDATE tournaments SET ? WHERE tournaments.id = ?',[{
                        current_tour : tourney.current_tour + 1,
                        is_active : 1,
                    },tourney.id]);
                } else {
                    return pool.query('UPDATE tournaments SET ? WHERE tournaments.id = ?',[{
                        current_tour : tourney.current_tour + 1,
                        is_active : 1,
                        is_closed : 1
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

            })
                //фильтруем результаты тура
                //отдает объект в виде - название id команды - количество очков за тур
                //var temp = DRAW.filterResults(current_tour_results);

                //var current_tour_results_filtered = temp.filtered;
                //change_rating = temp.ratings;
                //bye_participants = temp.bye_participants;

                //отдает объект с суммой всех очков участников
                //for_addition - массив готовый к вставке в базу
                //overall - объект с ключами - id юзера, значение - сколько очков набрал
                //after_tour_results_sum = DRAW.makeSum(current_tour_results_filtered, participants_object, tourney);

            //})

          //  .then(rows => {
                //делаем пары и создаем бергер объект
                //пары вида массив с { home: 178, away: 184 }
                //бергер объект '178': { wins: [Object], draw: {} }

               // pairs = g.swiss;
               // berger_object = g.berger_object;
              //  colors = g.colors;

                //считаем бергер объект
              //  berger_object = DRAW.sumBergerObject(berger_object, after_tour_results_sum.overall);

           //     return pool
            //        .query('SELECT tr.p1_id,tr.p2_id FROM tournaments_results tr WHERE tr.tournament_id = ?', [tournament_id])

            // .then(rows => {
                //считаем сумму очков противников для бухгольца
           //     played_arrays = DRAW.makePlayedArray(rows, after_tour_results_sum.overall);
            //    return  pool.query("SELECT * FROM tournaments_scores WHERE tournament_id = ? AND tour = ?", [tourney.id, tourney.scores]);
            //})
          //  .then(rows => {

                //создает массив для вставки в tournament_results
                //если противника нет ставит 1 : 0
                //сортирует по очкам


                // console.log(for_addition);



              //  if (let_insert && tourney.type < 10 && ((tourney.current_tour + 1) <= tourney.tours_count)) {
              //      return pool.query('INSERT INTO tournaments_results (p1_id, p2_id, p1_won, p2_won,p1_scores,p2_scores, tournament_id,created_at,tour,board, rating_change_p1, rating_change_p2, p1_rating_for_history, p2_rating_for_history) VALUES ?', [for_addition]);
            //    }
         //   })
            .then(function(data){


             //   if (data && data.insertId){

             //       return  pool.query("SELECT * FROM tournaments_results WHERE tournament_id = ? AND tour = ?", [tourney.id, tourney.current_tour + 1]);
             //   }


            })
            .then(function(){

              /*  if (let_insert || let_tournament_insert) {
                    if (tourney.current_tour < tourney.tours_count) {
                        return pool.query('UPDATE tournaments SET ? WHERE tournaments.id = ?',[{
                            current_tour : tourney.current_tour + 1,
                            is_active : 1,
                        },tourney.id]);
                    } else {
                        return pool.query('UPDATE tournaments SET ? WHERE tournaments.id = ?',[{
                            current_tour : tourney.current_tour + 1,
                            is_active : 1,
                            is_closed : 1
                        }, tourney.id]);

                    }
                }*/
            })
            .then(rows => {
                /*if (let_insert) {
                    return pool
                        .query('DELETE FROM tournaments_scores WHERE tournament_id = ?', tournament_id);
                }*/
            }).then(rows => {

                /*for (var i = 0; i < after_tour_results_sum.for_addition.length; i++) {
                    var obj = after_tour_results_sum.for_addition[i];
                    //добавляем бухгольц
                    after_tour_results_sum.for_addition[i].push(played_arrays[obj[0]]);

                    //добавляем рейтинг и изменение
                    var tcurrent = (typeof change_rating[obj[0]] != "undefined") ? change_rating[obj[0]].current : null;
                    var tchange = (typeof change_rating[obj[0]] != "undefined") ? change_rating[obj[0]].change : null;
                    after_tour_results_sum.for_addition[i].push(tcurrent);
                    after_tour_results_sum.for_addition[i].push(tchange);

                    //добавляем бергер
                    after_tour_results_sum.for_addition[i].push(berger_object[obj[0]]);

                }

                if (after_tour_results_sum.for_addition.length > 0) {
                    if (let_insert) {
                        return pool.query('INSERT INTO tournaments_scores (user_id, tournament_id, scores, bh, rating, rating_change, berger) VALUES ?', [after_tour_results_sum.for_addition]).catch(function (err) {
                            console.log(err);
                        });
                    }
                } else {
                    return [0, false];
                }*/
        })
            .catch(function (err) {
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