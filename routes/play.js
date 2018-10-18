var express = require('express');
var router = express.Router();
const {isLoggedIn} = require('./middlewares');
const { check, validationResult } = require('express-validator/check');
const moment = require('moment');
const countries = require('./countries');
const DRAW = require('./draw_functions');
const save_result = require('./save_result');
const make_draw = require('./make_draw');
const save_result_mongo = require('./save_result_mongo');

const DRAW_TEAM = require('./draw_team_functions');
// const tournament_teams = require('./tournament_teams')(app, passport, pool);
// console.log(tournament_teams);
//const qs = require('querystring');
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



module.exports = function(app, passport, pool, i18n) {



    router.get('/', function (req, res, next) {



        res.render('play/index',
            {

            });


    });


    router.get('/game/:gameId', function (req, res, next) {
        res.render('play/playgame',
            {

            });

  /*      var mongoGame, game;
        let tournament;
        let tournament_id = req.params.tournament_id;
        let gameId = req.params.gameId;
        tournament_id = parseInt(tournament_id);
        gameId = parseInt(gameId);*/
/*        if (!isNaN(tournament_id) && !isNaN(gameId)) {

            pool
                .query('SELECT * FROM tournaments WHERE id = ?', tournament_id)
                .then(rows => {
                    tournament = rows[0];
                    return pool
                        .query('SELECT tr.*, ' +
                            'u2.name as p2_name, ' +
                            'u2.tournaments_rating as p2_tournaments_rating, ' +
                            'tr.rating_change_p1 as rating_change_p1, ' +
                            'tr.rating_change_p2 as rating_change_p2, ' +
                            'tr.p1_rating_for_history as p1_rating_for_history, ' +
                            'tr.p2_rating_for_history as p2_rating_for_history, ' +
                            'u1.tournaments_rating as p1_tournaments_rating, ' +
                            'u1.name AS p1_name ' +
                            'FROM tournaments_results tr LEFT JOIN users u1 ON tr.p1_id = u1.id LEFT JOIN users u2 ON tr.p2_id = u2.id  WHERE tr.id = ? LIMIT 1', gameId);
                }).then(rows => {
                    game = rows[0];
                    if (typeof game != "undefined" && req.isAuthenticated()){
                        if (req.session.passport.user.id == game.p1_id) {
                            app.mongoDB.collection("users").updateOne({_id: parseInt(game.id)},{$set: {p1_visited : true}});
                        }
                        if (typeof game != "undefined" && req.session.passport.user.id == game.p2_id) {
                            app.mongoDB.collection("users").updateOne({_id: parseInt(game.id)},{$set: {p2_visited : true}});
                        }
                    }
            }).then(rows => {
                //console.log(rows);


                }).then(rows => {

                    return app.mongoDB.collection("users").findOne( { _id: gameId } )
                }).then(data => {
                mongoGame = data;
                //console.log(mongoGame);



                var p1_time_left =  mongoGame.p1_time_left, p2_time_left = mongoGame.p2_time_left;
                var actual_time = new Date().getTime();
                var lm = (mongoGame.p1_last_move) ? mongoGame.p1_last_move.getTime() : actual_time;
                var spent_time = actual_time - lm;
                var lm2 = (mongoGame.p2_last_move) ? mongoGame.p2_last_move.getTime() : actual_time;
                var spent_time2 = actual_time - lm2;
                if (mongoGame.is_started && mongoGame.is_over == 0 && ((lm < lm2) || (mongoGame.p1_last_move == null && mongoGame.p2_last_move != null))) {
                   // p1_time_left = mongoGame.p1_time_left - spent_time;
                    p2_time_left = mongoGame.p2_time_left - spent_time2;
                } else if (mongoGame.is_started && mongoGame.is_over == 0 && ((lm > lm2) || (mongoGame.p2_last_move == null && mongoGame.p1_last_move != null))) {
                    p1_time_left = mongoGame.p1_time_left - spent_time;
                }
              //  console.log(mongoGame);
            //    var actual_time = new Date().getTime();
             //   (mongoGame.p1_last_move) ? mongoGame.p1_last_move.getTime() : actual_time;

                let timeleft = (mongoGame.startTime) ? mongoGame.startTime.getTime() - new Date().getTime() : 0;


                res.render('game/game',
                    {
                        mongoGame : mongoGame,
                        game : game,
                        timeleft : timeleft,
                        tournament : tournament,
                        p1_time_left : p1_time_left,
                        p2_time_left : p2_time_left
                    });
            })
        }*/
    });




    router.post('/create', [
            isLoggedIn,
            check('title', 'The title field is required').exists().isLength({ min: 1 }),
            check('city', 'The city field is required').exists().isLength({ min: 1 }),
            check('tours_count', 'The tours count field is required').exists().isLength({ min: 1 }),
            check('type', 'The tournament field is required').exists().isLength({ min: 1 }),
            check('country', 'The country field is required').exists().isLength({ min: 1 }),
            check('start_date', 'The start date field is required').exists().isLength({ min: 1 }),
            check('end_date', 'The end date field is required').exists().isLength({ min: 1 }),
            check('amount', 'The amount field is required').exists().isLength({ min: 1 }),
            // check('wait_minutes', 'The wait_minutes field is required').exists().isLength({ min: 1 }),
            check('is_online', 'The is_online field is required').exists().isLength({ min: 1 }),
            check('start_type', 'The start_type field is required').exists().isLength({ min: 1 }),
            check('accurate_date_start', 'The accurate_date_start field is required').exists().isLength({ min: 1 }),
            check('accurate_time_start', 'The accurate_time_start field is required').exists().isLength({ min: 1 }),

        ],
        function (req, res, next) {
            const errors = validationResult(req);
            //console.log(req.body.amount);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    errors: errors.mapped()
                });
            } else {
                var newDateObj;
                if (req.body.start_type === "interval") {
                    newDateObj = moment(new Date()).add(req.body.wait_minutes, 'm').toDate();
                } else {
                    newDateObj = moment(req.body.accurate_date_start + " " + req.body.accurate_time_start + ":00", 'DD-MM-YYYYTHH:mm').toDate();
                }

                //var newDateObj = moment(new Date()).add(req.body.wait_minutes, 'm').toDate();

                //var newDateObj = moment(req.body.accurate_date_start + " " + req.body.accurate_time_start + ":00", 'DD-MM-YYYYTHH:mm').toDate();





                //  res.json({
                //     status : "error",
                //      insertId : 1
                //  });
                pool.query('INSERT INTO tournaments SET ?', office).then(function (results) {
                    if (results.insertId > 0) {
                        res.json({
                            status : "ok",
                            insertId : results.insertId
                        });
                    }
                }).catch(function (err) {
                    console.log(err);
                });
            }
        });




    return router;


}


