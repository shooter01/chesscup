var express = require('express');
var router = express.Router();
const bluebird = require('bluebird');
const TITLES = {
    "1" : "CM",
    "2" : "NM",
    "3" : "FM",
    "4" : "IM",
    "5" : "GM",
    "10" : "WCM",
    "20" : "WNM",
    "30" : "WFM",
    "40" : "WIM",
    "50" : "WGM",
};
const {isLoggedIn} = require('./middlewares');
const { check, validationResult } = require('express-validator/check');
const moment = require('moment');
const countries = require('./countries');
const DRAW = require('./draw_functions');

DRAW.defaultSwiss = bluebird.promisifyAll(DRAW.defaultSwiss)
DRAW.teamSwiss = bluebird.promisifyAll(DRAW.teamSwiss)


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



module.exports = function(app, passport, pool, i18n) {




    router.get('/create', [isLoggedIn], function (req, res, next) {

        res.render('tournament/create', {
            countries : countries
        });

    });


    router.get('/:tournament_id/game/:gameId', function (req, res, next) {

        var mongoGame, game;
        let tournament;
        let tournament_id = req.params.tournament_id;
        let gameId = req.params.gameId;
        tournament_id = parseInt(tournament_id);
        gameId = parseInt(gameId);
        if (!isNaN(tournament_id) && !isNaN(gameId)) {

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

                    if (data) {


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

                } else {
                    res.render('error', {
                        message  : "Игра не найдена",
                    });
                }
            })
        } else {
            res.render('error', {
                message  : "Игра не найдена",
            });
        }
    });


    router.get('/:tournament_id/get_active', [
            check('tournament_id', 'Вы не указали турнир.').exists().isLength({ min: 1 })
        ],
        function (req, res, next) {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    errors: errors.mapped()
                });
            } else {

                let tournament_id = req.params.tournament_id;
                tournament_id = parseInt(tournament_id);
                if (!isNaN(tournament_id)) {

                    app.mongoDB.collection("users").find({tournament_id: tournament_id, is_over: 0}, function(err, cursor) {
                        let current_games = {};
                        cursor.forEach(function (game) {
                            //console.log(game);
                            current_games[game._id] = game;

                        }, function () {
                            res.json({
                                status : "ok",
                                current_games : JSON.stringify(current_games)
                            });
                        });





                    });

                }




            }
        });



    router.post('/create', [
        isLoggedIn,
        check('title', 'The title field is required').exists().isLength({ min: 1 }),
        check('city', 'The city field is required').exists().isLength({ min: 1 }),
        check('tours_count', 'The tours count field is required and must be between 1 and 13').exists().isInt({ min: 1, max: 13 }).isLength({ min: 1 }),
        check('type', 'The tournament field is required').exists().isLength({ min: 1 }),
        check('country', 'The country field is required').exists().isLength({ min: 1 }),
        check('time_inc', 'time increment field is required').exists().isLength({ min: 1 }),
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




            let office = {
                title: req.body.title.trim(),
                city: req.body.city.trim(),
                tours_count: req.body.tours_count.trim(),
                country: req.body.country,
                type: req.body.type,
                time_inc: req.body.time_inc,
                is_active : 0,
                start_date: req.body.start_date,
                amount: parseInt(req.body.amount),
                start_time: newDateObj,
                is_online: req.body.is_online,
                // wait_minutes: parseInt(req.body.wait_minutes),
                accurate_date_start: req.body.accurate_date_start,
                accurate_time_start: req.body.accurate_time_start,
                end_date: req.body.end_date,
                team_boards: req.body.team_boards,
                start_type: req.body.start_type,
                current_tour: 0,
                created_at: new Date(),
                creator_id: req.session.passport.user.id,
            };

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

    router.post('/update', [
        isLoggedIn,
            check('title', 'The title field is required').exists().isLength({ min: 1 }),
            check('city', 'The city field is required').exists().isLength({ min: 1 }),
            check('tours_count', 'The tours count field is required and must be between 1 and 13').exists().isInt({ min: 1, max: 13 }).isLength({ min: 1 }).custom((value, { req }) => {

            return new Promise((resolve, reject) => {

                pool.query('SELECT * FROM tournaments WHERE id = ?', [
                    req.body.tournament_id.trim()
                ]).then(function (rows) {
                    if(rows.length > 0 && rows[0].current_tour > value) {
                        return reject("The current tour is higher than you entered");
                    } else {
                        return resolve();
                    }
                });
            });
        }),
            check('type', 'The tournament field is required').exists().isLength({ min: 1 }),
            check('country', 'The country field is required').exists().isLength({ min: 1 }),
            check('start_date', 'The start date field is required').exists().isLength({ min: 1 }),
            check('end_date', 'The end date field is required').exists().isLength({ min: 1 }),
            check('amount', 'The amount field is required').exists().isLength({ min: 1 }),
            // check('wait_minutes', 'The wait_minutes field is required').exists().isLength({ min: 1 }),
            check('is_online', 'The is_online field is required').exists().isLength({ min: 1 }),
            check('accurate_date_start', 'The accurate_date_start field is required').exists().isLength({ min: 1 }),
            check('accurate_time_start', 'The accurate_time_start field is required').exists().isLength({ min: 1 }),
            check('start_type', 'The start_type field is required').exists().isLength({ min: 1 }),

        ],
        function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            return res.status(422).json({
                errors: errors.mapped()
            });
        } else {
             //var newDateObj = moment(new Date()).add(req.body.wait_minutes, 'm').toDate();
           // var newDateObj = moment(req.body.accurate_date_start + " " + req.body.accurate_time_start + ":00", 'DD-MM-YYYYTHH:mm').toDate();

            var newDateObj;
            if (req.body.start_type === "interval") {
                newDateObj = moment(new Date()).add(req.body.wait_minutes, 'm').toDate();
            } else {
                newDateObj = moment(req.body.accurate_date_start + " " + req.body.accurate_time_start + ":00", 'DD-MM-YYYYTHH:mm').toDate();
            }


           // console.log("============")
            //console.log(req.body.wait_minutes)
            let office = {
                title: req.body.title.trim(),
                city: req.body.city.trim(),
                tours_count: req.body.tours_count.trim(),
                country: req.body.country,
                team_boards: req.body.team_boards,
                type: req.body.type,
                amount: req.body.amount,
                start_time: newDateObj,
                start_type: req.body.start_type,
                time_inc: req.body.time_inc,
                is_online: req.body.is_online,
                accurate_date_start: req.body.accurate_date_start,
                accurate_time_start: req.body.accurate_time_start,
                wait_minutes: req.body.wait_minutes,
                start_date: req.body.start_date,
                end_date: req.body.end_date,
                creator_id: req.session.passport.user.id,
                school_id: req.session.passport.user.school_id,
            };
           // moment(req.body.accurate_date_start)
           // console.log( moment(req.body.accurate_date_start + " " + req.body.accurate_time_start + ":00", 'DD-MM-YYYYTHH:mm').toDate());
          //  console.log(req.body.accurate_time_start);

            //res.json({
             //   status : "ok",
               // insertId : req.body.tournament_id
            //});

            pool.query('UPDATE tournaments SET ? ' +
                'WHERE ' +
                'tournaments.id = ?',
                [
                    office,
                    req.body.tournament_id,

                ]).then(function (results) {
                    res.json({
                        status : "ok",
                        insertId : req.body.tournament_id
                    });
            }).catch(function (err) {
                console.log(err);
            });
        }
    });
    

    router.post('/add_team', [
        isLoggedIn,
        // check('team_name', req.i18n.__("TeamNameIsEmpty")).exists().isLength({ min: 1 }),
        check('team_name').custom((value, { req }) => {

            return new Promise((resolve, reject) => {

                let user_type = req.body.team_name;

                if(!user_type) {
                    return reject(req.i18n.__("TeamNameIsEmpty"));
                } else {
                    return resolve();
                }


            });

        }),
        check('tournament_id', 'Вы не указали турнир.').exists().isLength({ min: 1 })
    ],
        function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                errors: errors.mapped()
            });
        } else {
            let office = {
                tournament_id: req.body.tournament_id,
                teacher_id: req.body.teacher_id,
                team_name: req.body.team_name,
            };

            pool.query('INSERT INTO tournaments_teams SET ?', office).then(function (results) {
                return pool.query("SELECT tt.id AS team_id,tt.team_name, tp.user_id, u.name,u.email FROM tournaments_teams AS tt LEFT JOIN tournaments_participants AS tp ON tp.team_id = tt.id LEFT JOIN users AS u ON tp.user_id = u.id WHERE tt.tournament_id = ? ORDER BY tt.id DESC, tp.team_board ASC", office.tournament_id)
            }).then(function (results) {
                var teams = makeTeams(results);
                res.json({
                    status : "ok",
                    teams : teams
                });

            }).catch(function (err) {
                console.log(err);
            });
        }
    });


    router.post('/add_participant', [
        isLoggedIn,
        check('tournament_id', 'The participant field is required.').exists().isLength({ min: 1 }).custom((value, { req }) => {

            return new Promise((resolve, reject) => {

                let user_type = req.body.user_type;
                const table = (user_type === "admins") ? "tournaments_admins" : "tournaments_participants";

                pool.query('SELECT * FROM ' + table + ' WHERE user_id = ? AND tournament_id = ?', [
                    req.body.user_id.trim(),
                    value
                ]).then(function (rows) {

                    if(rows.length !== 0) {
                        return reject(req.i18n.__("ParticipantsAlreadyInTournament"));
                    } else {
                        return resolve();
                    }
                })

            });

        }).custom((value, { req }) => {

            return new Promise((resolve, reject) => {

                let user_type = req.body.user_type;
                let tournament = [], players_count = 0;
                if (user_type != "admins") {
                    pool.query('SELECT * FROM tournaments WHERE id = ?', [
                        value
                    ]).then(function (rows) {
                        tournament = rows;
                        return pool.query("SELECT COUNT(*) as count FROM tournaments_participants WHERE team_id = ? AND tournament_id = ?", [req.body.team_id, value]);
                    }).then(function (rows) {
                        if(tournament.length > 0 && tournament[0].is_active) {
                            return reject(req.i18n.__("ParticipantsTournamentIsAlreadyOn"));
                        } else if (tournament[0].type > 10 && rows[0].count >= tournament[0].team_boards){
                            return reject(req.i18n.__("ParticipantsTooManyPlayersInTeam") + tournament[0].team_boards + req.i18n.__("ParticipantsOfBoards"));
                        } else {
                            if(tournament.length > 0 && tournament[0].type > 10 && (req.body.team_id == null || req.body.team_id.trim() == "")) {
                                return reject(req.i18n.__("ParticipantsChooseTeam"));
                            } else {
                                return resolve();
                            }
                        }
                    })
                } else {
                    return resolve();
                }
            });

        }),
        check('user_id', 'Choose the tournament. ').exists().isLength({ min: 1 }),
        check('user_type', 'Choose the type of user. ').exists().isLength({ min: 1 }),

    ],
        function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                errors: errors.mapped()
            });
        } else {
            let office = {
                tournament_id: req.body.tournament_id,
                user_id: req.body.user_id,
                start_rating: req.body.rating,
                team_id: (req.body.team_id) ? req.body.team_id : 0,
            };

            let user_type = req.body.user_type;


            const table = (user_type === "admins") ? "tournaments_admins" : "tournaments_participants";

            if (user_type === "admins") {
                delete office["start_rating"];
                delete office["team_id"];
            }


            pool.query('SELECT MAX(team_board) AS max_board FROM tournaments_participants WHERE tournament_id = ? AND team_id = ?', [office.tournament_id, office.team_id]).then(function (results) {
                var max_board = results[0].max_board;
                if (user_type !== "admins") {
                    office.team_board = (max_board == null) ? 0 : max_board + 1;
                }
                return pool.query('INSERT INTO ' + table + ' SET ?', office);
            }).then(function (results) {

                var sql = "SELECT users.* FROM " + table + " LEFT JOIN users ON users.id = " + table + ".user_id WHERE tournament_id = ? ORDER BY id DESC";

                if (req.body.tournament_type > 10 && user_type != "admins") {
                    sql = 'SELECT tt.id AS team_id,tt.team_name, tp.user_id, u.name,u.email FROM tournaments_teams AS tt LEFT JOIN tournaments_participants AS tp ON tp.team_id = tt.id LEFT JOIN users AS u ON tp.user_id = u.id WHERE tt.tournament_id = ? ORDER BY tt.id DESC, tp.team_board ASC';
                }

                return pool.query(sql, office.tournament_id)
            }).then(function (results) {
                //console.log(office);

                app.mongoDB.collection("cache").deleteMany({tournament_id: parseInt(office.tournament_id)}, function (err, mongoGame) {

                    app.ROOMS.emit('t' + office.tournament_id,
                        JSON.stringify({
                            action : "tournament_event"
                        }));
                });



                if (req.body.tournament_type > 10 && user_type != "admins") {
                    var teams = makeTeams(results);
                    res.json({
                        status : "ok",
                        teams : teams,
                    });
                } else {
                    res.json({
                        status : "ok",
                        participants : results,
                    });
                }


            }).catch(function (err) {
                console.log(err);
            });
        }
    });

    router.post('/remove_participant', [
        isLoggedIn,
        check('tournament_id', 'Вы не указали турнир.').exists().isLength({ min: 1 }).custom((value, { req }) => {

            return new Promise((resolve, reject) => {

                let user_type = req.body.user_type;

                if (user_type != "admins") {
                    pool.query('SELECT * FROM tournaments WHERE id = ?', [
                        value
                    ]).then(function (rows) {
                        if(rows.length > 0 && rows[0].is_active) {
                            return reject(req.i18n.__("ParticipantsTournamentIsAlreadyOn"));
                        } else {
                            return resolve();
                        }
                    })
                } else {
                    return resolve();
                }
            });
        }),
        check('user_id', 'Вы не указали участника. ').exists().isLength({ min: 1 }),

    ],
        function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                errors: errors.mapped()
            });
        } else {
            let office = {
                tournament_id: req.body.tournament_id,
                user_id: req.body.user_id,
            };

            let user_type = req.body.user_type;
            const table = (user_type === "admins") ? "tournaments_admins" : "tournaments_participants";

            pool.query('DELETE FROM ' + table + ' WHERE user_id = ? AND tournament_id = ?', [office.user_id, office.tournament_id])
                .then(function (results) {

                    var sql = "SELECT users.* FROM " + table + " LEFT JOIN users ON users.id = " + table + ".user_id WHERE tournament_id = ? ORDER BY id DESC";

                    if (req.body.tournament_type > 10) {
                        sql = 'SELECT tt.id AS team_id,tt.team_name, tp.user_id, u.name,u.email FROM tournaments_teams AS tt LEFT JOIN tournaments_participants AS tp ON tp.team_id = tt.id LEFT JOIN users AS u ON tp.user_id = u.id WHERE tt.tournament_id = ? ORDER BY tt.id DESC, tp.team_board ASC';
                    }

                    return pool.query(sql, office.tournament_id);
                }).then(function (results) {


                app.mongoDB.collection("cache").deleteMany({tournament_id: parseInt(office.tournament_id)}, function (err, mongoGame) {

                    app.ROOMS.emit('t' + office.tournament_id,
                        JSON.stringify({
                            action : "tournament_event"
                        }));

                });




                if (req.body.tournament_type > 10) {
                    var teams = makeTeams(results);
                    res.json({
                        status : "ok",
                        teams : teams,
                    });
                } else {
                    res.json({
                        status : "ok",
                        participants : results,
                    });
                }
            }).catch((err) => {
                console.log(err);
            });
        }
    });

    router.post('/remove_team', [
        isLoggedIn,
        check('tournament_id', 'Вы не указали турнир.').exists().isLength({ min: 1 }).custom((value, { req }) => {

            return new Promise((resolve, reject) => {

                let user_type = req.body.user_type;

                if (user_type != "admins") {
                    pool.query('SELECT * FROM tournaments WHERE id = ?', [
                        value
                    ]).then(function (rows) {
                        if(rows.length > 0 && rows[0].is_active) {
                            return reject(req.i18n.__("ParticipantsTournamentIsAlreadyOn"));
                        } else {
                            return resolve();
                        }
                    })
                } else {
                    return resolve();
                }
            });
        }),
        check('team_id', 'Вы не указали команду. ').exists().isLength({ min: 1 }),

    ],
        function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                errors: errors.mapped()
            });
        } else {
            let office = {
                tournament_id: req.body.tournament_id,
                team_id: req.body.team_id,
            };

            let user_type = req.body.user_type;

            pool.query('DELETE FROM tournaments_teams WHERE id = ? AND tournament_id = ?', [office.team_id, office.tournament_id])
                .then(function (results) {
                    return pool.query("DELETE FROM tournaments_participants WHERE team_id = ?", office.team_id);
                }).then(function (results) {
                    return pool.query("SELECT tt.id AS team_id,tt.team_name, tp.user_id, u.name,u.email FROM tournaments_teams AS tt LEFT JOIN tournaments_participants AS tp ON tp.team_id = tt.id LEFT JOIN users AS u ON tp.user_id = u.id WHERE tt.tournament_id = ? ORDER BY tt.id DESC, tp.team_board ASC", office.tournament_id);
                }).then(function (results) {
                var teams = makeTeams(results);
                res.json({
                    status : "ok",
                    teams : teams
                });
            }).catch((err) => {
                console.log(err);
            });
        }
    });

    router.post('/delete', [
        isLoggedIn,
        check('tournament_id', 'Вы не указали турнир.').exists().isLength({ min: 1 }).custom((value, { req }) => {

            return new Promise((resolve, reject) => {

                pool.query('SELECT * FROM tournaments WHERE id = ?', [
                    req.body.tournament_id.trim()
                ]).then(function (rows) {

                    if(rows.length > 0 && rows[0].is_online == 1 && rows[0].is_active == 1 && !rows[0].is_closed) {
                        return reject("Турнир не завершен. Завершите все матчи");
                    } else {
                        return resolve();
                    }
                });
            });
        }),

    ],
        function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                errors: errors.mapped()
            });

        } else {

            let office = {
                tournament_id: req.body.tournament_id,
                user_id: req.body.user_id,
            };

            let user_type = req.body.user_type;

            pool.query('DELETE FROM tournaments_scores WHERE tournament_id = ?', office.tournament_id)
                .then(function (results) {
                    return pool.query('DELETE FROM tournaments_results WHERE tournament_id = ?', office.tournament_id);
                }).then(function (results) {
                    return pool.query('DELETE FROM tournaments_teams_results WHERE tournament_id = ?', office.tournament_id);
                }).then(function (results) {
                    return pool.query('DELETE FROM tournaments_teams_scores WHERE tournament_id = ?', office.tournament_id);
                }).then(function (results) {
                var newDateObj = moment(new Date()).add(0.5, 'm').toDate();

                return pool.query('UPDATE tournaments SET ? WHERE tournaments.id = ?',[
                    {
                        current_tour : 0,
                        is_closed : 0,
                        is_active : 0,
                        is_canceled : 0,
                        start_time : newDateObj
                    }, office.tournament_id]);


            }).then(function (results) {
               // console.log(results);
                res.json({
                    "status": "ok",
                    "participants": results,
                });
            }).catch((err) => {
                console.log(err);
            });
        }
    });

    router.post('/bot_invasion', [
        isLoggedIn,
        check('tournament_id', 'Вы не указали турнир.').exists().isLength({ min: 1 }).custom((value, { req }) => {

            return new Promise((resolve, reject) => {

                pool.query('SELECT * FROM tournaments WHERE id = ?', [
                    req.body.tournament_id.trim()
                ]).then(function (rows) {

                    if(rows.length > 0 && rows[0].is_online == 1 && rows[0].is_active == 1 && !rows[0].is_closed) {
                        return reject("Турнир не завершен. Завершите все матчи");
                    } else {
                        return resolve();
                    }
                });
            });
        }),

    ],
        function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                errors: errors.mapped()
            });

        } else {



            let user_type = req.body.user_type;

        //    console.log("AA");


            let office = {
                tournament_id: req.body.tournament_id,
                user_id: req.body.user_id,
                start_rating: 1200,
                team_id: req.body.team_id,
            };


            let theme = {
                email: generateEmail(),
                password: 12,
                name: generateName(),
                rating: 1200,
                tournaments_rating: 1200,
            };

            var insertId, insert = [];

            for (var i = 0; i < 500; i++) {
                insert.push([
                    generateEmail(),
                    12,
                    generateName(),
                    1200,
                    1200,
                ]);
            }

          //  console.log(insert);

          //  for (var i = 0; i < insert.length; i++) {
                pool.query('INSERT INTO users (' +
                    'email, ' +
                    'password, name, rating,tournaments_rating) VALUES ?', [insert]).catch(function (err) {
                    console.log(err);
                }).then(function (rows) {
                    //console.log(arguments);
                    return pool.query('SELECT * FROM users WHERE id > ?', [rows.insertId]);
                }).then(function (rows) {
                    let participants = [];
                    for (var i = 0; i < rows.length; i++) {
                        //console.log(rows[i]);

                        participants.push([
                            rows[i].id,
                            req.body.tournament_id,
                            1,
                            1200,
                        ]);
                    }

                    return pool.query('INSERT INTO tournaments_participants (' +
                        'user_id, ' +
                        'tournament_id, is_active, start_rating) VALUES ?', [participants]);
                }).then(function (rows) {
                    app.mongoDB.collection("cache").deleteMany({tournament_id: parseInt(office.tournament_id)}, function (err, mongoGame) {

                        app.ROOMS.emit('t' + req.body.tournament_id,
                            JSON.stringify({
                                action : "tournament_event"
                            }));
                    });
                }).catch((err) => {
                    console.log(err);
                });;
            //}




            /*return pool.query('INSERT INTO tournaments_participants SET ?', office);


            }).then(function (results) {
                // console.log(results);
                res.json({
                    "status": "ok",
                });
            }).catch((err) => {
                console.log(err);
            });*/
        };

    });


    router.post('/delete_tournament', [
        isLoggedIn,
        check('tournament_id', 'Вы не указали турнир.').exists().isLength({ min: 1 }).custom((value, { req }) => {

            return new Promise((resolve, reject) => {

                pool.query('SELECT * FROM tournaments WHERE id = ?', [
                    req.body.tournament_id.trim()
                ]).then(function (rows) {
                    if(rows.length > 0 && rows[0].is_online == 1 && rows[0].is_closed == 0) {
                        return reject("Турнир не завершен. Завершите все матчи");
                    } else {
                        return resolve();
                    }
                });
            });
        }).custom((value, { req }) => {

            return new Promise((resolve, reject) => {

                pool.query('SELECT * FROM tournaments WHERE id = ?', [
                    req.body.tournament_id.trim()
                ]).then(function (rows) {

                    if(rows.length > 0 && rows[0].is_online == 1 && rows[0].is_active == 1 && !rows[0].is_closed) {
                        return reject("Турнир не завершен. Завершите все матчи");
                    } else {
                        return resolve();
                    }
                });
            });
        }),
    ],
        function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                errors: errors.mapped()
            });
        } else {
            let office = {
                tournament_id: req.body.tournament_id,
                user_id: req.body.user_id,
            };

            let user_type = req.body.user_type;

            pool.query('DELETE FROM tournaments_scores WHERE tournament_id = ?', office.tournament_id)
                .then(function (results) {
                    return pool.query('DELETE FROM tournaments_results WHERE tournament_id = ?', office.tournament_id);
                }).then(function (results) {
                    return pool.query('DELETE FROM tournaments_teams_results WHERE tournament_id = ?', office.tournament_id);
                }).then(function (results) {
                    return pool.query('DELETE FROM tournaments_teams_scores WHERE tournament_id = ?', office.tournament_id);
                }).then(function (results) {
                    return app.mongoDB.collection("users").deleteMany({tournament_id: parseInt(office.tournament_id)});
                }).then(function (results) {
                return pool.query('DELETE FROM tournaments WHERE id = ?', office.tournament_id);


            }).then(function (results) {
               // console.log(results);
                res.json({
                    "status": "ok",
                });
            }).catch((err) => {
                console.log(err);
            });
        }
    });



    router.post('/undo_last_tour', [
        isLoggedIn,
        check('tournament_id', 'id is required').exists().isLength({ min: 1 }).custom((value, { req }) => {

            return new Promise((resolve, reject) => {

                pool.query('SELECT * FROM tournaments WHERE id = ?', [
                    req.body.tournament_id.trim()
                ]).then(function (rows) {

                    if(rows.length > 0 && rows[0].is_online == 1 && rows[0].is_active == 1 && !rows[0].is_closed) {
                        return reject("Турнир не завершен. Завершите все матчи");
                    } else {
                        return resolve();
                    }
                });
            });
        }),

    ],
        function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                errors: errors.mapped()
            });
        } else {
            let office = {
                tournament_id: req.body.tournament_id,
                user_id: req.body.user_id,
            };

            let user_type = req.body.user_type;
            let current_tour = null;
            pool.query('SELECT current_tour FROM tournaments WHERE id = ? LIMIT 1', office.tournament_id)
                .then(function (results) {
                    try {
                        current_tour = results[0].current_tour;
                    }catch(e){
                        throw new Error("Can't find current tour");
                    }

                    return pool.query('DELETE FROM tournaments_results WHERE tournament_id = ? AND tour = ?', [office.tournament_id, current_tour]);
                }).then(function (results) {
                    return pool.query('DELETE FROM tournaments_results WHERE tournament_id = ? AND tour = ?', [office.tournament_id, current_tour]);
                }).then(function (results) {
                    return pool.query('DELETE FROM tournaments_teams_results WHERE tournament_id = ? AND tour = ?', [office.tournament_id, current_tour]);
                }).then(function (results) {
                    return pool.query('DELETE FROM tournaments_teams_scores WHERE tournament_id = ? AND tour = ?', [office.tournament_id, current_tour]);
                }).then(function (results) {
                return pool.query('UPDATE tournaments SET ? WHERE tournaments.id = ?',[
                    {
                        current_tour : current_tour - 1,
                        is_closed : 0,
                        is_active : 0,
                    }, office.tournament_id, current_tour]);


            }).then(function (results) {
               // console.log(results);
                res.json({
                    "status": "ok",
                    "participants": results,
                });
            }).catch((err) => {
                console.log(err);
            });
        }
    });





    router.post('/make_draw', [
        isLoggedIn,
        check('tournament_id', 'Вы не указали турнир.').exists().isLength({ min: 1 })
    ],
        function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                errors: errors.mapped()
            });
        } else {
            let tournament_id = req.body.tournament_id;
            tournament_id = parseInt(tournament_id);
                make_draw({
                    tournament_id : tournament_id,
                    pool : pool,
                    app : app,
                    req : req,
                    res : res,
                });


        }
    });


    router.post('/save_result', [isLoggedIn],
        function (req, res, next) {
        let tournament_id = req.body.tournament_id;
        let result = JSON.parse(req.body.result);
           // console.log(result);

        pool = bluebird.promisifyAll(pool);

        var respond = save_result({
            tournament_id : parseInt(tournament_id),
            result : result,
            pool : pool,
            app : app,
            req : req,
            res : res,
        });

        save_result_mongo({id:result.game_id}, null, app);


        if (!isNaN(tournament_id)) {
            respond.then(function (data) {
                return res.json(data);
            })
        } else {
            res.json({
                "status": "error",
                "msg": "tournament_id не определен",
            });
        }


    });


    router.post('/save_teams_result', [isLoggedIn],
        function (req, res, next) {
        let tournament_id = req.body.tournament_id;
        let result = JSON.parse(req.body.result);
        tournament_id = parseInt(tournament_id);

        if (!isNaN(tournament_id)) {

            let office = {
                team_1_won: result.p1_won,
                team_2_won: result.p2_won,
            };

            var tourney, participants, teams_points;

            pool
                .query('SELECT * FROM tournaments WHERE id = ?', tournament_id)
                .then(rows => {
                    tourney = rows[0];

                    var team_1, team_2;


                    var request_string1 = "= ?";
                    var request_string2 = "= ?";

                   /* console.log([
                        office,
                        tourney.id,
                        tourney.current_tour,
                        result.p1_id,
                        result.p2_id,

                    ]);
*/
                    return pool.query('UPDATE tournaments_teams_results SET ? ' +
                        'WHERE ' +
                        'tournaments_teams_results.tournament_id = ? AND tour = ? AND team_1_id ' + request_string1 + ' AND team_2_id ' + request_string2,
                        [
                            office,
                            tourney.id,
                            tourney.current_tour,
                            result.p1_id,
                            result.p2_id,

                        ]);
                })
               .then(function (results) {

                res.json({
                    status : "ok",
                    tourney_id : req.body.tournament_id,
                    rating_change_p1 : office["rating_change_p1"],
                    rating_change_p2 : office["rating_change_p2"],
                    teams_points : (typeof teams_points != "undefined") ? teams_points.teams : null,
                });

            }).catch(function (err) {
                console.log(err);
            });
        } else {
            res.json({
                "status": "error",
                "msg": "tournament_id не определен",
            });
        }
    });

    router.post('/get_users', [isLoggedIn],
        function (req, res, next) {
        let tournament_id = req.body.tournament_id;
        let user_type = req.body.user_type;
        tournament_id = parseInt(tournament_id);
        if (!isNaN(tournament_id)) {

            let office = {
                tournament_id: req.body.tournament_id,
            };

            const table = (user_type === "admins") ? "tournaments_admins" : "tournaments_participants";

            pool.query("SELECT users.* FROM " + table + " LEFT JOIN users ON users.id = " + table + ".user_id WHERE tournament_id = ? ORDER BY id DESC", office.tournament_id)
               .then(results => {
                   res.json({
                       "status": "ok",
                       "participants": results,
                   });
            }).catch(function (err) {
                console.log(err);
            });
        } else {
            res.json({
                "status": "error",
                "msg": "tournament_id не определен",
            });
        }
    });

    router.post('/delete_participant', [isLoggedIn],
        function (req, res, next) {
        let tournament_id = req.body.tournament_id;
        let user_id = req.body.user_id;
        tournament_id = parseInt(tournament_id);
        user_id = parseInt(user_id);
        if (!isNaN(tournament_id) && !isNaN(user_id)) {

            let office = {
                is_active: 0,
            };

            return pool.query('UPDATE tournaments_participants SET ? ' +
                'WHERE ' +
                'tournaments_participants.tournament_id = ? AND user_id = ?',
                [
                    office,
                    tournament_id,
                    user_id,
                ])
               .then(results => {
                   res.json({
                       "status": "ok"
                   });
            }).catch(function (err) {
                console.log(err);
            });
        } else {
            res.json({
                "status": "error",
                "msg": "tournament_id не определен",
            });
        }
    });

    router.get('/:tournament_id',
        function (req, res, next) {
        let tournament_id = req.params.tournament_id;
        tournament_id = parseInt(tournament_id);
        var tourney, participants, is_in = false;
        if (!isNaN(tournament_id)) {
            pool
                .query('SELECT tournaments.*, users.name FROM tournaments LEFT JOIN users ON users.id = tournaments.creator_id WHERE tournaments.id = ?', tournament_id)


               .then(rows => {
                   //participants = rows;
                   tourney = rows[0];

                   if (rows.length) {
                       const timeleft = (tourney.start_time) ? tourney.start_time.getTime() - new Date().getTime() : 0;

                       if (tourney.type > 10) {
                           DRAW.teamSwiss(req, res, next, pool, tourney, tournament_id, tourney.current_tour).then(function(swiss) {
                               console.log(swiss.pairs);
                               res.render('tournament/show', {
                                   tournament: tourney,
                                   tournamentJSON  : JSON.stringify(tourney),

                                   tour_id: tourney.current_tour,
                                   pairs: JSON.stringify(swiss.pairs),
                                   timeleft : timeleft,
                                   team_tour_points: JSON.stringify(swiss.team_tour_points),
                                   participants_boards: JSON.stringify(swiss.participants_boards),
                                   participants_array: JSON.stringify(swiss.participants_array),
                                   teams_scores: JSON.stringify(swiss.teams_scores),
                                   results_table: JSON.stringify(swiss.results_table),
                                   tournaments_teams: JSON.stringify(swiss.tournaments_teams)
                               });
                           }).catch(function(e) {
                               console.log(e);
                           });
                       } else {
                           DRAW.defaultSwiss(req, res, next, pool, tourney, tournament_id, tourney.current_tour, app).then(function(swiss) {

                               tourney.start_date = moment(tourney.start_date).format("DD-MM-YYYY");
                               tourney.end_date = moment(tourney.end_date).format("DD-MM-YYYY");
                               tourney.created_at = moment(tourney.created_at).format("DD-MM-YYYY");

                               if (req.isAuthenticated()) {
                                   for (var i = 0; i < swiss.participants.length; i++) {
                                       var obj = swiss.participants[i];
                                       if (req.session.passport.user.id == obj.user_id) {
                                           is_in = true;
                                           break;
                                       }
                                   }
                               }
                               //console.log(swiss.participants);
                               return res.render('tournament/show', {
                                   tournament  : tourney,
                                   pairing  : JSON.stringify(swiss.pairing),
                                   tournamentJSON  : JSON.stringify(tourney),
                                   participants : swiss.participants,
                                   timeleft : timeleft,
                                   is_in : is_in,
                                   participantsJSON : JSON.stringify(swiss.participants),
                                   tour_id : tourney.current_tour,
                               });
                           }).catch(function(e) {
                               console.log(e);
                           });
                       }




                   } else {
                       res.render('error', {
                           message  : req.i18n.__("TourneyNotFound"),
                           error  : req.i18n.__("TourneyNotFound"),
                       });
                   }



             /*      if (req.isAuthenticated()) {
                       for (var i = 0; i < participants.length; i++) {
                           var obj = participants[i];
                           if (req.session.passport.user.id == obj.id){
                               is_in = true;
                               break;
                           }
                       }
                   }*/
                  //  console.log(is_in);

            //}).then(rows => {

            /*    if (tourney.length > 0) {
                    tourney[0].start_date = moment(tourney[0].start_date).format("DD-MM-YYYY");
                    tourney[0].end_date = moment(tourney[0].end_date).format("DD-MM-YYYY");
                    tourney[0].created_at = moment(tourney[0].created_at).format("DD-MM-YYYY");
                   // console.log(tourney[0].start_time);
                  //  console.log(new Date());
                    let timeleft = (tourney[0].start_time) ? tourney[0].start_time.getTime() - new Date().getTime() : 0;
                    res.render('tournament/show', {
                        tournament  : tourney[0],
                        tournamentJSON  : JSON.stringify(tourney[0]),
                        countries : countries,
                        timeleft : timeleft,
                        is_in : is_in,
                        participants : JSON.stringify(participants)

                    });*/
                /*} else {
                    res.render('error', {
                        message  : req.i18n.__("TourneyNotFound"),
                        error  : req.i18n.__("TourneyNotFound"),
                    });
                }*/



            }).catch(function (err) {
                console.log(err);
            });
        } else {
            res.render('error', {
                message  : "Турнир не найден",
            });
        }
    });






    router.get('/:tournament_id/get_info',
        function (req, res, next) {



            let tournament_id = req.params.tournament_id;
            tournament_id = parseInt(tournament_id);
            if (!isNaN(tournament_id)) {

                return pool
                    .query('SELECT * FROM tournaments WHERE id = ?', tournament_id)
                    .then(rows => {
                        const tournament = rows[0];
                        let participants, pairing = [], arrr = [], scores_object = {}, current_games = {}, mongoinsert = {};
                        let tour_id = tournament.current_tour;


                        app.mongoDB.collection("cache").findOne({tournament_id : parseInt(tournament.id), tour : parseInt(tournament.current_tour)}, function (err, mongoTournament) {
                          //  if (!mongoTournament) {
                            if (true) {
                                DRAW.defaultSwiss(req, res, next, pool, tournament, tournament_id, tour_id, app).then(function(swiss) {


                                    mongoinsert.participants = swiss.participants;
                                    mongoinsert.pairing = swiss.pairing;
                                    mongoinsert.tournament_id = tournament.id;
                                    mongoinsert.tour = tournament.current_tour;

                                    return app.mongoDB.collection("cache").insertOne({

                                        "participants": mongoinsert.participants,
                                        "scores_object": mongoinsert.scores_object,
                                        "pairing": mongoinsert.pairing,
                                        "tour": parseInt(tournament.current_tour),
                                        "tournament_id": parseInt(tournament.id),
                                    }, function () {
                                        return res.json({
                                            tournament  : tournament,
                                            pairing  : JSON.stringify(mongoinsert.pairing),
                                            participants : mongoinsert.participants,
                                            tour_id : tour_id,
                                        });
                                    });

                                }).catch(function(e) {
                                    console.log(e);
                                });


                               /* console.log(swiss);
                                mongoinsert.participants = swiss.participants;
                                mongoinsert.scores_object = swiss.scores_object;
                                mongoinsert.tournament_id = tournament.id;
                                mongoinsert.tour = tournament.current_tour;


                                app.mongoDB.collection("cache").insertOne({

                                            "participants": mongoinsert.participants,
                                            "scores_object": mongoinsert.scores_object,
                                            "pairing": mongoinsert.pairing,
                                            "tour": parseInt(tournament.current_tour),
                                            "tournament_id": parseInt(tournament.id),
                                        }, function () {
                                                res.json({
                                                    tournament  : tournament,
                                                    pairing  : JSON.stringify(pairing),
                                                    participants : participants,
                                                    tour_id : tour_id,
                                                    scores_object :  JSON.stringify(scores_object),
                                                });
                                });*/

                            } else {
                                res.json({
                                    tournament  : tournament,
                                    pairing  : JSON.stringify(mongoTournament.pairing),
                                    participants : mongoTournament.participants,
                                    tour_id : tour_id,
                                    scores_object :  JSON.stringify(mongoTournament.scores_object),
                                    arrr : arrr,
                                });
                                console.log("ВЗЯТО ИЗ КЕША");
                            }
                        });




                    });

            } else {

                res.json({
                    status  : "error",
                    msg  : req.i18n.__("TourneyNotFound")
                });
            }
        });


    router.get('/:tournament_id/tour/:tour_id',
        function (req, res, next) {


        let tournament_id = req.params.tournament_id;
        let tour_id = req.params.tour_id;
        tournament_id = parseInt(tournament_id);
        tour_id = parseInt(tour_id);
        if (!isNaN(tournament_id) && !isNaN(tour_id)) {

            pool
                .query('SELECT * FROM tournaments WHERE id = ?', tournament_id)
                .then(rows => {
                    const tournament = rows[0];
                    if (typeof tournament != "undefined") {

                        //если турнир командный
                        if (tournament.type > 10) {
                            DRAW.teamSwiss(req, res, next, pool, tournament, tournament_id, tour_id).then(function(swiss) {
                                console.log(swiss.pairs);
                                res.render('tournament/teams/pairing', {
                                    tournament: tournament,
                                    tour_id: tour_id,
                                    pairs: JSON.stringify(swiss.pairs),
                                    team_tour_points: JSON.stringify(swiss.team_tour_points),
                                    teams_scores: JSON.stringify(swiss.teams_scores),
                                    tournaments_teams: JSON.stringify(swiss.tournaments_teams)
                                });
                            }).catch(function(e) {
                                console.log(e);
                            });

                        //если турнир индивидуальный
                        } else if (tournament.type < 10){
                            DRAW.defaultSwiss(req, res, next, pool, tournament, tournament_id, tour_id, app).then(function(swiss) {
                                return res.render('tournament/pairing', {
                                    tournament  : tournament,
                                    pairing  : JSON.stringify(swiss.pairing),
                                    tournamentJSON  : JSON.stringify(tournament),
                                    participants : swiss.participants,
                                    participantsJSON : JSON.stringify(swiss.participants),
                                    tour_id : tour_id,
                                });
                            }).catch(function(e) {
                                console.log(e);
                            });
                        }




                    } else {
                        res.render('error', {
                            message  : req.i18n.__("TourneyNotFound"),
                        });
                    }

                }).catch(function (error) {
                    console.log(error);
                });

        } else {
            res.render('error', {
                message  : req.i18n.__("TourneyNotFound"),
            });
        }
    });

    router.post('/get_pairs',
        function (req, res, next) {
        let tournament_id = req.body.tournament_id;
        let user_id = req.body.user_id;
      //  console.log(tournament_id);
       // console.log(user_id);
        tournament_id = parseInt(tournament_id);
        user_id = parseInt(user_id);
        let tournament, participants, pairing = [], arrr = [];

        if (!isNaN(tournament_id) && !isNaN(user_id)) {
            pool
                .query('SELECT * FROM tournaments WHERE id = ?', tournament_id)
                .then(rows => {
                    tournament = rows[0];
                    return pool
                        .query('SELECT tr.*, u1.name AS p1_name,u1.tournaments_rating AS p1_rating, u2.name AS p2_name, u2.tournaments_rating AS p2_rating FROM tournaments_results tr LEFT JOIN users u1 ON tr.p1_id = u1.id LEFT JOIN  users u2 ON tr.p2_id = u2.id WHERE tr.tournament_id = ? AND (tr.p2_id = ? OR tr.p1_id = ?)', [tournament_id, user_id, user_id])
                }).then(rows => {
                pairing = rows;


                res.json({
                    status : "ok",
                    tournament  : tournament,
                    pairing  : pairing,
                });
            }).catch(function (err) {
                console.log(err);
            });
        } else {
            res.json({
                status : "error"
            });
        }
    });

    router.get('/:tournament_id/final',
        function (req, res, next) {
        let tournament_id = req.params.tournament_id;
        tournament_id = parseInt(tournament_id);
        let tournament, participants, participants_object = {}, pairing = [], arrr = [], teams = null, participants_boards = {};
        if (!isNaN(tournament_id)) {
            pool
                .query('SELECT * FROM tournaments WHERE id = ?', tournament_id)
               .then(rows => {
                   tournament = rows[0];

                   if (typeof tournament != "undefined") {
                       DRAW.defaultSwiss(req, res, next, pool, tournament, tournament_id, tournament.current_tour, app).then(function(swiss) {
                           return res.render('tournament/final', {
                               tournament  : tournament,
                               participants : swiss.participants,
                               teams : null,
                               titles : TITLES
                           });
                       }).catch(function(e) {
                           console.log(e);
                       });

                   } else {
                       res.render('error', {
                           message  : req.i18n.__("TourneyNotFound"),
                       });
                   }

            }).catch(function (err) {
                console.log(err);
            });
        } else {
            res.render('error', {
                message  : req.i18n.__("TourneyNotFound"),
            });
        }
    });


    router.get('/:tournament_id/edit', [
        isLoggedIn,
        check('tournament_id', 'Вы не указали турнир.').exists().isLength({ min: 1 }).custom((value, { req }) => {
            //console.log("===");
            //console.log(value);
            return new Promise((resolve, reject) => {

                pool.query('SELECT * FROM tournaments WHERE id = ?', [
                    value.trim()
                ]).then(function (rows) {
                    if(rows.length > 0 && rows[0].creator_id != req.session.passport.user.id) {
                        return reject("У вас нет прав редактировать турнир");
                    } else {
                        return resolve();
                    }
                });
            });
        })
        ],
        function (req, res, next) {
        let tournament_id = req.params.tournament_id;
        tournament_id = parseInt(tournament_id);
            const errors = validationResult(req);

            if (!errors.isEmpty()) {

                var error = "";
                for (var obj in errors.mapped()) {
                    error = errors.mapped()[obj].msg;
                }

               // console.log(errors.mapped());



                res.render('error', {
                    message  : error
                });
                /*return res.status(422).json({
                    errors: errors.mapped()
                });*/
            } else {




                    if (!isNaN(tournament_id)) {
                        pool
                            .query('SELECT * FROM tournaments WHERE id = ?', tournament_id)
                           .then(rows => {

                               if (rows.length > 0) {
                                   rows[0].start_date = moment(rows[0].start_date).format("YYYY-MM-DD");
                                   rows[0].end_date = moment(rows[0].end_date).format("YYYY-MM-DD");
                                   // 2018-05-31
                                   //console.log(rows[0]);
                                   res.render('tournament/edit', {
                                       tournament  : rows[0],
                                       tournamentJSON  : JSON.stringify(rows[0]),

                                       countries : countries
                                   });
                               } else {
                                   res.render('error', {
                                       message  : req.i18n.__("TourneyNotFound"),
                                       error  : req.i18n.__("TourneyNotFound"),
                                   });
                               }


                        }).catch(function (err) {
                            console.log(err);
                        });
                    } else {
                        res.render('error', {
                            message  : req.i18n.__("TourneyNotFound"),
                        });
                    }

            }
    });



    router.get('/:tournament_id/pairing', [isLoggedIn],
        function (req, res, next) {
        let tournament_id = req.params.tournament_id;
        tournament_id = parseInt(tournament_id);
        let tournament, participants, pairing = [], arrr = [];
        if (!isNaN(tournament_id)) {
            pool
                .query('SELECT * FROM tournaments WHERE id = ?', tournament_id)
                .then(rows => {
                    tournament = rows[0];
                    return pool
                        .query('SELECT tr.*, u1.name AS p1_name,u1.rating AS p1_rating, u2.name AS p2_name, u2.rating AS p2_rating FROM tournaments_results tr LEFT JOIN users u1 ON tr.p1_id = u1.id LEFT JOIN  users u2 ON tr.p2_id = u2.id WHERE tr.tournament_id = ? AND tr.tour = ?', [tournament_id, tournament.current_tour])
                }).then(rows => {
                    pairing = rows;

                for (var i = 0; i < rows.length; i++) {
                    var obj = rows[i];
                    var p1_name = obj["p1_name"];
                    var p2_name = obj["p2_name"];
                    arrr.push(
                        {
                            scores: obj["p1_scores"],
                            name: obj["p1_name"],
                        },
                        {
                            scores: obj["p2_scores"],
                            name: obj["p2_name"],
                        },
                     );
                }
                arrr.sort(sortByScores);

                function sortByScores(a,b) {
                    return a.scores < b.scores;
                }

                }).then(rows => {
                    return pool
                        .query('SELECT tp.user_id, ts.scores, u.name FROM tournaments_participants tp LEFT JOIN tournaments_scores ts ON ts.user_id = tp.user_id LEFT JOIN users u ON u.id = tp.user_id  WHERE tp.tournament_id = ?', tournament_id)
                }).then(rows => {

                    var a = [];

                    var scores_object = {};
                for (var i = 0; i < rows.length; i++) {
                    var obj = rows[i];

                    scores_object[obj.user_id] = obj.scores;


                    a.push({
                        user_id: obj.user_id,
                        scores: obj.scores,
                        name: obj.name
                    });
                }

                   // participants = rows;
                    participants = DRAW.sortArr(a);

                    //console.log(tournament);

                    res.render('tournament/pairing', {
                        tournament  : tournament,
                        pairing  : JSON.stringify(pairing),
                        tournamentJSON  : JSON.stringify(tournament),
                        participants : participants,
                        scores_object :  JSON.stringify(scores_object),
                        arrr : arrr,
                    });
                }).catch(function (err) {
                    console.log(err);
                });
        } else {
            res.render('error', {
                message  : req.i18n.__("TourneyNotFound"),
            });
        }
    });


    function makeTeams(participants) {
        var teams = {};
        for (var i = 0; i < participants.length; i++) {
            var obj = participants[i];

            teams[obj.team_id] = teams[obj.team_id] || {};
            teams[obj.team_id].team_id = obj.team_id;
            teams[obj.team_id].users = teams[obj.team_id].users || [];

            var user = {
                user_id : obj.user_id,
                name : obj.name,
                email : obj.email,
                team_board : obj.team_board,
            };
            teams[obj.team_id].name = obj.team_name;

            if (user.user_id) {
                teams[obj.team_id].users.push(user);
            }
        }
        return teams;
    }


    router.get('/:tournament_id/participants',[isLoggedIn],
        function (req, res, next) {
        let tournament_id = req.params.tournament_id;
        tournament_id = parseInt(tournament_id);

        let tourney, participant, all_students, participants, teachers, teams = {};
        if (!isNaN(tournament_id)) {
            pool
                .query('SELECT * FROM tournaments WHERE id = ?', tournament_id)
                .then(rows => {

                    if (rows.length > 0) {
                        tourney = rows[0];
                         pool
                                  .query('SELECT id,name,email,role,tournaments_rating FROM users where school_id = ?', req.session.passport.user.id)
                            .then(rows => {
                                all_students = rows;

                                var sql = 'SELECT users.id,users.name,users.email,users.role,users.tournaments_rating FROM tournaments_participants LEFT JOIN users ON users.id = tournaments_participants.user_id WHERE tournaments_participants.tournament_id = ?  ORDER BY id DESC';

                                if (tourney.type > 10) {
                                    sql = 'SELECT tt.id AS team_id,tt.team_name, tp.user_id,tp.team_board, u.name,u.email FROM tournaments_teams AS tt LEFT JOIN tournaments_participants AS tp ON tp.team_id = tt.id LEFT JOIN users AS u ON tp.user_id = u.id WHERE tt.tournament_id = ? ORDER BY tt.id DESC, tp.team_board ASC';
                                }
                                return pool.query(sql, tournament_id)
                            }).then(rows => {
                                participants = rows;
                             if (tourney.type > 10) {
                                 teams = makeTeams(participants);
                             }
                                return pool.query('SELECT id,name,email,role,tournaments_rating FROM users WHERE role > 99 AND school_id = ?', req.session.passport.user.school_id)
                            }).then(rows => {
                                teachers = rows;

                                console.log(participants);

                                res.render('tournament/participants', {
                                    tournament  : tourney,
                                    tournamentJSON  : JSON.stringify(tourney),
                                    participants  :  JSON.stringify(participants),
                                    teachers: JSON.stringify(teachers),
                                    teams: JSON.stringify(teams),
                                    all_students : JSON.stringify(all_students)
                                });
                            }).catch(function (err) {
                            console.log(err);
                        });
                    } else {
                        res.render('error', {
                            message  : req.i18n.__("TourneyNotFound"),
                            error  : req.i18n.__("TourneyNotFound"),
                        });
                    }


                }).catch(function (err) {
                console.log(err);
            });
        } else {
            res.render('error', {
                message  : req.i18n.__("TourneyNotFound"),
            });
        }

    });

    router.post('/set_order',[
        isLoggedIn,
        check('team_id', 'Вы не указали имя команды. ').exists().isLength({ min: 1 }),
        check('order', 'Вы не указали порядок в команде. ').exists().isLength({ min: 1 }),
        check('tournament_id', 'Вы не указали участника.').exists().isLength({ min: 1 })

    ],
        function (req, res, next) {
        let tournament_id = req.body.tournament_id;
        let team_id = req.body.team_id;
        let order = JSON.parse(req.body.order);

        tournament_id = parseInt(tournament_id);

        if (!isNaN(tournament_id)) {

            /*res.json({
                status : "ok",
                insertId : req.body.tournament_id
            });*/

            var test = "";
            for (var obj in order) {
                test+= " WHEN " + obj + " THEN " + order[obj];
            }

            pool
                .query('UPDATE tournaments_participants SET team_board = CASE user_id ' + test + '  END WHERE user_id IN ?', [[Object.keys(order)]])
                .then(rows => {
                        var sql = 'SELECT tt.id AS team_id,tt.team_name, tp.user_id,tp.team_board, u.name,u.email FROM tournaments_teams AS tt LEFT JOIN tournaments_participants AS tp ON tp.team_id = tt.id LEFT JOIN users AS u ON tp.user_id = u.id WHERE tt.tournament_id = ? ORDER BY tt.id DESC, tp.team_board ASC';

                    return pool.query(sql, tournament_id)
                }).then(rows => {
                    var teams = makeTeams(rows);

                    res.json({
                        status : "ok",
                        teams : teams
                    });
                }).catch(function (err) {
                console.log(err);
            });
        } else {
            res.json({
                status : "error",
                msg  : req.i18n.__("TourneyNotFound"),
            });
        }

    });


    return router;


}



