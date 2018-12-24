const pairsCalc = require('robin-js'); // CJS
const DRAW_TEAM = require('../draw_team_functions');
console.log("DRAW");
console.log(DRAW_TEAM);

const teampairing = function (results, participants, tourney, bye_participants, pool, app) {
    let pairs = [],
        insert_object = [],
        already_played = {},
        test = [],
        team_participants = [],
        team_results = [],
        teams_scores,
        additional_coef,
        tours_count, //количество туров
        team_points = {},//командные очки (id команды как ключ)
        teams_scores_object = [],//объект для вставки в tournaments_teams_scores
        participants_insert_array = [];


    const teams = makeObjectByPair(participants);



    return pool
        .query("SELECT * FROM tournaments_teams WHERE tournament_id = ?", tourney.id)

        .then(rows => {
            team_participants = rows;

            if (team_participants.length < 2) {
                pool.query('UPDATE tournaments SET ? WHERE tournaments.id = ?',[{
                    current_tour : 0,
                    is_active : 1,
                    is_closed : 1,
                    is_canceled : 1,
                }, tourney.id]).then(function () {

                    console.log("CANCELED");

                });
                throw new Error("Too small quantity of participants");
            } else {
                 tours_count = getToursCount(tourney, team_participants);
                 return pool.query('UPDATE tournaments SET ? WHERE tournaments.id = ?',[{
                    tours_count : tours_count
                }, tourney.id]);
            }
        })
        .then(rows => {
            //собираем результаты
            return  pool.query("SELECT * FROM tournaments_teams_results WHERE tournament_id = ?", [tourney.id]);

        })
        .then(rows => {
            team_results = rows;

            //командные очки за все время
            team_points = getTeamPoints(rows);
           // console.log(">>>><<<<<<");
          //  console.log(team_points);
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

            console.log(">>>>>");
            console.log(insert_object);
            var for_addition_teams = [];
            for (var i = 0; i < insert_object.length; i++) {
                var obj = insert_object[i], p1_won = null, p2_won = null;


                for_addition_teams.push(
                    [
                        obj.home,
                        obj.away,
                        p1_won,
                        p2_won,
                        team_points[obj.home] || 0,
                        team_points[obj.away] || 0,
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
                    if (typeof first_board_team_1 != "undefined" || typeof first_board_team_2 != "undefined") {
                        participants_insert_array.push({
                            home: first_board_team_1,
                            away: first_board_team_2,
                        });
                    }
                }
            }

        //    console.log(participants_insert_array);
         ///   console.log(teams);
         //   console.log(insert_object);
           console.log("<<<<<<<<");
           console.log(tourney.current_tour);
           console.log(tourney.tours_count);


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
            let scores = [];
            //teams_scores_object = getTeamsScores();

            //получаем бергер объект
            const berger = getBerger(team_results);
            //считаем бергер на основе полученного бергер объекта
            const berger_object = sumBergerObject(berger, team_points);
            //считаем бухгольц
            const buhgolz = getBuhgolz(team_results, team_points);
            const boardPoints = getBoardPoints(team_results);


            for (let i = 0; i < team_participants.length; i++) {
                let obj = team_participants[i];
                scores.push([
                    obj.id,
                    tourney.id,
                    tourney.current_tour,
                    team_points[obj.id],
                    boardPoints[obj.id],
                    buhgolz[obj.id],
                    berger_object[obj.id],
                ]);
            }


             return pool.query('INSERT INTO tournaments_teams_scores (team_id, tournament_id, tour, scores, team_scores, bh, berger) VALUES ?', [scores])

        })
        .then(rows => {

            return participants_insert_array;

        }).catch(function (err) {
            return err;
        });
};



function getBuhgolz(tournament_results, participants_object) {
    let buhgolz = {};

    for (let i = 0; i < tournament_results.length; i++) {
        let obj = tournament_results[i];
        //исключаем пары, в которых есть Null
        if (obj["team_1_id"] != null && obj["team_2_id"] != null) {
            buhgolz[obj["team_1_id"]] = buhgolz[obj["team_1_id"]] || 0;
            buhgolz[obj["team_2_id"]] = buhgolz[obj["team_2_id"]] || 0;

            if (typeof participants_object[obj["team_2_id"]] != "undefined") {
                buhgolz[obj["team_1_id"]]+= participants_object[obj["team_2_id"]];
            }

            if (typeof participants_object[obj["team_1_id"]] != "undefined") {
                buhgolz[obj["team_2_id"]]+= participants_object[obj["team_1_id"]];
            }
        }
    }
    return  buhgolz;
}


function sumBergerObject(berger, participants_object) {
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
}


function getBerger(results) {
    var berger_object = {};
    var newArr = [];

    for (var i = 0; i < results.length; i++) {
        var obj = results[i];

        berger_object[obj["team_1_id"]] = berger_object[obj["team_1_id"]] || {wins : {}, draw : {}};
        berger_object[obj["team_2_id"]] = berger_object[obj["team_2_id"]] || {wins : {}, draw : {}};

        if (obj['team_1_id'] != null && obj['team_2_id'] != null){
            if (obj['team_1_won'] > obj['team_2_won']) {
                berger_object[obj["team_1_id"]]["wins"][obj["team_2_id"]] = true;
            } else if (obj['team_2_won'] > obj['team_1_won']){
                berger_object[obj["team_2_id"]]["wins"][obj["team_1_id"]] = true;
            }

            if (obj['team_1_won'] === obj['team_2_won'] && Number.isFinite(obj['team_1_won']) && Number.isFinite(obj['team_2_won'])) {
                berger_object[obj["team_1_id"]]["draw"][obj["team_2_id"]] = true;
                berger_object[obj["team_2_id"]]["draw"][obj["team_1_id"]] = true;
            }
        }
    }

    return berger_object;
}
function getTeamsScores() {


    /*for (var obj in after_tour_team_results_sum) {
        after_tour_team_results_sum_array.push([
            obj,
            tournament_id,
            after_tour_team_results_sum[obj].scores || 0,
            after_tour_team_results_sum[obj].team_scores || 0,
            played_arrays[obj] || 0,
            team_berger[obj] || 0,
        ]);
    }*/
}


//фнукция создает команды в качестве ключе и кто сколько набрал
//за победу - 2 очка, поражение 0, ничья - 1
function getTeamPoints(rows) {
    var temp = {};
    var win_lose = {};

    for (let i = 0; i < rows.length; i++) {
        let obj1 = rows[i];
        temp[obj1.team_1_id] = obj1.team_1_won || 0;
        temp[obj1.team_2_id] = obj1.team_2_won || 0;

        win_lose[obj1.team_1_id] = win_lose[obj1.team_1_id] || 0;
        win_lose[obj1.team_2_id] = win_lose[obj1.team_2_id] || 0;

        //console.log(obj1);
        if (temp[obj1.team_1_id] > temp[obj1.team_2_id]) {
            win_lose[obj1.team_1_id]+=  2;
            win_lose[obj1.team_2_id]+=  0;
        } else if (temp[obj1.team_2_id] > temp[obj1.team_1_id]) {
            win_lose[obj1.team_1_id]+=  0;
            win_lose[obj1.team_2_id]+=  2;
        } else if (temp[obj1.team_2_id] == temp[obj1.team_1_id]) {
            win_lose[obj1.team_1_id]+=  1;
            win_lose[obj1.team_2_id]+=  1;
        }
    }

    //console.log(temp);

    delete temp['null'];

    return win_lose;
}

function getBoardPoints(rows) {
    var temp = {};

    for (let i = 0; i < rows.length; i++) {
        let obj1 = rows[i];
        temp[obj1.team_1_id] = temp[obj1.team_1_id] || 0;
        temp[obj1.team_2_id] = temp[obj1.team_2_id] || 0;
        if (obj1['team_1_won'] && Number.isFinite(obj1['team_1_won'])) {
            temp[obj1.team_1_id]+=obj1['team_1_won'];
        }
        if (obj1['team_2_won'] && Number.isFinite(obj1['team_2_won'])) {
            temp[obj1.team_2_id]+=obj1['team_2_won'];
        }
    }

    //console.log(temp);

    delete temp['null'];

    return temp;
}


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


//функция создает объект команды, с объектом ключей -
function getToursCount(tourney, participants) {
    let tours_count = tourney.tours_count;

    //если это круговой индивидуальный турнир
    if (tourney.type === 11) {
        //количество участников нечетное?
        const isOdd = participants.length % 2 === 1;
        tours_count = (isOdd) ? participants.length : participants.length - 1;
    }

    return tours_count;


}

module.exports = teampairing;