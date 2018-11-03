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
const ObjectId = require('mongodb').ObjectId;

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


        var mongoGame, game;
        let tournament;
        var gameId = req.params.gameId;

            app.mongoDB.collection("users").findOne( ObjectId(gameId) )
                .then((data) => {
                mongoGame = data;

                if (!mongoGame) {
                    console.log("Игра не найдена.");
                    res.render('error', {
                        message  : "Game not found",
                    });
                    return false;
                }



                var p1_time_left =  mongoGame.p1_time_left, p2_time_left = mongoGame.p2_time_left;
                var actual_time = new Date().getTime();
                var lm = (mongoGame.p1_last_move) ? mongoGame.p1_last_move.getTime() : actual_time;
                var spent_time = actual_time - lm;
                var lm2 = (mongoGame.p2_last_move) ? mongoGame.p2_last_move.getTime() : actual_time;
                var spent_time2 = actual_time - lm2;
                if (mongoGame.is_started && mongoGame.is_over == 0 && ((lm < lm2) || (mongoGame.p1_last_move == null && mongoGame.p2_last_move != null))) {
                    p2_time_left = mongoGame.p2_time_left - spent_time2;
                } else if (mongoGame.is_started && mongoGame.is_over == 0 && ((lm > lm2) || (mongoGame.p2_last_move == null && mongoGame.p1_last_move != null))) {
                    p1_time_left = mongoGame.p1_time_left - spent_time;
                }


                let timeleft = (mongoGame.startTime) ? mongoGame.startTime.getTime() - new Date().getTime() : 0;


                res.render('game/game',
                    {
                        mongoGame : mongoGame,
                        timeleft : timeleft,
                        tournament : tournament,
                        p1_time_left : p1_time_left,
                        p2_time_left : p2_time_left
                    });
            }).catch(function (err) {
                console.log(err);
            })

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


