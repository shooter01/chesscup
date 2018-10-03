const swisspairing = require('swiss-pairing');
const DRAW_TEAM = require('./draw_team_functions');

const DRAW = {
    checkEmptyResults : function (results, tourney) {
        var flag = false;
        var i = 0;
        for (var i = 0; i < results.length; i++) {
            if (tourney.type == 20) {
                if (!results[i].team_1_won && !results[i].team_2_won) {
                    flag = true;
                    break;
                }
            } else {
                if (!results[i].p1_won && !results[i].p2_won) {
                    flag = true;
                    break;
                }
            }

        }
        return flag;
    },


    sumBergerObject : function (berger, after_tour_results_sum) {
        var flag = {};

        var berger_sum = {};

        for (var obj in berger) {
            if (obj != null) {
                berger_sum[obj] = berger_sum[obj] || 0;
                for (var obj1 in berger[obj]['wins']) {
                    if (obj != 'null' && obj1 != 'null') {
                        berger_sum[obj]+=after_tour_results_sum[obj1];
                    }
                }
                for (var obj3 in berger[obj]['draw']) {
                    if (obj != 'null' && obj3 != 'null') {
                        berger_sum[obj]+=(after_tour_results_sum[obj3]/2);
                    }
                }
            }
        }

        delete berger_sum['null'];
        //console.log(berger_sum);

        return berger_sum;
    },


    makeSum : function (tour, overall, tourney) {
        var for_addition = [];
        for (var obj in overall) {
            overall[obj] = overall[obj] + (tour[obj] || 0);
            for_addition.push([
                obj, tourney.id, overall[obj]
            ]);
        }
        return  { for_addition : for_addition, overall : overall };
    },

    makeResultsForSwissSystem : function (results, participants, tourney, bye_participants) {
        var res = [], berger_object = {}, global, colors = {};

        var newParticipants = [];
        for (var i = 0; i < participants.length; i++) {
            var obj = participants[i];

            global = {
                'id': obj.user_id,
                'seed': i+1
            };

            //объект, который будет хранить цвета
            colors[obj.user_id] = [];

            if (!bye_participants[obj.user_id]) {
                newParticipants.push(global);
            }
        }



        var newArr = [];


        for (var i = 0; i < results.length; i++) {
            var obj = results[i];

            var global = {
                round : obj.tour,
                'home' : {
                    'id': obj.p1_id,
                    'points': obj.p1_won
                },
                'away' : {
                    'id': obj.p2_id,
                    'points': obj.p2_won
                }
            };

            if (obj['p1_id'] != null) colors[obj.p1_id].push("w");
            if (obj['p2_id'] != null) colors[obj.p2_id].push("b");

            berger_object[obj["p1_id"]] = berger_object[obj["p1_id"]] || {wins : {}, draw : {}};
            berger_object[obj["p2_id"]] = berger_object[obj["p2_id"]] || {wins : {}, draw : {}};

            if (obj['p1_id'] != null && obj['p2_id'] != null){
                if (obj['p1_won'] > obj['p2_won']) {
                    berger_object[obj["p1_id"]]["wins"][obj["p2_id"]] = true;
                } else if (obj['p2_won'] > obj['p1_won']){
                    berger_object[obj["p2_id"]]["wins"][obj["p1_id"]] = true;
                }

                if (obj['p1_won'] === obj['p2_won']) {
                    berger_object[obj["p1_id"]]["draw"][obj["p2_id"]] = true;
                    berger_object[obj["p2_id"]]["draw"][obj["p1_id"]] = true;
                }
            }


            if (!bye_participants[obj.p1_id] && !bye_participants[obj.p2_id]) {
                newArr.push(global);
            }
        }

        delete berger_object['null'];


        var d = swisspairing().getMatchups(tourney.current_tour + 1, newParticipants, newArr);
        return {swiss : d, berger_object : berger_object, colors : colors};
    },


    filterResults : function (results) {
        var filtered = {}, ratings = {}, bye_participants = {};
        for (var i = 0; i < results.length; i++) {
            var obj = results[i];
            if (obj.p1_id === obj.user_id) {
                filtered[obj.user_id] = obj.p1_won || 0;
                ratings[obj.user_id] = {
                    current : obj.p1_rating_for_history,
                    change : obj.p1_rating_for_history - obj.start_rating
                }

            } else if (obj.p2_id === obj.user_id){
                filtered[obj.user_id] = obj.p2_won || 0;
                ratings[obj.user_id] = {
                    current : obj.p2_rating_for_history,
                    change : obj.p2_rating_for_history - obj.start_rating
                }
            } else {
                filtered[obj.user_id] = 0;
            }

            if (obj.is_active === 0) {
                bye_participants[obj.p1_id] = true;
            }
        }

        return { filtered : filtered, ratings : ratings, bye_participants : bye_participants }
    },


    makeInsertObject : function (pairs, participants_object, tourney, session_id, end_ratings, colors) {
        var for_addition = [], board = 0;

        for (var i = 0; i < pairs.length; i++) {
            var obj = pairs[i];
            var p1_won = null;
            var p2_won = null;
            var p1_rating = null;
            var p1_rating_change = null;
            var p2_rating = null;
            var p2_rating_change = null;

            if (obj.home == null) {
                p1_won = 0;
                p2_won = 1;
                p2_rating = (end_ratings[obj.away]) ? end_ratings[obj.away].current : null;
                p2_rating_change = 0;
            }
            if (obj.away == null) {
                p1_won = 1;
                p2_won = 0;
                p1_rating = (end_ratings[obj.home]) ? end_ratings[obj.home].current : null;
                p1_rating_change = 0;
            }


            obj = DRAW.makePairByPrevColors(obj, colors);

            for_addition.push(
                [
                    obj.home,
                    obj.away,
                    p1_won,
                    p2_won,
                    participants_object[obj.home],
                    participants_object[obj.away],
                    tourney.id,
                    new Date(),
                    session_id,
                    tourney.current_tour + 1,
                    ++board,
                    p1_rating_change,
                    p2_rating_change,
                    p1_rating,
                    p2_rating
                ]);
        }

        console.log(for_addition);



        for_addition = DRAW.sortAdditonObject(for_addition);

        return for_addition;
    },


    sortAdditonObject : function (additionObject) {
        additionObject.sort(sortByScores);

        function sortByScores(a,b) {
            if (a[4] > b[4])
                return -1;
            if (a[4] < b[4])
                return 1;
            if (a[5] > b[5])
                return -1;
            if (a[5] < b[5])
                return 1;
            return 0;
        }

        return additionObject;

    },

    makePairByPrevColors : function (obj, colors) {

       // console.log(colors);
       // console.log(obj);
        var home_demand = 0, away_demand = 0;

        if (obj.home != null && typeof colors[obj.home] != "undefined" && colors[obj.home].length > 0) {
            for (var i = colors[obj.home].length - 1; i >= 0 ; i--) {
                if (colors[obj.home][i] === colors[obj.home][i-1] && colors[obj.home][i] === "w" || colors[obj.home][i] === "w") {
                    home_demand++;
                } else {
                    break;
                }
            }
        }

        if (obj.away != null && typeof colors[obj.away] != "undefined" && colors[obj.away].length > 0) {

            for (var i = colors[obj.away].length - 1; i >= 0 ; i--) {
                if (colors[obj.away][i] === colors[obj.away][i-1] && colors[obj.away][i] === "b" || colors[obj.away][i] === "b") {
                    away_demand++;
                } else {
                    break;
                }
            }
        }
        var change_flag = false;
      //  console.log(obj.home != null && obj.away != null && Math.abs(home_demand - away_demand) > 1);
        if (obj.home != null && obj.away != null && home_demand > 1) {
            var t = obj.home;
            obj.home = obj.away;
            obj.away = t;
            change_flag = true;
        } else if (obj.home != null && obj.away != null && away_demand > 1){
            var t = obj.home;
            obj.home = obj.away;
            obj.away = t;
            change_flag = true;

        } else if (obj.home != null && obj.away != null && home_demand > 0 &&  away_demand > 0){
            var t = obj.home;
            obj.home = obj.away;
            obj.away = t;
            change_flag = true;

        }

        if (obj.home != null && obj.away != null && Math.abs(home_demand - away_demand) > 1 && change_flag == false){
            var t = obj.home;
            obj.home = obj.away;
            obj.away = t;
            change_flag = true;
        }


      //  console.log(home_demand);
      //  console.log(away_demand);
      //  console.log(obj);
      //  console.log("\n");
      //  console.log("\n");
        return obj;

    },


    makeObject : function (arrr) {
        var gObj = {}, end_ratings = {}, change_rating = {}, bye_participants = {};
        for (var i = 0; i < arrr.length; i++) {
            var obj1 = arrr[i];
            gObj[arrr[i].user_id] = arrr[i].scores || 0;

            if (arrr[i].is_active === 0) {
                bye_participants[arrr[i].user_id] = true;
            }

            //end_ratings[arrr[i].user_id] = arrr[i].end_ratings || 1200;
            //change_rating[arrr[i].user_id] = end_ratings[arrr[i].user_id] - arrr[i].start_rating;
        }
        //console.log(bye_participants);
        return {
            bye_participants : bye_participants,
            scores_object : gObj,
            // change_rating : change_rating
        };

    },


    sortArr : function (arrr) {

        arrr.sort(sortByScores);

        function sortByScores(a,b) {
            if (a.scores > b.scores)
                return -1;
            if (a.scores < b.scores)
                return 1;
            if (a.bh > b.bh)
                return -1;
            if (a.bh < b.bh)
                return 1;
            if (a.berger > b.berger)
                return -1;
            if (a.berger < b.berger)
                return 1;
            return 0;
        }
        return arrr;

    },

    sortBoards : function (arrr) {
        var boards = {};

        for (var i = 0; i < arrr.length; i++) {
            var obj = arrr[i];
            boards[obj.team_board] = boards[obj.team_board] || [];
            boards[obj.team_board].push(obj);
        }

        for (var obj1 in boards) {
            boards[obj1] = DRAW.sortArr(boards[obj1]);
        }

        return boards;

    },

    makePlayedArray : function (rows, after_tour_results_sum) {
        var played_arrays = {};

        for (var i = 0; i < rows.length; i++) {
            var obj = rows[i];

            played_arrays[obj["p1_id"]] = played_arrays[obj["p1_id"]] || 0;
            played_arrays[obj["p2_id"]] = played_arrays[obj["p2_id"]] || 0;

            if (typeof after_tour_results_sum[obj["p2_id"]] != "undefined") {
                played_arrays[obj["p1_id"]]+= after_tour_results_sum[obj["p2_id"]];
            }

            if (typeof after_tour_results_sum[obj["p1_id"]] != "undefined") {
                played_arrays[obj["p2_id"]]+= after_tour_results_sum[obj["p1_id"]];
            }
        }

        return played_arrays;

    },
    makeCrossatable : function (results, participants) {
        var played_arrays = {};


        return played_arrays;

    },

    defaultSwiss : function (req, res, next, pool, tournament, tournament_id, tour_id, app) {
        let participants, pairing = [], arrr = [], crosstable, scores_object = {}, current_games = {};


                    pool
                        .query('SELECT tr.*, u1.name AS p1_name,u1.tournaments_rating AS p1_rating, u2.name AS p2_name, u2.tournaments_rating AS p2_rating FROM tournaments_results tr LEFT JOIN users u1 ON tr.p1_id = u1.id LEFT JOIN  users u2 ON tr.p2_id = u2.id WHERE tr.tournament_id = ? AND tr.tour = ?', [tournament_id, tour_id])
                .then(rows => {
                pairing = rows;

                for (var i = 0; i < rows.length; i++) {
                    var obj = rows[i];
                    var p1_name = obj["p1_name"];
                    var p2_name = obj["p2_name"];
                    arrr.push(
                        {
                            scores: obj["p1_scores"],
                            name: obj["p1_name"],
                        },
                        {
                            scores: obj["p2_scores"],
                            name: obj["p2_name"],
                        },
                    );
                }
                arrr.sort(sortByScores);

                function sortByScores(a,b) {
                    return a.scores < b.scores;
                }

            }).then(rows => {
                return pool
                    .query('SELECT tp.user_id,tp.is_active, ts.scores, u.name, u.tournaments_rating FROM tournaments_participants tp LEFT JOIN tournaments_scores ts ON ts.user_id = tp.user_id LEFT JOIN users u ON u.id = tp.user_id WHERE tp.tournament_id = ? AND ts.tournament_id = ?', [tournament_id, tournament_id])
            }).then(rows => {
                        var a = [];

                        for (var i = 0; i < rows.length; i++) {
                            var obj = rows[i];

                            scores_object[obj.user_id] = obj.scores;
                            a.push({
                                user_id: obj.user_id,
                                scores: obj.scores,
                                name: obj.name,
                                crosstable: crosstable,
                                is_active: obj.is_active,
                                tournaments_rating: obj.tournaments_rating,
                            });
                        }
                        participants = DRAW.sortArr(a);

                    }).then(rows => {
                            return pool
                                .query('SELECT * FROM tournaments_results tr WHERE tr.tournament_id = ?', tournament_id)
                        }).then(rows => {
                        crosstable = DRAW.makeCrossatable(rows, participants);
                        res.render('tournament/pairing', {
                            tournament  : tournament,
                            pairing  : JSON.stringify(pairing),
                            participants : participants,
                            tour_id : tour_id,
                            scores_object :  JSON.stringify(scores_object),
                            arrr : arrr,
                        });
            }).catch(function (err) {
                console.log(err);
            });


    },

    teamSwiss : function (req, res, next, pool, tournament, tournament_id, tour_id) {

        let tournaments_teams,
            teams_results,
            teams_participants,
            teams_scores,
            participants,
            team_tour_points,
            pairs,
            tournament_results,
            teams_array = [],
            arrr = []
            ;



            pool.query('SELECT tr.* FROM tournaments_results tr WHERE tr.tournament_id = ? AND tr.tour = ?', [tournament_id, tour_id])
                .then(function (results) {
                tournament_results = results;
                return pool.query('SELECT tt.id AS team_id,tt.team_name, tp.user_id, u.name,u.email FROM tournaments_teams AS tt LEFT JOIN tournaments_participants AS tp ON tp.team_id = tt.id LEFT JOIN users AS u ON tp.user_id = u.id WHERE tt.tournament_id = ? ORDER BY tt.id DESC', tournament_id)
            }).then(function (results) {
                var res = DRAW_TEAM.makeTeams(results, tournament_results);
                // console.log(res);
                tournaments_teams = res.teams;
                participants = res.participants;
                team_tour_points = res.team_tour_points;
                return pool
                    .query('SELECT ttr.* FROM tournaments_teams_results ttr WHERE ttr.tournament_id = ? AND ttr.tour = ?', [tournament_id, tour_id])
            }).then(function (rows) {

                teams_results = rows;
                if (tournament.type == 20) {
                    team_tour_points = DRAW_TEAM.makeTourScores(teams_results);
                }
                return pool
                    .query('SELECT * FROM tournaments_teams_scores WHERE tournament_id = ?', tournament_id)
            }).then(function (rows) {
                teams_scores = DRAW_TEAM.makeScores(rows);


                return pool
                    .query('SELECT tr.*, u1.name AS p1_name,u1.tournaments_rating AS p1_rating, u2.name AS p2_name, u2.tournaments_rating AS p2_rating FROM tournaments_results tr LEFT JOIN users u1 ON tr.p1_id = u1.id LEFT JOIN  users u2 ON tr.p2_id = u2.id WHERE tr.tournament_id = ? AND tr.tour = ?', [tournament_id, tour_id])
            }).then(function (rows) {
                pairs = DRAW_TEAM.makePairs(rows, teams_results, tournaments_teams, participants);
            }).then(function (rows) {

                res.render('tournament/teams/pairing', {
                    pairing: JSON.stringify(teams_results),
                    tournament: tournament,
                    tour_id: tour_id,
                    pairs: JSON.stringify(pairs),
                    team_tour_points: JSON.stringify(team_tour_points),
                    teams_scores: JSON.stringify(teams_scores),
                    tournaments_teams: JSON.stringify(tournaments_teams)
                });
            }).catch(function (err) {
                console.log(err);
            });
    }
};



module.exports = DRAW;