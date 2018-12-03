const swisspairing = require('swiss-pairing');
const DRAW_TEAM = require('./draw_team_functions');
const roundrobin = require('./systems/roundrobin');

const DRAW = {
    checkEmptyResults : function (results, tourney) {
        var flag = false;
        var i = 0;
        for (var i = 0; i < results.length; i++) {
            if (!results[i].p1_won && !results[i].p2_won) {
                flag = true;
                break;
            }
        }
        return flag;
    },


    sumBergerObject : function (berger, participants_object) {
        var flag = {};

        var berger_sum = {};

        for (var obj in berger) {
            if (obj != null) {
                berger_sum[obj] = berger_sum[obj] || 0;
                for (var obj1 in berger[obj]['wins']) {
                    if (obj != 'null' && obj1 != 'null') {
                        berger_sum[obj]+=participants_object[obj1];
                    }
                }
                for (var obj3 in berger[obj]['draw']) {
                    if (obj != 'null' && obj3 != 'null') {
                        berger_sum[obj]+=(participants_object[obj3]/2);
                    }
                }
            }
        }

        delete berger_sum['null'];
        //console.log(berger_sum);

        return berger_sum;
    },


    getBuhgolz : function (tournament_results, participants_object) {
        let buhgolz = {};
        for (let i = 0; i < tournament_results.length; i++) {
            let obj = tournament_results[i];
            //исключаем пары, в которых есть Null
            if (obj["p1_id"] != null && obj["p2_id"] != null) {
                buhgolz[obj["p1_id"]] = buhgolz[obj["p1_id"]] || 0;
                buhgolz[obj["p2_id"]] = buhgolz[obj["p2_id"]] || 0;

                if (typeof participants_object[obj["p2_id"]] != "undefined") {
                    buhgolz[obj["p1_id"]]+= participants_object[obj["p2_id"]];
                }

                if (typeof participants_object[obj["p1_id"]] != "undefined") {
                    buhgolz[obj["p2_id"]]+= participants_object[obj["p1_id"]];
                }
            }
        }
        return  buhgolz;
    },
    makeScoresArray : function (participants_object, berger_object, buhgolz, tourney) {
        let scores_array = [];

        for (let obj in participants_object) {

            scores_array.push([
                obj,
                tourney.id,
                tourney.current_tour,
                participants_object[obj],
                buhgolz[obj],
                0,
                0,
                berger_object[obj],
            ]);
        }

        return scores_array;
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
        var res = [], berger_object = {}, global, colors = {}, already_played = {}, d;

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

            already_played[obj.p1_id + "-" + obj.p2_id] = true;

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

        //если круговой
        if (tourney.type === 2) {
            d = roundrobin(results, participants, tourney, bye_participants);
        //если щвейцарка
        } else if (tourney.type == 1) {
            d = swisspairing().getMatchups(tourney.current_tour + 1, newParticipants, newArr);
        }

     //   var

       // console.log(d);

        return {swiss : d, berger_object : berger_object, colors : colors};
    },

    //определяем количество туров
    getToursCount : function (tourney, participants) {
        let tours_count = tourney.tours_count;

        //если это круговой индивидуальный турнир
        if (tourney.type === 2) {
            //количество участников нечетное?
            const isOdd = participants.length % 2 === 1;
            tours_count = (isOdd) ? participants.length : participants.length - 1;
        }

        //если это швейцарка индивидуальный турнир
       /* if (tourney.type === 1) {
            //количество участников нечетное?
            const isOdd = participants.length % 2 === 1;
            tours_count = (isOdd) ? participants.length : participants.length - 1;
        }*/



        return tours_count;
    },
    makeResultsForRoundRobinSystem : function (results, participants, tourney, bye_participants) {

        var d = roundrobin(results, participants, tourney, bye_participants);

        return {robin : d};
    },


    sortSwiss : function (pairs, participants_object) {



        pairs.sort(compare);

        function compare(a,b) {
            if ((participants_object[a.home] + participants_object[a.away]) > (participants_object[b.home] + participants_object[b.away]))
                return -1;
            if ((participants_object[a.home] + participants_object[a.away]) < (participants_object[b.home] + participants_object[b.away]))
                return 1;
            return 1;
        }

        for (let i = 0; i < pairs.length; i++) {
            let obj = pairs[i];
            //console.log(obj.home == null);
            //console.log(obj.away == null);
            if (obj.home == null || obj.away == null) {
                pairs.push(pairs.splice(i, 1)[0]);
                break;
            }
        }

        return pairs
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


    makeInsertObject : function (pairs, participants_object, tourney, end_ratings, colors) {
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
                    tourney.current_tour + 1,
                    ++board,
                    p1_rating_change,
                    p2_rating_change,
                    p1_rating,
                    p2_rating
                ]);
        }

       // console.log(for_addition);



        //for_addition = DRAW.sortAdditonObject(for_addition);

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


    makeObject : function (tournament_results) {
        var gObj = {};
        for (var i = 0; i < tournament_results.length; i++) {
            var obj1 = tournament_results[i];


            if (obj1.p1_id){
                //если пользователь присутствует (не null), добавляем его в объект
                //если он там есть, то прибавляем заработанные очки
                if (!gObj[obj1.p1_id]) {
                    gObj[obj1.p1_id] = 0;
                }
                gObj[obj1.p1_id] = gObj[obj1.p1_id] + obj1.p1_won;
            }

            if (obj1.p2_id){
                //если пользователь присутствует (не null), добавляем его в объект
                //если он там есть, то прибавляем заработанные очки
                if (!gObj[obj1.p2_id]) {
                    gObj[obj1.p2_id] = 0;
                }
                gObj[obj1.p2_id] = gObj[obj1.p2_id] + obj1.p2_won;
            }


        }
        return gObj;

    },

    getByePlayers : function (participants) {
        let bye_participants = {};
        for (let i = 0; i < participants.length; i++) {
            let obj = participants[i];
            if (obj.is_active === 0) {
                bye_participants[obj.user_id] = true;
            }

        }
        return bye_participants;

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
            return 1;
        }
        return arrr;

    },
    sortArrRoundRobin : function (arrr) {
        arrr.sort(sortByScores);

        function sortByScores(a,b) {
            if (a.scores > b.scores)
                return -1;
            if (a.scores < b.scores)
                return 1;
            if (a.berger > b.berger)
                return -1;
            if (a.berger < b.berger)
                return 1;
            return 1;
        }
        return arrr;

    },

    sortBoards : function (arrr, participants_scores) {
        var boards = {};

        for (var i = 0; i < arrr.length; i++) {
            var obj = arrr[i];
            obj.bh = (participants_scores[obj.user_id]) ? participants_scores[obj.user_id].bh : null;
            obj.scores = (participants_scores[obj.user_id]) ? participants_scores[obj.user_id].scores : null;
            obj.berger = (participants_scores[obj.user_id]) ? participants_scores[obj.user_id].berger : null;
            boards[obj.team_board] = boards[obj.team_board] || [];
            boards[obj.team_board].push(obj);
        }
        console.log(participants_scores);
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
        let participants, participants_array = [], scores_object = {}, pairing = [];

            return pool
                    .query('SELECT tr.*, u1.name AS p1_name, u1.title AS p1_title, u2.title AS p2_title, u1.tournaments_rating AS p1_rating, u2.name AS p2_name, u2.tournaments_rating AS p2_rating FROM tournaments_results tr LEFT JOIN users u1 ON tr.p1_id = u1.id LEFT JOIN  users u2 ON tr.p2_id = u2.id WHERE tr.tournament_id = ? AND tr.tour = ?', [tournament_id, tour_id])
            .then(rows => {
                pairing = rows;
            }).then(rows => {
                    let sql = "SELECT ts.* FROM tournaments_scores ts WHERE ts.tournament_id = ? AND ts.tour = ?";
                    return pool
                        .query(sql, [tournament_id, tour_id - 1 ])
            }).then(rows => {

                for (var i = 0; i < rows.length; i++) {
                    scores_object[rows[i].user_id] = {};
                    scores_object[rows[i].user_id].bh = rows[i].bh;
                    scores_object[rows[i].user_id].scores = rows[i].scores;
                    scores_object[rows[i].user_id].berger = rows[i].berger;
                }

                let sql = "SELECT tp.*, u.name, u.tournaments_rating, u.title FROM tournaments_participants tp LEFT JOIN users u ON u.id = tp.user_id  WHERE tp.tournament_id = ?";

                return pool
                    .query(sql, [tournament_id, tour_id - 1 ])
            }).then(rows => {

                    for (var i = 0; i < rows.length; i++) {
                        participants_array.push(Object.assign(rows[i], scores_object[rows[i].user_id]));

                    }


                    if (!tournament.is_active  || tour_id - 1 == 0) {
                        participants = participants_array;
                    } else {
                        //если швейцарка то учитываем бухгольц
                        if (tournament.type == 1) {
                            participants = DRAW.sortArr(participants_array);
                        //если круговик то сортируем по бергеру
                        } else if (tournament.type == 2)  {
                            participants = DRAW.sortArrRoundRobin(participants_array);
                        }
                    }


                }).then(rows => {


                   // console.log(participants);
                    //console.log(rows);

                  /*  console.log({
                        tournament  : tournament,
                        pairing  : pairing,
                        participants : participants,
                    });*/

                        return {
                            tournament  : tournament,
                            pairing  : pairing,
                            participants : participants,
                        };

            }).catch(function (err) {
                console.log(err);
            });


    },

    teamSwiss : function (req, res, next, pool, tournament, tournament_id, tour_id) {

        let tournaments_teams,
            teams_results,
            teams_participants,
            participants_array = [],
            teams_scores,
            additional_coef,
            participants = {},
            participants_boards = {},
            participants_scores = [],
            team_tour_points = {},
            results_table = [],
            pairs,
            tournament_results = {}
            ;

        return pool
            .query("SELECT tp.*, u.name, u.tournaments_rating, u.title FROM tournaments_participants tp LEFT JOIN users u ON u.id = tp.user_id  WHERE tp.tournament_id = ?", [tournament_id])

            .then(function (results) {

                teams_participants = results;

                for (let i = 0; i < results.length; i++) {
                    let obj = results[i];
                    participants[obj.user_id] = obj;
                }

                return pool
                    .query("SELECT ts.* FROM tournaments_scores ts WHERE ts.tournament_id = ?", [tournament_id])

            }).then(function (rows) {


                for (let i = 0; i < rows.length; i++) {
                    participants_scores[rows[i].user_id] = {};
                    participants_scores[rows[i].user_id].bh = rows[i].bh;
                    participants_scores[rows[i].user_id].name = participants[rows[i].user_id].name;
                    participants_scores[rows[i].user_id].scores = rows[i].scores;
                    participants_scores[rows[i].user_id].berger = rows[i].berger;
                }

                for (var i = 0; i < rows.length; i++) {
                    participants_array.push(Object.assign(rows[i], participants_scores[rows[i].user_id]));

                }
                console.log("==");
                console.log(teams_participants);

                if (!tournament.is_active  || tour_id - 1 == 0) {
                    participants_array = teams_participants;
                } else {
                    participants_array = DRAW.sortArr(participants_array);
                }




                return pool
                    .query('SELECT * FROM tournaments_teams_scores WHERE tournament_id = ?', tournament_id)

            }).then(function (results) {

                let result = DRAW_TEAM.makeScores(results);
                teams_scores = result.teams_scores;
                additional_coef = result.additional_coef;

                return pool.query('SELECT tt.id AS team_id,tt.team_name FROM tournaments_teams tt WHERE tt.tournament_id = ?', tournament_id)

            }).then(function (results) {

                let teams_names = {};

                for (let i = 0; i < results.length; i++) {
                    teams_names[results[i].team_id] = results[i].team_name;
                    results_table.push({
                        id : results[i].team_id,
                        team_name : results[i].team_name,
                        scores : teams_scores[results[i].team_id],
                        bh : (additional_coef[results[i].team_id]) ? additional_coef[results[i].team_id].bh : null,
                        berger : (additional_coef[results[i].team_id]) ? additional_coef[results[i].team_id].berger : null,
                    });
                }

                results_table = DRAW.sortArr(results_table);
                participants_boards = DRAW.sortBoards(teams_participants, participants_scores);
               // console.log("======<<<");
               // console.log(participants_scores);
                var teams = {};
                for (var i = 0; i < teams_participants.length; i++) {
                    var obj = teams_participants[i];

                    teams[obj.team_id] = teams[obj.team_id] || {};
                    teams[obj.team_id].team_id = obj.team_id;
                    teams[obj.team_id].users = teams[obj.team_id].users || [];

                    var user = {
                        user_id : obj.user_id,
                        name : obj.name,
                        email : obj.email,
                    };

                    teams[obj.team_id].name = teams_names[obj.team_id];

                    if (user.user_id) {
                        teams[obj.team_id].users.push(user);
                    }
                }

               // console.log("=====");
              //  console.log(results_table);

                tournaments_teams = teams;

                return pool.query('SELECT tr.* FROM tournaments_results tr WHERE tr.tournament_id = ? AND tr.tour = ?',
                [tournament_id, tour_id])
            }).then(function (results) {

                for (let i = 0, len = results.length; i < len; i++) {
                    let obj = results[i];

                    obj.p1_name = participants[obj.p1_id].name;
                    obj.p2_name = participants[obj.p2_id].name;

                    const team_id = participants[obj.p1_id].team_id;
                    tournament_results[team_id] = tournament_results[team_id] || [];
                    tournament_results[team_id].push(obj);

                    //поскольку идет перебор результатов тура, то по пути считаем количество очков команды
                    const team_id_2 = participants[obj.p2_id].team_id;
                    team_tour_points[team_id] = team_tour_points[team_id] || 0;
                    team_tour_points[team_id_2] = team_tour_points[team_id_2] || 0;
                    team_tour_points[team_id]+= obj.p1_won;
                    team_tour_points[team_id_2]+= obj.p2_won;

                }


            return pool
                .query('SELECT ttr.* FROM tournaments_teams_results ttr WHERE ttr.tournament_id = ? AND ttr.tour = ?', [tournament_id, tour_id])

            }).then(function (results) {
                teams_results = results;
                let pairs = [];

                for (let i = 0; i < teams_results.length; i++) {
                    let obj = teams_results[i];
                    obj.users = [];

                    if (typeof tournament_results[obj.team_1_id] !== "undefined") {
                        obj.users.push(tournament_results[obj.team_1_id]);
                        pairs.push(obj);
                    }
                }




            /*res.render('tournament/teams/pairing', {
                tournament: tournament,
                tour_id: tour_id,
                pairs: JSON.stringify(pairs),
                team_tour_points: JSON.stringify(team_tour_points),
                teams_scores: JSON.stringify(teams_scores),
                tournaments_teams: JSON.stringify(tournaments_teams)
            });*/

            return {
                tournament: tournament,
                tour_id: tour_id,
                tournaments_teams : tournaments_teams,
                team_tour_points: team_tour_points,
                participants_boards: participants_boards,
                participants_array: participants_array,
                results_table: results_table,
                teams_scores: teams_scores,
                pairs : pairs
            };

            /*res.json({
                    status: "ok",
                    tournament: tournament,
                    tour_id: tour_id,
                    team_tour_points: team_tour_points,
                    teams_scores: teams_scores,
                    pairs : pairs
                });*/

            });


            /*pool.query('SELECT tr.* FROM tournaments_results tr WHERE tr.tournament_id = ? AND tr.tour = ?', [tournament_id, tour_id])
                .then(function (results) {
                //получаем турнирные результаты
                tournament_results = results;
                return pool.query('SELECT tt.id AS team_id,tt.team_name, tp.user_id, u.name,u.email FROM tournaments_teams AS tt LEFT JOIN tournaments_participants AS tp ON tp.team_id = tt.id LEFT JOIN users AS u ON tp.user_id = u.id WHERE tt.tournament_id = ? ORDER BY tt.id DESC', tournament_id)
            }).then(function (results) {
                console.log(results.length);

                //console.log(results);
                var res = DRAW_TEAM.makeTeams(results, tournament_results);
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
                console.log(pairs);

            }).then(function (rows) {

                res.render('tournament/teams/pairing', {
                    tournament: tournament,
                    tour_id: tour_id,
                    pairs: JSON.stringify(pairs),
                    team_tour_points: JSON.stringify(team_tour_points),
                    teams_scores: JSON.stringify(teams_scores),
                    tournaments_teams: JSON.stringify(tournaments_teams)
                });

            }).catch(function (err) {
                console.log(err);
            });*/
    }
};



module.exports = DRAW;