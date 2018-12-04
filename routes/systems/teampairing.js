const pairsCalc = require('robin-js'); // CJS
const DRAW_TEAM = require('../draw_team_functions');

const teampairing = function (results, participants, tourney, bye_participants, pool) {
    let pairs = [], insert_object = [], already_played = {}, test = [], team_participants = [], team_results = [], teams_scores, additional_coef, participants_insert_array = [];

    console.log("roundrobin");

    const teams = makeObjectByPair(participants);



    return pool
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
          //  console.log(pairs);
            return pool
                .query('SELECT * FROM tournaments_teams_scores WHERE tournament_id = ? AND tour = ?', [tourney.id, tourney.current_tour]);

        })
        .then(rows => {
            let result = DRAW_TEAM.makeScores(rows);
            teams_scores = result.teams_scores;
            additional_coef = result.additional_coef;
            console.log(">>>><<<<<<");
            console.log(teams_scores);
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

            participants_insert_array = [];
            //перебираем составленные пары команд
            for (let i = 0; i < insert_object.length; i++) {
                let obj1 = insert_object[i];
                const home = obj1.home;
                const away = obj1.away;
                for (let i = 0; i < tourney.team_boards; i++) {
                    const first_board_team_1 = teams[home][i];
                    const first_board_team_2 = teams[away][i];
                    participants_insert_array.push({
                        home: first_board_team_1,
                        away: first_board_team_2,
                    });
                }
            }
            console.log(teams);
            console.log(insert_object);
            console.log(participants_insert_array);


            if (((tourney.current_tour + 1) <= tourney.tours_count)) {

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

            } else {
                return true
            }
        })
            .then(rows => {

            return participants_insert_array;

        }).catch(function (err) {
            console.log(err);

        });




};


//функция создает объект команды, с объектом ключей -
function makeObjectByPair(participants) {
    let teams = {};
    for (let i = 0; i < participants.length; i++) {
        let obj1 = participants[i];

        teams[obj1.team_id] = teams[obj1.team_id] || {};
        teams[obj1.team_id][obj1.team_board] = obj1.user_id;
    }
    return teams;


}

module.exports = teampairing;