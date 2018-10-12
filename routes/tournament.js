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
                mongoGame = data;
                console.log(mongoGame);



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
               // console.log(mongoGame.p2_last_move);
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
        check('tours_count', 'The tours count field is required').exists().isLength({ min: 1 }),
        check('type', 'The tournament field is required').exists().isLength({ min: 1 }),
        check('country', 'The country field is required').exists().isLength({ min: 1 }),
        check('start_date', 'The start date field is required').exists().isLength({ min: 1 }),
        check('end_date', 'The end date field is required').exists().isLength({ min: 1 }),
        check('amount', 'The amount field is required').exists().isLength({ min: 1 }),
        check('waitMinutes', 'The waitMinutes field is required').exists().isLength({ min: 1 }),
        check('is_online', 'The is_online field is required').exists().isLength({ min: 1 }),
    ],
        function (req, res, next) {
        const errors = validationResult(req);
            console.log(req.body.amount);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                errors: errors.mapped()
            });
        } else {

            var newDateObj = moment(new Date()).add(req.body.waitMinutes, 'm').toDate();

            let office = {
                title: req.body.title.trim(),
                city: req.body.city.trim(),
                tours_count: req.body.tours_count.trim(),
                country: req.body.country,
                type: req.body.type,
                is_active : 0,
                start_date: req.body.start_date,
                amount: parseInt(req.body.amount),
                start_time: newDateObj,
                is_online: req.body.is_online,
                end_date: req.body.end_date,
                team_boards: req.body.team_boards,
                current_tour: 0,
                created_at: new Date(),
                creator_id: req.session.passport.user.id,
            };


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
            check('tours_count', 'The tours count field is required').exists().isLength({ min: 1 }).custom((value, { req }) => {

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
            check('waitMinutes', 'The waitMinutes field is required').exists().isLength({ min: 1 }),
            check('is_online', 'The is_online field is required').exists().isLength({ min: 1 }),

        ],
        function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            return res.status(422).json({
                errors: errors.mapped()
            });
        } else {
            var newDateObj = moment(new Date()).add(req.body.waitMinutes, 'm').toDate();

            let office = {
                title: req.body.title.trim(),
                city: req.body.city.trim(),
                tours_count: req.body.tours_count.trim(),
                country: req.body.country,
                team_boards: req.body.team_boards,
                type: req.body.type,
                amount: req.body.amount,
                start_time: newDateObj,
                is_online: req.body.is_online,
                start_date: req.body.start_date,
                end_date: req.body.end_date,
                creator_id: req.session.passport.user.id,
                school_id: req.session.passport.user.school_id,
            };

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
                team_id: req.body.team_id,
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
        check('tournament_id', 'Вы не указали турнир.').exists().isLength({ min: 1 }),

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
                return pool.query('UPDATE tournaments SET ? WHERE tournaments.id = ?',[
                    {
                        current_tour : 0,
                        is_closed : 0,
                        is_active : 0,
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



    router.post('/undo_last_tour', [
        isLoggedIn,
        check('tournament_id', 'id is required').exists().isLength({ min: 1 }),

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
            })


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
                   tourney = rows;
                   var sql = 'SELECT users.* FROM tournaments_participants LEFT JOIN users ON users.id = tournaments_participants.user_id WHERE tournaments_participants.tournament_id = ?  ORDER BY id DESC';
                   return pool.query(sql, tournament_id);
               })
               .then(rows => {
                   participants = rows;
                   if (req.isAuthenticated()) {
                       for (var i = 0; i < participants.length; i++) {
                           var obj = participants[i];
                           if (req.session.passport.user.id == obj.id){
                               is_in = true;
                               break;
                           }
                       }
                   }
                  //  console.log(is_in);

            //}).then(rows => {

                if (tourney.length > 0) {
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
            res.render('error');
        }
    });



    router.get('/:tournament_id/get_info',
        function (req, res, next) {


            let tournament_id = req.params.tournament_id;
            tournament_id = parseInt(tournament_id);
            if (!isNaN(tournament_id)) {

                pool
                    .query('SELECT * FROM tournaments WHERE id = ?', tournament_id)
                    .then(rows => {
                        const tournament = rows[0];
                        let participants, pairing = [], arrr = [], crosstable, scores_object = {}, current_games = {};
                        let tour_id = tournament.current_tour;


                        pool
                            .query('SELECT tr.*, u1.name AS p1_name,u1.tournaments_rating AS p1_rating, u2.name AS p2_name, u2.tournaments_rating AS p2_rating FROM tournaments_results tr LEFT JOIN users u1 ON tr.p1_id = u1.id LEFT JOIN  users u2 ON tr.p2_id = u2.id WHERE tr.tournament_id = ? AND tr.tour = ?', [tournament_id, tour_id])
                            .then(rows => {
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
                                .query('SELECT tp.user_id,tp.is_active, ts.scores, u.name, u.tournaments_rating, ts.rating,ts.rating_change,ts.bh,ts.berger FROM tournaments_participants tp LEFT JOIN tournaments_scores ts ON ts.user_id = tp.user_id LEFT JOIN users u ON u.id = tp.user_id WHERE tp.tournament_id = ? AND ts.tournament_id = ?', [tournament_id, tournament_id])
                        }).then(rows => {
                            var a = [];

                            for (var i = 0; i < rows.length; i++) {
                                var obj = rows[i];

                                scores_object[obj.user_id] = obj.scores;
                                a.push({
                                    user_id: obj.user_id,
                                    scores: obj.scores,
                                    bh: obj.bh,
                                    berger: obj.berger,
                                    name: obj.name,
                                    crosstable: crosstable,
                                    is_active: obj.is_active,
                                    tournaments_rating: obj.tournaments_rating,
                                });
                            }
                            participants = DRAW.sortArr(a);

                        }).then(rows => {
                            return pool
                                .query('SELECT * FROM tournaments_results tr WHERE tr.tournament_id = ?', tournament_id)
                        }).then(rows => {
                            crosstable = DRAW.makeCrossatable(rows, participants);
                            // console.log(tournament);
                            res.json({
                                tournament  : tournament,
                                pairing  : JSON.stringify(pairing),
                                participants : participants,
                                tour_id : tour_id,
                                scores_object :  JSON.stringify(scores_object),
                                arrr : arrr,
                            });
                        }).catch(function (err) {
                            console.log(err);
                        });

                    });

            } else {
                res.render('error', {
                    message  : req.i18n.__("TourneyNotFound"),
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
                    if (tournament.type > 10) {
                        DRAW.teamSwiss(req, res, next, pool, tournament, tournament_id, tour_id, app);
                    } else {
                        DRAW.defaultSwiss(req, res, next, pool, tournament, tournament_id, tour_id, app);
                    }
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
        let tournament, participants, pairing = [], arrr = [], teams = null, participants_boards = {};
        if (!isNaN(tournament_id)) {
            pool
                .query('SELECT * FROM tournaments WHERE id = ?', tournament_id)
               .then(rows => {
                   tournament = rows[0];
                return pool
                    .query('SELECT tp.user_id,tp.is_active,tp.team_board, ts.scores, ts.rating,ts.rating_change,ts.bh,ts.berger, u.name FROM tournaments_participants tp LEFT JOIN tournaments_scores ts ON ts.user_id = tp.user_id LEFT JOIN users u ON u.id = tp.user_id  WHERE tp.tournament_id = ?  AND ts.tournament_id = ?', [tournament_id, tournament_id])
            }).then(rows => {

                var a = [];

                var scores_object = {};
                for (var i = 0; i < rows.length; i++) {
                    var obj = rows[i];

                    scores_object[obj.user_id] = obj.scores;
                    a.push({
                        user_id: obj.user_id,
                        scores: obj.scores,
                        bh: obj.bh,
                        is_active: obj.is_active,
                        rating: obj.rating,
                        rating_change: obj.rating_change,
                        berger: obj.berger,
                        team_board: obj.team_board,
                        name: obj.name
                    });
                }
                participants = DRAW.sortArr(a);

                if (tournament.type > 10) {
                    participants_boards = DRAW.sortBoards(a);
                }
            }).then(rows => {
                if (tournament.type > 10) {
                    return pool
                        .query('SELECT tt.*,ts.* FROM tournaments_teams tt LEFT JOIN tournaments_teams_scores ts ON ts.team_id = tt.id WHERE tt.tournament_id = ?  AND ts.tournament_id = ?', [tournament_id, tournament_id])
                }

            }).then(rows => {

                if (tournament.type > 10) {
                    teams = DRAW_TEAM.sortArr(rows);
                }


                res.render('tournament/final', {
                    tournament  : tournament,
                    participants :  participants,
                    participants_boards :  participants_boards,
                    teams :  teams,
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


    router.get('/:tournament_id/edit', [isLoggedIn],
        function (req, res, next) {
        let tournament_id = req.params.tournament_id;
        tournament_id = parseInt(tournament_id);
        if (!isNaN(tournament_id)) {
            pool
                .query('SELECT * FROM tournaments WHERE id = ?', tournament_id)
               .then(rows => {

                   if (rows.length > 0) {
                       rows[0].start_date = moment(rows[0].start_date).format("YYYY-MM-DD");
                       rows[0].end_date = moment(rows[0].end_date).format("YYYY-MM-DD");
                       // 2018-05-31
                       res.render('tournament/edit', {
                           tournament  : rows[0],
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

                    console.log(tournament);

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
                                  .query('SELECT users.* FROM users where school_id = ?', req.session.passport.user.school_id)
                            .then(rows => {
                                all_students = rows;

                                var sql = 'SELECT users.* FROM tournaments_participants LEFT JOIN users ON users.id = tournaments_participants.user_id WHERE tournaments_participants.tournament_id = ?  ORDER BY id DESC';

                                if (tourney.type > 10) {
                                    sql = 'SELECT tt.id AS team_id,tt.team_name, tp.user_id,tp.team_board, u.name,u.email FROM tournaments_teams AS tt LEFT JOIN tournaments_participants AS tp ON tp.team_id = tt.id LEFT JOIN users AS u ON tp.user_id = u.id WHERE tt.tournament_id = ? ORDER BY tt.id DESC, tp.team_board ASC';
                                }
                                return pool.query(sql, tournament_id)
                            }).then(rows => {
                                participants = rows;
                             if (tourney.type > 10) {
                                 teams = makeTeams(participants);
                             }
                                return pool.query('SELECT * FROM users WHERE role > 99 AND school_id = ?', req.session.passport.user.school_id)
                            }).then(rows => {
                                teachers = rows;
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


