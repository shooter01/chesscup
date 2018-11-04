const DRAW = require('./draw_functions');

const create_tournament_cache = function(tournament_id, app, callback, res) {

    tournament_id = parseInt(tournament_id);
    const pool = app.pool;
    if (!isNaN(tournament_id)) {
        pool
            .query('SELECT * FROM tournaments WHERE id = ?', tournament_id)
            .then(rows => {
                const tournament = rows[0];
                let participants, pairing = [], arrr = [], scores_object = {}, current_games = {}, mongoinsert = {};
                let tour_id = parseInt(tournament.current_tour);


                app.mongoDB.collection("cache").findOne({tournament_id : tournament.id, tour : tour_id}, function (err, mongoTournament) {
                    if (!mongoTournament) {
                        console.log("CACHE NOT FOUND");

                        pool
                            .query('SELECT tr.*, u1.name AS p1_name,u1.tournaments_rating AS p1_rating, u2.name AS p2_name, u2.tournaments_rating AS p2_rating FROM tournaments_results tr LEFT JOIN users u1 ON tr.p1_id = u1.id LEFT JOIN  users u2 ON tr.p2_id = u2.id WHERE tr.tournament_id = ? AND tr.tour = ?', [tournament_id, tour_id])
                            .then(rows => {
                                pairing = rows;
                                mongoinsert.pairing = pairing;
                            }).then(rows => {

                            let sql = 'SELECT tp.user_id,tp.is_active, ts.scores, u.name, u.tournaments_rating, ts.rating,ts.rating_change,ts.bh,ts.berger FROM tournaments_participants tp LEFT JOIN tournaments_scores ts ON ts.user_id = tp.user_id LEFT JOIN users u ON u.id = tp.user_id WHERE tp.tournament_id = ? AND ts.tournament_id = ?';
                            if (tournament.is_active == 0) {
                                sql = 'SELECT tp.user_id,tp.is_active, u.name FROM tournaments_participants tp LEFT JOIN users u ON u.id = tp.user_id WHERE tp.tournament_id = ?';
                            }

                            return pool
                                .query(sql, [tournament_id, tournament_id])
                        }).then(rows => {
                            var a = [];
                            // console.log(rows);
                            for (var i = 0; i < rows.length; i++) {
                                var obj = rows[i];

                                scores_object[obj.user_id] = obj.scores;
                                a.push({
                                    user_id: obj.user_id,
                                    scores: obj.scores,
                                    bh: obj.bh,
                                    berger: obj.berger,
                                    name: obj.name,
                                    // crosstable: crosstable,
                                    is_active: obj.is_active,
                                    tournaments_rating: obj.tournaments_rating,
                                });
                            }
                            participants = DRAW.sortArr(a);


                            mongoinsert.participants = participants;
                            mongoinsert.scores_object = scores_object;
                            mongoinsert.tournament_id = tournament.id;
                            mongoinsert.tour = tournament.current_tour;


                        }).then(rows => {

                            app.mongoDB.collection("cache").insertOne({

                                    "participants": mongoinsert.participants,
                                    "scores_object": mongoinsert.scores_object,
                                    "pairing": mongoinsert.pairing,
                                    "tour": parseInt(tournament.current_tour),
                                    "tournament_id": parseInt(tournament.id),
                                }
                                , function () {
                                    console.log("INSERTED");

                                    if (typeof callback !== "undefined") {
                                        callback();
                                    }
                                    console.log("КЕШ СОЗДАН");
                                    console.log(res);

                                    if (typeof res !== "undefined" && res) {

                                        try {
                                            res.json({
                                                tournament  : tournament,
                                                pairing  : JSON.stringify(pairing),
                                                participants : participants,
                                                tour_id : tour_id,
                                                scores_object :  JSON.stringify(scores_object),
                                            });
                                        } catch(e){
                                            console.log(e.message);
                                        }

                                    }



                                });



                        }).catch(function (err) {
                            console.log(err);
                        });
                    } else {
                        res.json({
                            tournament  : tournament,
                            pairing  : JSON.stringify(pairing),
                            participants : participants,
                            tour_id : tour_id,
                            scores_object :  JSON.stringify(scores_object),
                        });
                        console.log("КЕШ ОБНАРУЖЕН И НЕ СОЗДАН");
                    }
                });
            });
    };
}


module.exports = create_tournament_cache;