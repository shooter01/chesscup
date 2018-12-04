const pairsCalc = require('robin-js'); // CJS
const DRAW_TEAM = require('../draw_team_functions');

const teampairing = function (results, participants, tourney, bye_participants, pool) {
    let pairs = [], insert_object = [], already_played = {}, test = [], team_participants = [], team_results = [], teams_scores, additional_coef;

    console.log("roundrobin");


    pool
        .query("SELECT * FROM tournaments_teams WHERE tournament_id = ?", tourney.id)

        .then(rows => {
            team_participants = rows;
            //собираем результаты
            return  pool.query("SELECT * FROM tournaments_teams_results WHERE tournament_id = ?", tourney.id);
        })
        .then(rows => {
            team_results = rows;

            for (let i = 0; i < team_participants.length; i++) {
                test.push(team_participants[i].id);
            }


            //составляем пары
            pairs = pairsCalc(test);

            //брем пару по индексу
            if (typeof pairs[tourney.current_tour] != "undefined") {
                for (let pair of pairs[tourney.current_tour]) {
                    if (pair.length > 1) {
                        insert_object.push({
                            home : pair[0],
                            away : pair[1],
                        });
                    }
                }
            }
            console.log(pairs);
            console.log(insert_object);
            return pool
                .query('SELECT * FROM tournaments_teams_scores WHERE tournament_id = ?', tourney.id);

        })
        .then(rows => {
            let result = DRAW_TEAM.makeScores(results);
            teams_scores = result.teams_scores;
            additional_coef = result.additional_coef;

            var for_addition_teams = [];
            for (var i = 0; i < insert_object.length; i++) {
                var obj = insert_object[i], p1_won = null, p2_won = null;


                for_addition_teams.push(
                    [
                        obj.home,
                        obj.away,
                        p1_won,
                        p2_won,
                        teams_scores[obj.home] || 0,
                        teams_scores[obj.away] || 0,
                        tourney.id,
                        new Date(),
                        tourney.current_tour + 1,
                    ]);
            }
            console.log(for_addition_teams);


            /*if (((tourney.current_tour + 1) <= tourney.tours_count)) {
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
            }*/


            return insert_object;

        }).catch(function (err) {
            console.log(err);

        });




};


module.exports = teampairing;