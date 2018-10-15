const DRAW = require('./draw_functions');
const moment = require('moment');

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
        arrr = [],
        participants = [],
        pairs = {},
        participants_object = {},
        current_tour_results = [],
        after_tour_results_sum,
        after_tour_team_results_sum,
        after_tour_team_results_sum_array = [],
        played_arrays = {},
        team_played_arrays = {},
        berger_object = {},
        end_ratings = {},
        change_rating = {},
        bye_participants = {},
        team_swiss,
        team_pairs,
        team_berger_object,
        colors, //цвета, которыми играли участники
        team_berger,
        flag_changed = false,
        after_tour_team_results_sum_buhgolz = {}
        ;


    var team_temp;
    console.log(tournament_id);
    if (!isNaN(tournament_id)) {

        pool
            .query('SELECT * FROM tournaments WHERE id = ?', tournament_id)
            .then(rows => {
                tourney = rows[0];
            })
            .then(res => {
                if (tourney.is_closed === 1) {
                    throw new Error(__("TourneyClosed"));
                }

                if (tourney.type > 10) {
                    const sql = 'SELECT id FROM tournaments_teams WHERE tournament_id = ?';
                    return  pool.query(sql, tourney.id);
                } else {
                    return true;
                }

            }).then(rows => {

            if (tourney.type > 10 && rows.length <= tourney.tours_count) {
                //throw new Error(__("TooSmallQuantity"));
                throw new Error("Too few participants. Change the number of tours or the number of participants.");
            }

            let sql = "SELECT tp.user_id, tp.start_rating, ts.scores, tp.is_active FROM tournaments_participants tp LEFT JOIN tournaments_scores ts ON ts.user_id = tp.user_id AND  tp.tournament_id = ts.tournament_id WHERE tp.tournament_id = ?";

            return  pool.query(sql, tourney.id);
        })
            .then(rows => {
                participants = rows;
            })
            .then(rows => {
                //2 - круговой турнир, если первый тур, то выставляем количество туров по числу участников
                console.log(tourney.type == 1);
                console.log(tourney.tours_count > participants.length);
                if ((tourney.type == 1 && tourney.tours_count > participants.length) || (tourney.type === 2 && tourney.is_active === 0)) {
                    console.log("UPDATED");
                    flag_changed = true;
                    return pool.query('UPDATE tournaments SET ? WHERE tournaments.id = ?',[{
                        tours_count : participants.length - 1,
                    },tourney.id]);
                } else {
                    return rows;
                }
            }).then(rows => {

            if (!flag_changed && (tourney.type === 1 && participants.length <= tourney.tours_count)) {
                throw new Error("Too few participants. Change the number of tours or the number of participants.");
            }
            //сортировка участников по полю scores - кто сколько набрал
            participants = DRAW.sortArr(participants);
            //создает объект участников - ключ - id участника - значение - сколько набрал очков
            //так же создает объект участников, кто покинул турнир
            var temp = DRAW.makeObject(participants);
            participants_object = temp.scores_object;
            bye_participants = temp.bye_participants;

            let sql = 'select tp.user_id,tp.start_rating,tr.p1_id,tr.p1_rating_for_history,tr.p2_rating_for_history,tr.p2_id,tr.p1_won, tr.p1_scores,tr.p2_won, tr.p2_scores from tournaments_participants tp LEFT JOIN tournaments_results tr ON (tr.p1_id = tp.user_id OR tr.p2_id = tp.user_id) WHERE tr.tournament_id = ? AND tr.tour = ?';

            if (tourney.type == 20) {
                sql = 'SELECT * FROM tournaments_teams_results WHERE tournament_id = ? AND tour = ?';
            }

            return pool
                .query(sql,   [
                    tourney.id,
                    tourney.current_tour,
                ])
        })

            .then(rows => {
                current_tour_results = rows;
                //проверяем пустые результаты
                var isEmptyResults = DRAW.checkEmptyResults(current_tour_results, tourney);

                if (tourney.current_tour !== 0) {
                    if (isEmptyResults) {
                        //throw new Error(__("ParticipantsFillAllResults"));
                        throw new Error("Fill all results");
                    }
                }

                //фильтруем результаты тура
                //отдает объект в виде - название id команды - количество очков за тур
                var temp = DRAW.filterResults(current_tour_results);

                var current_tour_results_filtered = temp.filtered;
                change_rating = temp.ratings;
                //bye_participants = temp.bye_participants;

                //отдает объект с суммой всех очков участников
                //for_addition - массив готовый к вставке в базу
                //overall - объект с ключами - id юзера, значение - сколько очков набрал
                after_tour_results_sum = DRAW.makeSum(current_tour_results_filtered, participants_object, tourney);

            })
            .then(rows => {
                return pool
                    .query('select tr.p1_id,tr.p2_id,tr.p1_won, tr.p1_scores,tr.p2_won, tr.p2_scores, tr.tour FROM tournaments_results tr WHERE tr.tournament_id = ?',   [
                        tourney.id,
                    ])
            })
            .then(rows => {
                //делаем пары и создаем бергер объект
                //пары вида массив с { home: 178, away: 184 }
                //бергер объект '178': { wins: [Object], draw: {} }
                var g = DRAW.makeResultsForSwissSystem(rows, participants, tourney, bye_participants);
                pairs = g.swiss;
                berger_object = g.berger_object;
                colors = g.colors;

                //считаем бергер объект
                berger_object = DRAW.sumBergerObject(berger_object, after_tour_results_sum.overall);

                return pool
                    .query('SELECT tr.p1_id,tr.p2_id FROM tournaments_results tr WHERE tr.tournament_id = ?', [tournament_id])
            })
            .then(rows => {
                //считаем сумму очков противников для бухгольца
                played_arrays = DRAW.makePlayedArray(rows, after_tour_results_sum.overall);
                return  pool.query("SELECT * FROM tournaments_scores WHERE tournament_id = ? AND tour = ?", [tourney.id, tourney.scores]);
            })
            .then(rows => {

                //создает массив для вставки в tournament_results
                //если противника нет ставит 1 : 0
                //сортирует по очкам
                var for_addition = DRAW.makeInsertObject(pairs, participants_object, tourney, change_rating, colors);

                // console.log(for_addition);



                if (let_insert && tourney.type < 10 && ((tourney.current_tour + 1) <= tourney.tours_count)) {
                    return pool.query('INSERT INTO tournaments_results (p1_id, p2_id, p1_won, p2_won,p1_scores,p2_scores, tournament_id,created_at,tour,board, rating_change_p1, rating_change_p2, p1_rating_for_history, p2_rating_for_history) VALUES ?', [for_addition]);
                }
            })
            .then(function(data){


                if (data && data.insertId){

                    return  pool.query("SELECT * FROM tournaments_results WHERE tournament_id = ? AND tour = ?", [tourney.id, tourney.current_tour + 1]);
                }


            })  .then(function(data){

            var newDateObj = moment(new Date()).add(30, 'm').toDate();
            var startTime = moment(new Date()).add(1, 'm').toDate();
            if (data && data.length && tourney.is_online == 1) {
                for (var i = 0; i < data.length; i++) {

                    var obj = data[i];
                    if (obj.p1_id != null && obj.p2_id != null) {
                        var game = app.mongoDB.collection("users").insertOne({
                            "_id": obj.id,
                            "moves": [],
                            "is_over": 0,
                            "p1_id": obj.p1_id,
                            "p2_id": obj.p2_id,
                            "p1_time_end": newDateObj,
                            "p2_time_end": newDateObj,
                            "tournament_id": tournament_id,
                            "p1_last_move": null,
                            "p2_last_move": null,
                            "p1_time_left": tourney.amount * 60000,
                            "p2_time_left": tourney.amount * 60000,
                            "p1_visited": false,
                            "p2_visited": false,
                            "is_started": 0,
                            "startTime": startTime,
                            "time_length": 300,
                            "time_addition": 0,
                        });




                       /* console.log("========");

                        console.log(Object.keys(app.globalPlayers));
                        console.log(obj.p1_id);
                        console.log(obj.p2_id);
                        console.log("========");*/
                        /*if (typeof app.globalPlayers[obj.p1_id] != "undefined") {
                            console.log(obj.p1_id);
                            app.globalPlayers[obj.p1_id].emit('game_start', JSON.stringify({tournament_id: tournament_id, game_id : obj.id}));
                        }
                        if (typeof app.globalPlayers[obj.p2_id] != "undefined") {
                            console.log(obj.p1_id);
                            app.globalPlayers[obj.p2_id].emit('game_start', JSON.stringify({tournament_id: tournament_id, game_id : obj.id}));
                        }*/
                    }
                }



            }

            /*if (data.insertId){

             var game = app.mongoDB.collection("users").insertOne( {
             "moves": [],
             "is_over": 0,
             "is_started": 1,
             } )
             }*/


        })
            .then(function(){

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
            })
            .then(rows => {
                if (let_insert) {
                    return pool
                        .query('DELETE FROM tournaments_scores WHERE tournament_id = ?', tournament_id);
                }
            }).then(rows => {

            for (var i = 0; i < after_tour_results_sum.for_addition.length; i++) {
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
            }
        }).then(rows => {

            ///TEAMS SECTION

            if (tourney.type > 10) {
                return pool.query('SELECT tt.id AS user_id, tts.scores, tts.team_scores FROM tournaments_teams tt LEFT JOIN tournaments_teams_scores tts ON tts.team_id = tt.id WHERE tt.tournament_id = ?', tournament_id)
            } else {
                return true;
            }

        }).then(rows => {
            if (tourney.type > 10) {
                team_temp = rows;
            } else {
                return true;
            }
        }).then(rows => {
            if (tourney.type > 10) {
                return pool.query('SELECT ' +
                    'ttr.team_1_id AS p1_id,' +
                    'ttr.team_2_id AS p2_id,' +
                    'ttr.team_1_won AS p1_won, ' +
                    'ttr.tour AS tour, ' +
                    'ttr.team_2_won AS p2_won FROM tournaments_teams_results ttr WHERE ttr.tournament_id = ? ORDER BY ttr.id DESC', tournament_id)
            } else {
                return true;
            }
        }).then(rows => {
            if (tourney.type > 10) {
                team_played_arrays = rows;

                team_swiss = DRAW.makeResultsForSwissSystem(rows, team_temp, tourney, {});
                team_berger_object = team_swiss.berger_object;

                return pool.query('SELECT ' +
                    'ttr.team_1_id AS p1_id,' +
                    'ttr.team_2_id AS p2_id,' +
                    'ttr.team_1_won AS p1_won, ' +
                    'ttr.tour AS tour, ' +
                    'ttr.team_2_won AS p2_won FROM tournaments_teams_results ttr WHERE ttr.tournament_id = ? AND ttr.tour = ? ORDER BY ttr.id DESC', [tournament_id, tourney.current_tour])
            } else {
                return true;
            }

        }).then(rows => {

            if (tourney.type > 10) {
                var temp = {};
                var win_lose = {};

                for (var i = 0; i < rows.length; i++) {
                    var obj1 = rows[i];
                    temp[obj1.p1_id] = obj1.p1_won || 0;
                    temp[obj1.p2_id] = obj1.p2_won || 0;

                    if (temp[obj1.p1_id] > temp[obj1.p2_id]) {
                        win_lose[obj1.p1_id] =  2;
                        win_lose[obj1.p2_id] =  0;
                    } else if (temp[obj1.p2_id] > temp[obj1.p1_id]) {
                        win_lose[obj1.p1_id] =  0;
                        win_lose[obj1.p2_id] =  2;
                    } else if (temp[obj1.p2_id] = temp[obj1.p1_id]) {
                        win_lose[obj1.p1_id] =  1;
                        win_lose[obj1.p2_id] =  1;
                    }
                }



                delete temp['null'];

                after_tour_team_results_sum = {};
                after_tour_team_results_sum_buhgolz = {};


                for (var i = 0; i < team_temp.length; i++) {
                    var obj2 = team_temp[i];
                    after_tour_team_results_sum[obj2.user_id] = after_tour_team_results_sum[obj2.user_id] || {};
                    after_tour_team_results_sum[obj2.user_id].scores = (obj2.scores || 0) + (win_lose[obj2.user_id] || 0);
                    after_tour_team_results_sum_buhgolz[obj2.user_id] = (obj2.scores || 0) + (win_lose[obj2.user_id] || 0);
                    after_tour_team_results_sum[obj2.user_id].team_scores = (obj2.team_scores || 0) + (temp[obj2.user_id] || 0);
                }
                played_arrays = DRAW.makePlayedArray(team_played_arrays, after_tour_team_results_sum_buhgolz);
                team_berger = DRAW.sumBergerObject(team_berger_object, after_tour_team_results_sum_buhgolz);

                for (var obj in after_tour_team_results_sum) {
                    after_tour_team_results_sum_array.push([
                        obj,
                        tournament_id,
                        after_tour_team_results_sum[obj].scores || 0,
                        after_tour_team_results_sum[obj].team_scores || 0,
                        played_arrays[obj] || 0,
                        team_berger[obj] || 0,
                    ]);
                }

                if (let_tournament_insert) {
                    return pool
                        .query('DELETE FROM tournaments_teams_scores WHERE tournament_id = ?', tournament_id);
                }
            } else {
                return true;
            }




        }).then(rows => {
            if (tourney.type > 10) {
                if (let_tournament_insert) {

                    return pool.query('INSERT INTO tournaments_teams_scores (team_id, tournament_id, scores, team_scores, bh, berger) VALUES ?', [after_tour_team_results_sum_array]).catch(function (err) {
                        console.log(err);
                    });
                }
            } else {
                return true;
            }

        }).then(rows => {
            if (tourney.type > 10) {
                var for_addition_teams = [];
                for (var i = 0; i < team_swiss.swiss.length; i++) {
                    var obj = team_swiss.swiss[i], p1_won = null, p2_won = null;

                    if (obj.home == null) {
                        p1_won = 0;
                        p2_won = tourney.team_boards;
                    }
                    if (obj.away == null) {
                        p1_won = tourney.team_boards;
                        p2_won = 0;
                    }

                    for_addition_teams.push(
                        [
                            obj.home,
                            obj.away,
                            p1_won,
                            p2_won,
                            after_tour_team_results_sum_buhgolz[obj.home] || 0,
                            after_tour_team_results_sum_buhgolz[obj.away] || 0,
                            tourney.id,
                            new Date(),
                            tourney.current_tour + 1,
                        ]);
                }


                if (((tourney.current_tour + 1) <= tourney.tours_count)) {
                    if (let_tournament_insert) {
                        return pool.query('INSERT INTO tournaments_teams_results (' +
                            'team_1_id, ' +
                            'team_2_id, ' +
                            'team_1_won, ' +
                            'team_2_won, ' +
                            'team_1_scores, ' +
                            'team_2_scores, ' +
                            'tournament_id,' +
                            'created_at,' +
                            'tour) VALUES ?', [for_addition_teams]);
                    }
                }
            } else {
                return true;
            }


        }) .then(rows => {

            if (tourney.type > 10) {
                return pool.query('SELECT tt.id AS team_id,tt.team_name, tp.user_id, tp.team_board, u.name,u.email ' +
                    'FROM tournaments_teams AS tt LEFT JOIN tournaments_participants AS tp ON tp.team_id = tt.id LEFT JOIN users AS u ON tp.user_id = u.id WHERE tt.tournament_id = ? ORDER BY tt.id DESC, tp.team_board ASC', tournament_id)
            } else {
                return true;
            }

        }).then(rows => {
            if (tourney.type > 10) {
                team_pairs = DRAW_TEAM.makeInsertTeamsScoresObject(rows, current_tour_results, team_swiss);
            } else {
                return true;
            }
        }).then(rows => {

            if (tourney.type === 11) {
                if (((tourney.current_tour + 1) <= tourney.tours_count)) {

                    var for_addition = DRAW.makeInsertObject(team_pairs.pairs, participants_object, tourney, req.session.passport.user.id, change_rating);
                    if (let_tournament_insert) {
                        return pool.query('INSERT INTO tournaments_results (' +
                            'p1_id, ' +
                            'p2_id, p1_won, p2_won,p1_scores,p2_scores, tournament_id,created_at,tour,board, rating_change_p1, rating_change_p2, p1_rating_for_history, p2_rating_for_history) VALUES ?', [for_addition]);
                    }


                }
            } else {
                return true;
            }

        })
            .then(rows => {

                var tour = ((tourney.current_tour + 1) <= tourney.tours_count) ? tourney.current_tour + 1 : null;


                app.io.to('t' + tournament_id).emit('tournament_event',
                    JSON.stringify({}));

                /*app.io.to(game._id).emit('eventClient', JSON.stringify({
                    event: "game_over",
                    bitch: send_data,
                    is_over: 1
                }));*/

                //console.log(Object.keys(app.globalPlayers))
                /*for (var obj in app.globalPlayers) {

                    if (typeof participants_object[obj] === 'undefined' || tour == null){
                        app.globalPlayers[obj].emit('tournament_start', JSON.stringify({updated_tour : tour}));
                    }
                }

                for (var obj in app.viewers) {
                    app.viewers[obj].emit('tournament_start', JSON.stringify({updated_tour : tour}));
                }
*/

                //app.io.sockets.emit('tournament_start', JSON.stringify({updated_tour : tour}));

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