function generateEmail() {
    var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal + "@chesstask.com";
}


function capFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function generateName(){
    var name1 = ["abandoned","able","absolute","adorable","adventurous","academic","acceptable","acclaimed","accomplished","accurate","aching","acidic","acrobatic","active","actual","adept","admirable","admired","adolescent","adorable","adored","advanced","afraid","affectionate","aged","aggravating","aggressive","agile","agitated","agonizing","agreeable","ajar","alarmed","alarming","alert","alienated","alive","all","altruistic","amazing","ambitious","ample","amused","amusing","anchored","ancient","angelic","angry","anguished","animated","annual","another","antique","anxious","any","apprehensive","appropriate","apt","arctic","arid","aromatic","artistic","ashamed","assured","astonishing","athletic","attached","attentive","attractive","austere","authentic","authorized","automatic","avaricious","average","aware","awesome","awful","awkward","babyish","bad","back","baggy","bare","barren","basic","beautiful","belated","beloved","beneficial","better","best","bewitched","big","big-hearted","biodegradable","bite-sized","bitter","black","black-and-white","bland","blank","blaring","bleak","blind","blissful","blond","blue","blushing","bogus","boiling","bold","bony","boring","bossy","both","bouncy","bountiful","bowed","brave","breakable","brief","bright","brilliant","brisk","broken","bronze","brown","bruised","bubbly","bulky","bumpy","buoyant","burdensome","burly","bustling","busy","buttery","buzzing","calculating","calm","candid","canine","capital","carefree","careful","careless","caring","cautious","cavernous","celebrated","charming","cheap","cheerful","cheery","chief","chilly","chubby","circular","classic","clean","clear","clear-cut","clever","close","closed","cloudy","clueless","clumsy","cluttered","coarse","cold","colorful","colorless","colossal","comfortable","common","compassionate","competent","complete","complex","complicated","composed","concerned","concrete","confused","conscious","considerate","constant","content","conventional","cooked","cool","cooperative","coordinated","corny","corrupt","costly","courageous","courteous","crafty","crazy","creamy","creative","creepy","criminal","crisp","critical","crooked","crowded","cruel","crushing","cuddly","cultivated","cultured","cumbersome","curly","curvy","cute","cylindrical","damaged","damp","dangerous","dapper","daring","darling","dark","dazzling","dead","deadly","deafening","dear","dearest","decent","decimal","decisive","deep","defenseless","defensive","defiant","deficient","definite","definitive","delayed","delectable","delicious","delightful","delirious","demanding","dense","dental","dependable","dependent","descriptive","deserted","detailed","determined","devoted","different","difficult","digital","diligent","dim","dimpled","dimwitted","direct","disastrous","discrete","disfigured","disgusting","disloyal","dismal","distant","downright","dreary","dirty","disguised","dishonest","dismal","distant","distinct","distorted","dizzy","dopey","doting","double","downright","drab","drafty","dramatic","dreary","droopy","dry","dual","dull","dutiful","each","eager","earnest","early","easy","easy-going","ecstatic","edible","educated","elaborate","elastic","elated","elderly","electric","elegant","elementary","elliptical","embarrassed","embellished","eminent","emotional","empty","enchanted","enchanting","energetic","enlightened","enormous","enraged","entire","envious","equal","equatorial","essential","esteemed","ethical","euphoric","even","evergreen","everlasting","every","evil","exalted","excellent","exemplary","exhausted","excitable","excited","exciting","exotic","expensive","experienced","expert","extraneous","extroverted","extra-large","extra-small","fabulous","failing","faint","fair","faithful","fake","false","familiar","famous","fancy","fantastic","far","faraway","far-flung","far-off","fast","fat","fatal","fatherly","favorable","favorite","fearful","fearless","feisty","feline","female","feminine","few","fickle","filthy","fine","finished","firm","first","firsthand","fitting","fixed","flaky","flamboyant","flashy","flat","flawed","flawless","flickering","flimsy","flippant","flowery","fluffy","fluid","flustered","focused","fond","foolhardy","foolish","forceful","forked","formal","forsaken","forthright","fortunate","fragrant","frail","frank","frayed","free","French","fresh","frequent","friendly","frightened","frightening","frigid","frilly","frizzy","frivolous","front","frosty","frozen","frugal","fruitful","full","fumbling","functional","funny","fussy","fuzzy","gargantuan","gaseous","general","generous","gentle","genuine","giant","giddy","gigantic","gifted","giving","glamorous","glaring","glass","gleaming","gleeful","glistening","glittering","gloomy","glorious","glossy","glum","golden","good","good-natured","gorgeous","graceful","gracious","grand","grandiose","granular","grateful","grave","gray","great","greedy","green","gregarious","grim","grimy","gripping","grizzled","gross","grotesque","grouchy","grounded","growing","growling","grown","grubby","gruesome","grumpy","guilty","gullible","gummy","hairy","half","handmade","handsome","handy","happy","happy-go-lucky","hard","hard-to-find","harmful","harmless","harmonious","harsh","hasty","hateful","haunting","healthy","heartfelt","hearty","heavenly","heavy","hefty","helpful","helpless","hidden","hideous","high","high-level","hilarious","hoarse","hollow","homely","honest","honorable","honored","hopeful","horrible","hospitable","hot","huge","humble","humiliating","humming","humongous","hungry","hurtful","husky","icky","icy","ideal","idealistic","identical","idle","idiotic","idolized","ignorant","ill","illegal","ill-fated","ill-informed","illiterate","illustrious","imaginary","imaginative","immaculate","immaterial","immediate","immense","impassioned","impeccable","impartial","imperfect","imperturbable","impish","impolite","important","impossible","impractical","impressionable","impressive","improbable","impure","inborn","incomparable","incompatible","incomplete","inconsequential","incredible","indelible","inexperienced","indolent","infamous","infantile","infatuated","inferior","infinite","informal","innocent","insecure","insidious","insignificant","insistent","instructive","insubstantial","intelligent","intent","intentional","interesting","internal","international","intrepid","ironclad","irresponsible","irritating","itchy","jaded","jagged","jam-packed","jaunty","jealous","jittery","joint","jolly","jovial","joyful","joyous","jubilant","judicious","juicy","jumbo","junior","jumpy","juvenile","kaleidoscopic","keen","key","kind","kindhearted","kindly","klutzy","knobby","knotty","knowledgeable","knowing","known","kooky","kosher","lame","lanky","large","last","lasting","late","lavish","lawful","lazy","leading","lean","leafy","left","legal","legitimate","light","lighthearted","likable","likely","limited","limp","limping","linear","lined","liquid","little","live","lively","livid","loathsome","lone","lonely","long","long-term","loose","lopsided","lost","loud","lovable","lovely","loving","low","loyal","lucky","lumbering","luminous","lumpy","lustrous","luxurious","mad","made-up","magnificent","majestic","major","male","mammoth","married","marvelous","masculine","massive","mature","meager","mealy","mean","measly","meaty","medical","mediocre","medium","meek","mellow","melodic","memorable","menacing","merry","messy","metallic","mild","milky","mindless","miniature","minor","minty","miserable","miserly","misguided","misty","mixed","modern","modest","moist","monstrous","monthly","monumental","moral","mortified","motherly","motionless","mountainous","muddy","muffled","multicolored","mundane","murky","mushy","musty","muted","mysterious","naive","narrow","nasty","natural","naughty","nautical","near","neat","necessary","needy","negative","neglected","negligible","neighboring","nervous","new","next","nice","nifty","nimble","nippy","nocturnal","noisy","nonstop","normal","notable","noted","noteworthy","novel","noxious","numb","nutritious","nutty","obedient","obese","oblong","oily","oblong","obvious","occasional","odd","oddball","offbeat","offensive","official","old","old-fashioned","only","open","optimal","optimistic","opulent","orange","orderly","organic","ornate","ornery","ordinary","original","other","our","outlying","outgoing","outlandish","outrageous","outstanding","oval","overcooked","overdue","overjoyed","overlooked","palatable","pale","paltry","parallel","parched","partial","passionate","past","pastel","peaceful","peppery","perfect","perfumed","periodic","perky","personal","pertinent","pesky","pessimistic","petty","phony","physical","piercing","pink","pitiful","plain","plaintive","plastic","playful","pleasant","pleased","pleasing","plump","plush","polished","polite","political","pointed","pointless","poised","poor","popular","portly","posh","positive","possible","potable","powerful","powerless","practical","precious","present","prestigious","pretty","precious","previous","pricey","prickly","primary","prime","pristine","private","prize","probable","productive","profitable","profuse","proper","proud","prudent","punctual","pungent","puny","pure","purple","pushy","putrid","puzzled","puzzling","quaint","qualified","quarrelsome","quarterly","queasy","querulous","questionable","quick","quick-witted","quiet","quintessential","quirky","quixotic","quizzical","radiant","ragged","rapid","rare","rash","raw","recent","reckless","rectangular","ready","real","realistic","reasonable","red","reflecting","regal","regular","reliable","relieved","remarkable","remorseful","remote","repentant","required","respectful","responsible","repulsive","revolving","rewarding","rich","rigid","right","ringed","ripe","roasted","robust","rosy","rotating","rotten","rough","round","rowdy","royal","rubbery","rundown","ruddy","rude","runny","rural","rusty","sad","safe","salty","same","sandy","sane","sarcastic","sardonic","satisfied","scaly","scarce","scared","scary","scented","scholarly","scientific","scornful","scratchy","scrawny","second","secondary","second-hand","secret","self-assured","self-reliant","selfish","sentimental","separate","serene","serious","serpentine","several","severe","shabby","shadowy","shady","shallow","shameful","shameless","sharp","shimmering","shiny","shocked","shocking","shoddy","short","short-term","showy","shrill","shy","sick","silent","silky","silly","silver","similar","simple","simplistic","sinful","single","sizzling","skeletal","skinny","sleepy","slight","slim","slimy","slippery","slow","slushy","small","smart","smoggy","smooth","smug","snappy","snarling","sneaky","sniveling","snoopy","sociable","soft","soggy","solid","somber","some","spherical","sophisticated","sore","sorrowful","soulful","soupy","sour","Spanish","sparkling","sparse","specific","spectacular","speedy","spicy","spiffy","spirited","spiteful","splendid","spotless","spotted","spry","square","squeaky","squiggly","stable","staid","stained","stale","standard","starchy","stark","starry","steep","sticky","stiff","stimulating","stingy","stormy","straight","strange","steel","strict","strident","striking","striped","strong","studious","stunning","stupendous","stupid","sturdy","stylish","subdued","submissive","substantial","subtle","suburban","sudden","sugary","sunny","super","superb","superficial","superior","supportive","sure-footed","surprised","suspicious","svelte","sweaty","sweet","sweltering","swift","sympathetic","tall","talkative","tame","tan","tangible","tart","tasty","tattered","taut","tedious","teeming","tempting","tender","tense","tepid","terrible","terrific","testy","thankful","that","these","thick","thin","third","thirsty","this","thorough","thorny","those","thoughtful","threadbare","thrifty","thunderous","tidy","tight","timely","tinted","tiny","tired","torn","total","tough","traumatic","treasured","tremendous","tragic","trained","tremendous","triangular","tricky","trifling","trim","trivial","troubled","true","trusting","trustworthy","trusty","truthful","tubby","turbulent","twin","ugly","ultimate","unacceptable","unaware","uncomfortable","uncommon","unconscious","understated","unequaled","uneven","unfinished","unfit","unfolded","unfortunate","unhappy","unhealthy","uniform","unimportant","unique","united","unkempt","unknown","unlawful","unlined","unlucky","unnatural","unpleasant","unrealistic","unripe","unruly","unselfish","unsightly","unsteady","unsung","untidy","untimely","untried","untrue","unused","unusual","unwelcome","unwieldy","unwilling","unwitting","unwritten","upbeat","upright","upset","urban","usable","used","useful","useless","utilized","utter","vacant","vague","vain","valid","valuable","vapid","variable","vast","velvety","venerated","vengeful","verifiable","vibrant","vicious","victorious","vigilant","vigorous","villainous","violet","violent","virtual","virtuous","visible","vital","vivacious","vivid","voluminous","wan","warlike","warm","warmhearted","warped","wary","wasteful","watchful","waterlogged","watery","wavy","wealthy","weak","weary","webbed","wee","weekly","weepy","weighty","weird","welcome","well-documented","well-groomed","well-informed","well-lit","well-made","well-off","well-to-do","well-worn","wet","which","whimsical","whirlwind","whispered","white","whole","whopping","wicked","wide","wide-eyed","wiggly","wild","willing","wilted","winding","windy","winged","wiry","wise","witty","wobbly","woeful","wonderful","wooden","woozy","wordy","worldly","worn","worried","worrisome","worse","worst","worthless","worthwhile","worthy","wrathful","wretched","writhing","wrong","wry","yawning","yearly","yellow","yellowish","young","youthful","yummy","zany","zealous","zesty","zigzag","rocky"];

    var name2 = ["people","history","way","art","world","information","map","family","government","health","system","computer","meat","year","thanks","music","person","reading","method","data","food","understanding","theory","law","bird","literature","problem","software","control","knowledge","power","ability","economics","love","internet","television","science","library","nature","fact","product","idea","temperature","investment","area","society","activity","story","industry","media","thing","oven","community","definition","safety","quality","development","language","management","player","variety","video","week","security","country","exam","movie","organization","equipment","physics","analysis","policy","series","thought","basis","boyfriend","direction","strategy","technology","army","camera","freedom","paper","environment","child","instance","month","truth","marketing","university","writing","article","department","difference","goal","news","audience","fishing","growth","income","marriage","user","combination","failure","meaning","medicine","philosophy","teacher","communication","night","chemistry","disease","disk","energy","nation","road","role","soup","advertising","location","success","addition","apartment","education","math","moment","painting","politics","attention","decision","event","property","shopping","student","wood","competition","distribution","entertainment","office","population","president","unit","category","cigarette","context","introduction","opportunity","performance","driver","flight","length","magazine","newspaper","relationship","teaching","cell","dealer","debate","finding","lake","member","message","phone","scene","appearance","association","concept","customer","death","discussion","housing","inflation","insurance","mood","woman","advice","blood","effort","expression","importance","opinion","payment","reality","responsibility","situation","skill","statement","wealth","application","city","county","depth","estate","foundation","grandmother","heart","perspective","photo","recipe","studio","topic","collection","depression","imagination","passion","percentage","resource","setting","ad","agency","college","connection","criticism","debt","description","memory","patience","secretary","solution","administration","aspect","attitude","director","personality","psychology","recommendation","response","selection","storage","version","alcohol","argument","complaint","contract","emphasis","highway","loss","membership","possession","preparation","steak","union","agreement","cancer","currency","employment","engineering","entry","interaction","limit","mixture","preference","region","republic","seat","tradition","virus","actor","classroom","delivery","device","difficulty","drama","election","engine","football","guidance","hotel","match","owner","priority","protection","suggestion","tension","variation","anxiety","atmosphere","awareness","bread","climate","comparison","confusion","construction","elevator","emotion","employee","employer","guest","height","leadership","mall","manager","operation","recording","respect","sample","transportation","boring","charity","cousin","disaster","editor","efficiency","excitement","extent","feedback","guitar","homework","leader","mom","outcome","permission","presentation","promotion","reflection","refrigerator","resolution","revenue","session","singer","tennis","basket","bonus","cabinet","childhood","church","clothes","coffee","dinner","drawing","hair","hearing","initiative","judgment","lab","measurement","mode","mud","orange","poetry","police","possibility","procedure","queen","ratio","relation","restaurant","satisfaction","sector","signature","significance","song","tooth","town","vehicle","volume","wife","accident","airport","appointment","arrival","assumption","baseball","chapter","committee","conversation","database","enthusiasm","error","explanation","farmer","gate","girl","hall","historian","hospital","injury","instruction","maintenance","manufacturer","meal","perception","pie","poem","presence","proposal","reception","replacement","revolution","river","son","speech","tea","village","warning","winner","worker","writer","assistance","breath","buyer","chest","chocolate","conclusion","contribution","cookie","courage","desk","drawer","establishment","examination","garbage","grocery","honey","impression","improvement","independence","insect","inspection","inspector","king","ladder","menu","penalty","piano","potato","profession","professor","quantity","reaction","requirement","salad","sister","supermarket","tongue","weakness","wedding","affair","ambition","analyst","apple","assignment","assistant","bathroom","bedroom","beer","birthday","celebration","championship","cheek","client","consequence","departure","diamond","dirt","ear","fortune","friendship","funeral","gene","girlfriend","hat","indication","intention","lady","midnight","negotiation","obligation","passenger","pizza","platform","poet","pollution","recognition","reputation","shirt","speaker","stranger","surgery","sympathy","tale","throat","trainer","uncle","youth","time","work","film","water","money","example","while","business","study","game","life","form","air","day","place","number","part","field","fish","back","process","heat","hand","experience","job","book","end","point","type","home","economy","value","body","market","guide","interest","state","radio","course","company","price","size","card","list","mind","trade","line","care","group","risk","word","fat","force","key","light","training","name","school","top","amount","level","order","practice","research","sense","service","piece","web","boss","sport","fun","house","page","term","test","answer","sound","focus","matter","kind","soil","board","oil","picture","access","garden","range","rate","reason","future","site","demand","exercise","image","case","cause","coast","action","age","bad","boat","record","result","section","building","mouse","cash","class","period","plan","store","tax","side","subject","space","rule","stock","weather","chance","figure","man","model","source","beginning","earth","program","chicken","design","feature","head","material","purpose","question","rock","salt","act","birth","car","dog","object","scale","sun","note","profit","rent","speed","style","war","bank","craft","half","inside","outside","standard","bus","exchange","eye","fire","position","pressure","stress","advantage","benefit","box","frame","issue","step","cycle","face","item","metal","paint","review","room","screen","structure","view","account","ball","discipline","medium","share","balance","bit","black","bottom","choice","gift","impact","machine","shape","tool","wind","address","average","career","culture","morning","pot","sign","table","task","condition","contact","credit","egg","hope","ice","network","north","square","attempt","date","effect","link","post","star","voice","capital","challenge","friend","self","shot","brush","couple","exit","front","function","lack","living","plant","plastic","spot","summer","taste","theme","track","wing","brain","button","click","desire","foot","gas","influence","notice","rain","wall","base","damage","distance","feeling","pair","savings","staff","sugar","target","text","animal","author","budget","discount","file","ground","lesson","minute","officer","phase","reference","register","sky","stage","stick","title","trouble","bowl","bridge","campaign","character","club","edge","evidence","fan","letter","lock","maximum","novel","option","pack","park","quarter","skin","sort","weight","baby","background","carry","dish","factor","fruit","glass","joint","master","muscle","red","strength","traffic","trip","vegetable","appeal","chart","gear","ideal","kitchen","land","log","mother","net","party","principle","relative","sale","season","signal","spirit","street","tree","wave","belt","bench","commission","copy","drop","minimum","path","progress","project","sea","south","status","stuff","ticket","tour","angle","blue","breakfast","confidence","daughter","degree","doctor","dot","dream","duty","essay","father","fee","finance","hour","juice","luck","milk","mouth","peace","pipe","stable","storm","substance","team","trick","afternoon","bat","beach","blank","catch","chain","consideration","cream","crew","detail","gold","interview","kid","mark","mission","pain","pleasure","score","screw","sex","shop","shower","suit","tone","window","agent","band","bath","block","bone","calendar","candidate","cap","coat","contest","corner","court","cup","district","door","east","finger","garage","guarantee","hole","hook","implement","layer","lecture","lie","manner","meeting","nose","parking","partner","profile","rice","routine","schedule","swimming","telephone","tip","winter","airline","bag","battle","bed","bill","bother","cake","code","curve","designer","dimension","dress","ease","emergency","evening","extension","farm","fight","gap","grade","holiday","horror","horse","host","husband","loan","mistake","mountain","nail","noise","occasion","package","patient","pause","phrase","proof","race","relief","sand","sentence","shoulder","smoke","stomach","string","tourist","towel","vacation","west","wheel","wine","arm","aside","associate","bet","blow","border","branch","breast","brother","buddy","bunch","chip","coach","cross","document","draft","dust","expert","floor","god","golf","habit","iron","judge","knife","landscape","league","mail","mess","native","opening","parent","pattern","pin","pool","pound","request","salary","shame","shelter","shoe","silver","tackle","tank","trust","assist","bake","bar","bell","bike","blame","boy","brick","chair","closet","clue","collar","comment","conference","devil","diet","fear","fuel","glove","jacket","lunch","monitor","mortgage","nurse","pace","panic","peak","plane","reward","row","sandwich","shock","spite","spray","surprise","till","transition","weekend","welcome","yard","alarm","bend","bicycle","bite","blind","bottle","cable","candle","clerk","cloud","concert","counter","flower","grandfather","harm","knee","lawyer","leather","load","mirror","neck","pension","plate","purple","ruin","ship","skirt","slice","snow","specialist","stroke","switch","trash","tune","zone","anger","award","bid","bitter","boot","bug","camp","candy","carpet","cat","champion","channel","clock","comfort","cow","crack","engineer","entrance","fault","grass","guy","hell","highlight","incident","island","joke","jury","leg","lip","mate","motor","nerve","passage","pen","pride","priest","prize","promise","resident","resort","ring","roof","rope","sail","scheme","script","sock","station","toe","tower","truck","witness","can","will","other","use","make","good","look","help","go","great","being","still","public","read","keep","start","give","human","local","general","specific","long","play","feel","high","put","common","set","change","simple","past","big","possible","particular","major","personal","current","national","cut","natural","physical","show","try","check","second","call","move","pay","let","increase","single","individual","turn","ask","buy","guard","hold","main","offer","potential","professional","international","travel","cook","alternative","special","working","whole","dance","excuse","cold","commercial","low","purchase","deal","primary","worth","fall","necessary","positive","produce","search","present","spend","talk","creative","tell","cost","drive","green","support","glad","remove","return","run","complex","due","effective","middle","regular","reserve","independent","leave","original","reach","rest","serve","watch","beautiful","charge","active","break","negative","safe","stay","visit","visual","affect","cover","report","rise","walk","white","junior","pick","unique","classic","final","lift","mix","private","stop","teach","western","concern","familiar","fly","official","broad","comfortable","gain","rich","save","stand","young","heavy","lead","listen","valuable","worry","handle","leading","meet","release","sell","finish","normal","press","ride","secret","spread","spring","tough","wait","brown","deep","display","flow","hit","objective","shoot","touch","cancel","chemical","cry","dump","extreme","push","conflict","eat","fill","formal","jump","kick","opposite","pass","pitch","remote","total","treat","vast","abuse","beat","burn","deposit","print","raise","sleep","somewhere","advance","consist","dark","double","draw","equal","fix","hire","internal","join","kill","sensitive","tap","win","attack","claim","constant","drag","drink","guess","minor","pull","raw","soft","solid","wear","weird","wonder","annual","count","dead","doubt","feed","forever","impress","repeat","round","sing","slide","strip","wish","combine","command","dig","divide","equivalent","hang","hunt","initial","march","mention","spiritual","survey","tie","adult","brief","crazy","escape","gather","hate","prior","repair","rough","sad","scratch","sick","strike","employ","external","hurt","illegal","laugh","lay","mobile","nasty","ordinary","respond","royal","senior","split","strain","struggle","swim","train","upper","wash","yellow","convert","crash","dependent","fold","funny","grab","hide","miss","permit","quote","recover","resolve","roll","sink","slip","spare","suspect","sweet","swing","twist","upstairs","usual","abroad","brave","calm","concentrate","estimate","grand","male","mine","prompt","quiet","refuse","regret","reveal","rush","shake","shift","shine","steal","suck","surround","bear","brilliant","dare","dear","delay","drunk","female","hurry","inevitable","invite","kiss","neat","pop","punch","quit","reply","representative","resist","rip","rub","silly","smile","spell","stretch","stupid","tear","temporary","tomorrow","wake","wrap","yesterday","Thomas","Tom","Lieuwe"];

    var name = capFirst(name1[getRandomInt(0, name1.length + 1)]) + ' ' + capFirst(name2[getRandomInt(0, name2.length + 1)]);
    return name;

}