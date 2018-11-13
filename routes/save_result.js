
var Elo = require('arpad');
var uscf = {
    default: 20,
    2100: 15,
    2400: 10
};

var min_score = 100;
var max_score = 10000;

var elo = new Elo(uscf, min_score, max_score);
const bluebird = require('bluebird');
const make_draw = require('./make_draw');



let throttle = {};
const save_result = function (data) {
    const tournament_id = data.tournament_id;
    let result = data.result;
    let pool = data.pool;
    let app = data.app;
    let req = data.req;
    let res = data.res;


    if (!tournament_id) {
        console.log("tournament_id not defined");
        return false
    }

        let office = {
            p1_won: result.p1_won,
            p2_won: result.p2_won,
        };
        var tourney, participants, teams_points, p1_new_rating = 1200, p2_new_rating = 1200;
       // console.log(tournament_id);
        return pool
            .query('SELECT * FROM tournaments WHERE id = ?', tournament_id)
            .then(rows => {
                tourney = rows[0];
                return pool.query('SELECT u1.tournaments_rating AS rating_p1, u2.tournaments_rating AS rating_p2 FROM tournaments_results tr LEFT JOIN users u1 ON tr.p1_id = u1.id LEFT JOIN users u2 ON tr.p2_id = u2.id WHERE tr.tournament_id = ? AND p1_id = ? AND p2_id = ?', [
                    tournament_id,
                    result.p1_id,
                    result.p2_id]);
            })
            .then(function (results) {

                if (results[0]) {
                    var rating_p1 = (results[0].p1_rating_for_history) ? results[0].p1_rating_for_history : results[0].rating_p1;
                    var rating_p2 = (results[0].p2_rating_for_history) ? results[0].p2_rating_for_history : results[0].rating_p2;
                    if (result.p1_won == 0 && result.p2_won == 0) {
                        office["p1_rating_for_history"] = office["p2_rating_for_history"] =  office["rating_change_p1"] = office["rating_change_p2"] = null;
                    } else {
                        var odds_p1_wins = elo.expectedScore(rating_p1, rating_p2);
                        var odds_p2_wins = elo.expectedScore(rating_p2, rating_p1);
                        office["p1_rating_for_history"] =  rating_p1;
                        office["p2_rating_for_history"] =  rating_p2;
                        p1_new_rating = elo.newRating(odds_p1_wins, result.p1_won, rating_p1);
                        p2_new_rating = elo.newRating(odds_p2_wins, result.p2_won, rating_p2);
                        office["rating_change_p1"] = p1_new_rating - rating_p1;
                        office["rating_change_p2"] = p2_new_rating - rating_p2;
                        office["is_over"] = 1;
                        //console.log(office);
                        //console.log(rating_p1);
                        //console.log(rating_p2);
                        //console.log(odds_p1_wins);
                        //console.log(odds_p2_wins);
                        //console.log(result.p1_won);
                    }
                }


                var request_string1 = "= ?";
                var request_string2 = "= ?";

                if (result.p1_id == null) {
                    request_string1 = "IS ?";
                }

                if (result.p2_id == null) {
                    request_string2 = "IS ?";
                }

                return pool.query('UPDATE tournaments_results SET ? ' +
                    'WHERE ' +
                    'tournaments_results.tournament_id = ? AND tour = ? AND p1_id ' + request_string1 + ' AND p2_id ' + request_string2,
                    [
                        office,
                        tourney.id,
                        tourney.current_tour,
                        result.p1_id,
                        result.p2_id,

                    ]);


            }).then(function (results) {
            return pool.query('UPDATE users SET ? ' +
                'WHERE ' +
                'id  = ?',
                [
                    {
                        tournaments_rating : p1_new_rating
                    },
                    result.p1_id,
                ]);

        }).then(function (results) {

            return pool.query('UPDATE users SET ? ' +
                'WHERE ' +
                'id  = ?',
                [
                    {
                        tournaments_rating : p2_new_rating
                    },
                    result.p2_id,
                ]);



        }).then(function (results) {

            if (tourney.type > 10){
                return pool.query('SELECT tt.id AS team_id,tt.team_name, tp.user_id, u.name,u.email FROM tournaments_teams AS tt LEFT JOIN tournaments_participants AS tp ON tp.team_id = tt.id LEFT JOIN users AS u ON tp.user_id = u.id WHERE tt.tournament_id = ? ORDER BY tt.id DESC', tourney.id);
            } else {
                return true;
            }

        }).then(function (results) {

            participants = results;



            if (tourney.type > 10){
                return pool.query('SELECT tr.* FROM tournaments_results tr WHERE tr.tournament_id = ? AND tr.tour = ?', [tourney.id, tourney.current_tour]);
            } else {
                return true;
            }

        }).then(function (results) {

            if (tourney.type > 10){

                teams_points = DRAW_TEAM.makeTeamResults(results, participants);

                var team_1, team_2, office = {};

                var team_2_id = teams_points.participants_obj[result.p2_id];
                var team_1_id = teams_points.participants_obj[result.p1_id];

                office["team_1_won"] = teams_points.teams[team_1_id];
                office["team_2_won"] = teams_points.teams[team_2_id];


                var request_string1 = "= ?";
                var request_string2 = "= ?";

                return pool.query('UPDATE tournaments_teams_results SET ? ' +
                    'WHERE ' +
                    'tournaments_teams_results.tournament_id = ? AND tour = ? AND team_1_id ' + request_string1 + ' AND team_2_id ' + request_string2,
                    [
                        office,
                        tourney.id,
                        tourney.current_tour,
                        team_1_id,
                        team_2_id,

                    ]);

            } else {
                return true;
            }
        }).then(function (results) {

                return pool.query('SELECT COUNT(*) as count FROM tournaments_results tr WHERE (tr.p1_won IS NULL AND tr.p2_won IS NULL) AND tr.tournament_id = ? AND tr.tour = ?', [tourney.id, tourney.current_tour]);

            }).then(function (results) {
                //console.log(">>>");
                //console.log(results[0].count == 0);
                //console.log(throttle[tourney.id + "" + tourney.current_tour]);
                if (results[0].count == 0 && tourney.is_online == 1 && !throttle[tourney.id + "" + tourney.current_tour]) {
                    throttle[tourney.id + "" + tourney.current_tour] = true;
                    make_draw({
                        tournament_id : tournament_id,
                        pool : pool,
                        app : app,
                        req : req,
                        res : res,
                    });
                    //console.log(throttle);
                    //console.log("OVER");

                    setTimeout(function () {
                        delete throttle[tourney.id + "" + tourney.current_tour];
                    }, 10000)

                } else {
                    //console.log(throttle);
                    //запускаем всем свежую информацию

                    app.mongoDB.collection("cache").deleteMany({tournament_id: tourney.id}, function (err, mongoGame) {
                        app.ROOMS.emit('t' + tournament_id,
                            JSON.stringify({
                                "action" : "tournament_event"
                            }));
                    });

                   /*app.mongoDB.collection("cache").deleteMany({tournament_id: tourney.id}, function (err, mongoGame) {
                        app.io.to('t' + tournament_id).emit('tournament_event',
                            JSON.stringify({}));
                    });*/


                    setTimeout(function () {
                        delete throttle[tourney.id + "" + tourney.current_tour];
                    }, 10000)

                }
            }).then(function (results) {
            /*return res.json({
                status : "ok",
                tourney_id : req.body.tournament_id,
                rating_change_p1 : office["rating_change_p1"],
                rating_change_p2 : office["rating_change_p2"],
                teams_points : (typeof teams_points != "undefined") ? teams_points.teams : null,
            });*/
            return{
                status : "ok",
                tourney_id : tournament_id,
                rating_change_p1 : office["rating_change_p1"],
                rating_change_p2 : office["rating_change_p2"],
                teams_points : (typeof teams_points != "undefined") ? teams_points.teams : null,
            };

        }).catch(function (err) {
            console.log(err);
        });

}


module.exports = save_result;