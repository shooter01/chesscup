const swisspairing = require('swiss-pairing');

const DRAW_TEAM = {
    makeTeamResults : function (results, participants) {

        var teams = {}, participants_obj = {};

        for (var i = 0; i < participants.length; i++) {
            var obj = participants[i];
            participants_obj[obj.user_id] = obj.team_id;
        }

        for (var i = 0; i < results.length; i++) {
            var team_id = participants_obj[results[i].p1_id];
            var team_id_2 = participants_obj[results[i].p2_id];
            teams[team_id] = teams[team_id] || 0;
            teams[team_id_2] = teams[team_id_2] || 0;
            teams[team_id]+= results[i].p1_won;
            teams[team_id_2]+= results[i].p2_won;
        }
        return { teams : teams, participants_obj : participants_obj };


        /*for (var i = 0; i < participants.length; i++) {
         var obj = participants[i];
         participants_obj[obj.user_id] = obj.team_id;

         teams[obj.team_id] = teams[obj.team_id] || {};
         teams[obj.team_id].team_id = obj.team_id;
         teams[obj.team_id].users = teams[obj.team_id].users || [];

         var user = {
         user_id : obj.user_id,
         name : obj.name,
         email : obj.email,
         };
         teams[obj.team_id].name = obj.team_name;

         if (user.user_id) {
         teams[obj.team_id].users.push(user);
         }
         }

         for (var i = 0; i < results.length; i++) {
         var team_id = participants_obj[results[i].p1_id];
         var team_id_2 = participants_obj[results[i].p2_id];
         teams[team_id] = teams[team_id] || 0;
         teams[team_id_2] = teams[team_id_2] || 0;
         teams[team_id]+= results[i].p1_won;
         teams[team_id_2]+= results[i].p2_won;
         }
         console.log(teams);
         return { teams : teams, participants_obj : participants_obj };*/
    },

    makeInsertTeamsScoresObject : function (participants, tournament_results, team_swiss) {
        var teams = {}, participants_obj = {}, team_tour_points = {};
        for (var i = 0; i < participants.length; i++) {
            var obj = participants[i];

            participants_obj[obj.user_id] = obj.team_id;

            teams[obj.team_id] = teams[obj.team_id] || {};
            teams[obj.team_id].team_id = obj.team_id;
            teams[obj.team_id].users = teams[obj.team_id].users || [];

            var user = {
                user_id : obj.user_id,
                name : obj.name,
                email : obj.email,
            };
            teams[obj.team_id].name = obj.team_name;

            if (user.user_id) {
                teams[obj.team_id].users.push(user);
            }
        }


        for (var i = 0; i < tournament_results.length; i++) {
            var team_id = participants_obj[tournament_results[i].p1_id];
            var team_id_2 = participants_obj[tournament_results[i].p2_id];
            team_tour_points[team_id] = team_tour_points[team_id] || 0;
            team_tour_points[team_id_2] = team_tour_points[team_id_2] || 0;
            team_tour_points[team_id]+= tournament_results[i].p1_won;
            team_tour_points[team_id_2]+= tournament_results[i].p2_won;
        }

        var pairs = [];

        for (var i = 0; i < team_swiss.swiss.length; i++) {
            var obj = team_swiss.swiss[i];
            //если такая команда существует
            if (typeof teams[obj.home] != "undefined" && typeof teams[obj.home] != "undefined") {
                for (var j = 0; j < 5; j++) {
                    var obj1 = j;

                    if ((teams[obj.home] && teams[obj.home].users[j]) || (teams[obj.away] && teams[obj.away].users[j])) {
                        //console.log(teams[obj.away]);

                        pairs.push({
                            home : (typeof teams[obj.home] != "undefined" && typeof teams[obj.home].users[j] != "undefined") ? teams[obj.home].users[j].user_id : null,
                            away : (typeof teams[obj.away] != "undefined" && typeof teams[obj.away].users[j] != "undefined") ? teams[obj.away].users[j].user_id : null,
                        });
                    }


                }
            }

        }
        return { teams : teams, participants : participants_obj, team_tour_points : team_tour_points, pairs : pairs };
    },


    makePairs : function (participants, teams_results, tournaments_teams, participants_obj) {
        var teams = {}, pairs = [];
        for (var i = 0; i < participants.length; i++) {
            var obj = participants[i];

            if (participants_obj[obj.p1_id] || participants_obj[obj.p2_id]){
                if (participants_obj[obj.p1_id]){
                    teams[participants_obj[obj.p1_id]] = teams[participants_obj[obj.p1_id]] || [];
                    teams[participants_obj[obj.p1_id]].push(obj);
                } else {
                    teams[participants_obj[obj.p2_id]] = teams[participants_obj[obj.p2_id]] || [];
                    teams[participants_obj[obj.p2_id]].push(obj);
                }
            }
        }

        for (var i = 0; i < teams_results.length; i++) {
            var obj = teams_results[i];


            var temp_obj = {
                team_1_id: obj.team_1_id,
                team_2_id: obj.team_2_id,
                team_1_scores: obj.team_1_scores,
                team_2_scores: obj.team_2_scores,
                team_1_won: obj.team_1_won,
                team_2_won: obj.team_2_won,
                users : []
            };

            if (teams[obj.team_1_id]) {
                for (var j = 0; j < teams[obj.team_1_id].length; j++) {
                    temp_obj.users.push(teams[obj.team_1_id][j]);
                }
            }

            if (teams[obj.team_2_id]) {
                for (var j = 0; j < teams[obj.team_2_id].length; j++) {
                    temp_obj.users.push(teams[obj.team_2_id][j]);
                }
            }


            pairs.push(temp_obj);
        }

        return pairs;
    },

    makeScores : function (results) {
        let arr = {};
        for (var i = 0; i < results.length; i++) {
            var obj = results[i];
            arr[obj.team_id] = obj.scores;
        }
        return arr;
    },

    sortArr : function (arrr) {

        arrr.sort(sortByScores);

        function sortByScores(a,b) {
            if (a.scores > b.scores)
                return -1;
            if (a.scores < b.scores)
                return 1;
            if (a.team_scores > b.team_scores)
                return -1;
            if (a.team_scores < b.team_scores)
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

    makeTeams : function (participants, tournament_results) {
        var teams = {}, participants_obj = {}, team_tour_points = {};
        for (var i = 0; i < participants.length; i++) {
            var obj = participants[i];

            participants_obj[obj.user_id] = obj.team_id;

            teams[obj.team_id] = teams[obj.team_id] || {};
            teams[obj.team_id].team_id = obj.team_id;
            teams[obj.team_id].users = teams[obj.team_id].users || [];

            var user = {
                user_id : obj.user_id,
                name : obj.name,
                email : obj.email,
            };
            teams[obj.team_id].name = obj.team_name;

            if (user.user_id) {
                teams[obj.team_id].users.push(user);
            }
        }
        for (var i = 0; i < tournament_results.length; i++) {
            var team_id = participants_obj[tournament_results[i].p1_id];
            var team_id_2 = participants_obj[tournament_results[i].p2_id];
            team_tour_points[team_id] = team_tour_points[team_id] || 0;
            team_tour_points[team_id_2] = team_tour_points[team_id_2] || 0;
            team_tour_points[team_id]+= tournament_results[i].p1_won;
            team_tour_points[team_id_2]+= tournament_results[i].p2_won;
        }
        //console.log(tournament_results);
        return { teams : teams, participants : participants_obj, team_tour_points : team_tour_points };
    },

    makeTourScores : function (tournament_results) {
        var teams = {};
        for (var i = 0; i < tournament_results.length; i++) {
            var obj = tournament_results[i];

            teams[obj.team_1_id] = obj.team_1_won;
            teams[obj.team_2_id] = obj.team_2_won;


        }

        return  teams;
    }










};



module.exports = DRAW_TEAM;