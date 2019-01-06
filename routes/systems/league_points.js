
const league_points = function (tournament_results, participants, tourney, bye_participants, pool, app) {
    let scores_object = {}, participants1, scores_array = [], leagues_scores = [], users_ids = [];

    let sql = "SELECT ts.* FROM tournaments_scores ts WHERE ts.tournament_id = ? AND ts.tour = ?";
     pool
        .query(sql, [tourney.id, tourney.current_tour ])
    .then(rows => {

        participants1 = rows.sort(sortByScores);
        console.log(rows);
        let scores_ = makeScoresArray(participants1, tourney);
        scores_array = scores_.scores_array;
        scores_object = scores_.scores_object;
        users_ids = scores_.users_ids;


    }).then(rows => {
         let sql = "SELECT ts.* FROM leagues_scores ts WHERE ts.league_id = ? AND ts.season_id = ? AND user_id IN ?";
         return pool
             .query(sql, [tourney.league_id, tourney.season_id , [users_ids]])

    }).then(rows => {
         leagues_scores = rows; //все очки лиги

         for (var i = 0; i < leagues_scores.length; i++) {
             var obj = leagues_scores[i];
             if (scores_object[obj.user_id]) {
                 obj.points+=scores_object[obj.user_id];
                 scores_object[obj.user_id] = obj.points; //текущему пользователю добавляем очки с прошлых турниров
             }
         }

         var a = makeGlobalScoresArray(participants1, tourney, scores_object);



         console.log("=============league_points=============");
           console.log(a);
         return pool.query('INSERT INTO leagues_scores (user_id, league_id, season_id, points) VALUES ? ON DUPLICATE KEY UPDATE points=VALUES(points)', [a]);

       // console.log("=============league_points=============");
       // console.log(participants1);

    }).then(rows => {

         return pool.query('DELETE FROM leagues_results WHERE tournament_id = ?', tourney.id);

       // console.log("=============league_points=============");
       // console.log(participants1);

    }).then(rows => {
         return pool.query('INSERT INTO leagues_results (user_id, tournament_id, league_id, season_id, points) VALUES ?', [scores_array])

       // console.log("=============league_points=============");
       // console.log(participants1);

    }).catch(function (err) {
         console.log(err);

     });
}
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

//считаем очки текущего турнира
function makeScoresArray(participants1, tourney) {
    let scores_array = [], scores_object = {}, users_ids = [];
    let length = (participants1.length > 10) ? 10 : participants1.length;
    for (var i = 0; i < length; i++) {
        var obj = participants1[i];
        console.log(obj);

        scores_object[obj.user_id] = 100 - i*10;
        users_ids.push(obj.user_id);
        scores_array.push([
            obj.user_id,
            tourney.id,
            tourney.league_id,
            tourney.season_id,
            100 - i*10,
        ]);
    }
    return { scores_object : scores_object , scores_array : scores_array , users_ids : users_ids};
}


function makeGlobalScoresArray(participants1, tourney, scores_object) {
    let a = [];
    let length = (participants1.length > 10) ? 10 : participants1.length;
    for (var i = 0; i < length; i++) {
        var obj = participants1[i];
        a.push([
            obj.user_id,
            tourney.league_id,
            tourney.season_id,
            scores_object[obj.user_id],
        ]);
    }
    return a;
}


module.exports = league_points;