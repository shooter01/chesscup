var express = require('express');
var router = express.Router();
const {isLoggedIn} = require('./middlewares');
const { check, validationResult } = require('express-validator/check');
const moment = require('moment');
const countries = require('./countries');
const DRAW = require('./draw_functions');
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


    router.post('/create', [
        isLoggedIn,
        check('title', 'The title field is required').exists().isLength({ min: 1 }),
        check('city', 'The city field is required').exists().isLength({ min: 1 }),
        check('tours_count', 'The tours count field is required').exists().isLength({ min: 1 }),
        check('type', 'The tournament field is required').exists().isLength({ min: 1 }),
        check('country', 'The country field is required').exists().isLength({ min: 1 }),
        check('start_date', 'The start date field is required').exists().isLength({ min: 1 }),
        check('end_date', 'The end date field is required').exists().isLength({ min: 1 }),
    ],
        function (req, res, next) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({
                errors: errors.mapped()
            });
        } else {
            let office = {
                title: req.body.title.trim(),
                city: req.body.city.trim(),
                tours_count: req.body.tours_count.trim(),
                country: req.body.country,
                type: req.body.type,
                start_date: req.body.start_date,
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

        ],
        function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            return res.status(422).json({
                errors: errors.mapped()
            });
        } else {
            let office = {
                title: req.body.title.trim(),
                city: req.body.city.trim(),
                tours_count: req.body.tours_count.trim(),
                country: req.body.country,
                team_boards: req.body.team_boards,
                type: req.body.type,
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
                console.log(results);
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
                console.log(results);
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
                console.log(results);
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
            let user_type = req.body.user_type;
            tournament_id = parseInt(tournament_id);

            let let_insert = true;
            let let_tournament_insert = true;

            let tourney,
                arrr = [],
                participants = [],
                pairs = {},
                participants_object = {},
                current_tour_results = [],
                after_tour_results_sum,
                after_tour_team_results_sum,
                after_tour_team_results_sum_array = [],
                played_arrays = {},
                team_played_arrays = {},
                berger_object = {},
                end_ratings = {},
                change_rating = {},
                bye_participants = {},
                team_swiss,
                team_pairs,
                team_berger_object,
                team_berger,
                after_tour_team_results_sum_buhgolz = {}
                ;


            var team_temp;

            if (!isNaN(tournament_id)) {

            pool
                .query('SELECT * FROM tournaments WHERE id = ?', tournament_id)
                .then(rows => {
                    tourney = rows[0];
                })
                .then(res => {
                    if (tourney.is_closed === 1) {
                        throw new Error(req.i18n.__("TourneyClosed"));
                    }

                    if (tourney.type > 10) {
                        const sql = 'SELECT id FROM tournaments_teams WHERE tournament_id = ?';
                        return  pool.query(sql, tourney.id);
                    } else {
                        return true;
                    }

                }).then(rows => {

                    if (tourney.type > 10 && rows.length <= tourney.tours_count) {
                        throw new Error(req.i18n.__("TooSmallQuantity"));
                    }

                    let sql = "SELECT tp.user_id, tp.start_rating, ts.scores, tp.is_active FROM tournaments_participants tp LEFT JOIN tournaments_scores ts ON ts.user_id = tp.user_id AND  tp.tournament_id = ts.tournament_id WHERE tp.tournament_id = ?";

                    return  pool.query(sql, tourney.id);
                })
               .then(rows => {
                   participants = rows;
               })
               .then(rows => {
                   //2 - круговой турнир, если первый тур, то выставляем количество туров по числу участников
                   if (tourney.type === 2 && tourney.is_active === 0) {
                       return pool.query('UPDATE tournaments SET ? WHERE tournaments.id = ?',[{
                           tours_count : participants.length - 1,
                       },tourney.id]);
                   } else {
                       return rows;
                   }
               }).then(rows => {

                   if (tourney.type === 1 && participants.length <= tourney.tours_count) {
                       throw new Error(req.i18n.__("TooSmallQuantity"));
                   }
                   //сортировка участников по полю scores - кто сколько набрал
                   participants = DRAW.sortArr(participants);
                   //создает объект участников - ключ - id участника - значение - сколько набрал очков
                   //так же создает объект участников, кто покинул турнир
                   var temp = DRAW.makeObject(participants);
                   participants_object = temp.scores_object;
                   bye_participants = temp.bye_participants;

                   let sql = 'select tp.user_id,tp.start_rating,tr.p1_id,tr.p1_rating_for_history,tr.p2_rating_for_history,tr.p2_id,tr.p1_won, tr.p1_scores,tr.p2_won, tr.p2_scores from tournaments_participants tp LEFT JOIN tournaments_results tr ON (tr.p1_id = tp.user_id OR tr.p2_id = tp.user_id) WHERE tr.tournament_id = ? AND tr.tour = ?';

                   if (tourney.type == 20) {
                       sql = 'SELECT * FROM tournaments_teams_results WHERE tournament_id = ? AND tour = ?';
                   }

                    return pool
                        .query(sql,   [
                            tourney.id,
                            tourney.current_tour,
                        ])
                })

                .then(rows => {
                    current_tour_results = rows;
                    //проверяем пустые результаты
                    var isEmptyResults = DRAW.checkEmptyResults(current_tour_results, tourney);

                    if (tourney.current_tour !== 0) {
                        if (isEmptyResults) throw new Error(req.i18n.__("ParticipantsFillAllResults"));
                    }

                    //фильтруем результаты тура
                    //отдает объект в виде - название id команды - количество очков за тур
                    var temp = DRAW.filterResults(current_tour_results);

                    var current_tour_results_filtered = temp.filtered;
                    change_rating = temp.ratings;
                    //bye_participants = temp.bye_participants;

                    //отдает объект с суммой всех очков участников
                    //for_addition - массив готовый к вставке в базу
                    //overall - объект с ключами - id юзера, значение - сколько очков набрал
                    after_tour_results_sum = DRAW.makeSum(current_tour_results_filtered, participants_object, tourney);

                })
                .then(rows => {
                    return pool
                        .query('select tr.p1_id,tr.p2_id,tr.p1_won, tr.p1_scores,tr.p2_won, tr.p2_scores, tr.tour FROM tournaments_results tr WHERE tr.tournament_id = ?',   [
                            tourney.id,
                        ])
                })
                .then(rows => {

                    //делаем пары и создаем бергер объект
                    //пары вида массив с { home: 178, away: 184 }
                    //бергер объект '178': { wins: [Object], draw: {} }
                    var g = DRAW.makeResultsForSwissSystem(rows, participants, tourney, bye_participants);
                    pairs = g.swiss;
                    berger_object = g.berger_object;

                    //считаем бергер объект
                    berger_object = DRAW.sumBergerObject(berger_object, after_tour_results_sum.overall);

                    return pool
                        .query('SELECT tr.p1_id,tr.p2_id FROM tournaments_results tr WHERE tr.tournament_id = ?', [tournament_id])
                })
               .then(rows => {
                    //считаем сумму очков противников для бухгольца
                    played_arrays = DRAW.makePlayedArray(rows, after_tour_results_sum.overall);
                    return  pool.query("SELECT * FROM tournaments_scores WHERE tournament_id = ? AND tour = ?", [tourney.id, tourney.scores]);
                })
                .then(rows => {

                    //создает массив для вставки в tournament_results
                    //если противника нет ставит 1 : 0
                    //сортирует по очкам
                    var for_addition = DRAW.makeInsertObject(pairs, participants_object, tourney, req.session.passport.user.id, change_rating);

                    if (let_insert && tourney.type < 10 && ((tourney.current_tour + 1) <= tourney.tours_count)) {
                        return pool.query('INSERT INTO tournaments_results (p1_id, p2_id, p1_won, p2_won,p1_scores,p2_scores, tournament_id,created_at,add_by,tour,board, rating_change_p1, rating_change_p2, p1_rating_for_history, p2_rating_for_history) VALUES ?', [for_addition]);
                    }
                })
                .then(rows => {
                    if (let_insert || let_tournament_insert) {
                        if (tourney.current_tour < tourney.tours_count) {
                            return pool.query('UPDATE tournaments SET ? WHERE tournaments.id = ?',[{
                                current_tour : tourney.current_tour + 1,
                                is_active : 1,
                            },tourney.id]);
                        } else {
                            return pool.query('UPDATE tournaments SET ? WHERE tournaments.id = ?',[{
                                current_tour : tourney.current_tour + 1,
                                is_active : 1,
                                is_closed : 1
                            }, tourney.id]);

                        }
                    }
                })
                .then(rows => {
                    if (let_insert) {
                        return pool
                            .query('DELETE FROM tournaments_scores WHERE tournament_id = ?', tournament_id);
                    }
                }).then(rows => {

                    for (var i = 0; i < after_tour_results_sum.for_addition.length; i++) {
                        var obj = after_tour_results_sum.for_addition[i];
                        //добавляем бухгольц
                        after_tour_results_sum.for_addition[i].push(played_arrays[obj[0]]);

                        //добавляем рейтинг и изменение
                        var tcurrent = (typeof change_rating[obj[0]] != "undefined") ? change_rating[obj[0]].current : null;
                        var tchange = (typeof change_rating[obj[0]] != "undefined") ? change_rating[obj[0]].change : null;
                            after_tour_results_sum.for_addition[i].push(tcurrent);
                            after_tour_results_sum.for_addition[i].push(tchange);

                            //добавляем бергер
                        after_tour_results_sum.for_addition[i].push(berger_object[obj[0]]);

                    }

                    if (after_tour_results_sum.for_addition.length > 0) {
                        if (let_insert) {
                            return pool.query('INSERT INTO tournaments_scores (user_id, tournament_id, scores, bh, rating, rating_change, berger) VALUES ?', [after_tour_results_sum.for_addition]).catch(function (err) {
                                console.log(err);
                            });
                        }
                    } else {
                        return [0, false];
                    }
            }).then(rows => {

                ///TEAMS SECTION

                if (tourney.type > 10) {
                    return pool.query('SELECT tt.id AS user_id, tts.scores, tts.team_scores FROM tournaments_teams tt LEFT JOIN tournaments_teams_scores tts ON tts.team_id = tt.id WHERE tt.tournament_id = ?', tournament_id)
                } else {
                    return true;
                }

            }).then(rows => {
                if (tourney.type > 10) {
                    team_temp = rows;
                } else {
                    return true;
                }
            }).then(rows => {
                if (tourney.type > 10) {
                    return pool.query('SELECT ' +
                        'ttr.team_1_id AS p1_id,' +
                        'ttr.team_2_id AS p2_id,' +
                        'ttr.team_1_won AS p1_won, ' +
                        'ttr.tour AS tour, ' +
                        'ttr.team_2_won AS p2_won FROM tournaments_teams_results ttr WHERE ttr.tournament_id = ? ORDER BY ttr.id DESC', tournament_id)
                } else {
                    return true;
                }
            }).then(rows => {
                if (tourney.type > 10) {
                    team_played_arrays = rows;

                    team_swiss = DRAW.makeResultsForSwissSystem(rows, team_temp, tourney, {});
                    team_berger_object = team_swiss.berger_object;

                    return pool.query('SELECT ' +
                        'ttr.team_1_id AS p1_id,' +
                        'ttr.team_2_id AS p2_id,' +
                        'ttr.team_1_won AS p1_won, ' +
                        'ttr.tour AS tour, ' +
                        'ttr.team_2_won AS p2_won FROM tournaments_teams_results ttr WHERE ttr.tournament_id = ? AND ttr.tour = ? ORDER BY ttr.id DESC', [tournament_id, tourney.current_tour])
                } else {
                    return true;
                }

            }).then(rows => {

                if (tourney.type > 10) {
                    var temp = {};
                    var win_lose = {};

                    for (var i = 0; i < rows.length; i++) {
                        var obj1 = rows[i];
                        temp[obj1.p1_id] = obj1.p1_won || 0;
                        temp[obj1.p2_id] = obj1.p2_won || 0;

                        if (temp[obj1.p1_id] > temp[obj1.p2_id]) {
                            win_lose[obj1.p1_id] =  2;
                            win_lose[obj1.p2_id] =  0;
                        } else if (temp[obj1.p2_id] > temp[obj1.p1_id]) {
                            win_lose[obj1.p1_id] =  0;
                            win_lose[obj1.p2_id] =  2;
                        } else if (temp[obj1.p2_id] = temp[obj1.p1_id]) {
                            win_lose[obj1.p1_id] =  1;
                            win_lose[obj1.p2_id] =  1;
                        }
                    }



                    delete temp['null'];

                    after_tour_team_results_sum = {};
                    after_tour_team_results_sum_buhgolz = {};


                    for (var i = 0; i < team_temp.length; i++) {
                        var obj2 = team_temp[i];
                        after_tour_team_results_sum[obj2.user_id] = after_tour_team_results_sum[obj2.user_id] || {};
                        after_tour_team_results_sum[obj2.user_id].scores = (obj2.scores || 0) + (win_lose[obj2.user_id] || 0);
                        after_tour_team_results_sum_buhgolz[obj2.user_id] = (obj2.scores || 0) + (win_lose[obj2.user_id] || 0);
                        after_tour_team_results_sum[obj2.user_id].team_scores = (obj2.team_scores || 0) + (temp[obj2.user_id] || 0);
                    }
                    played_arrays = DRAW.makePlayedArray(team_played_arrays, after_tour_team_results_sum_buhgolz);
                    team_berger = DRAW.sumBergerObject(team_berger_object, after_tour_team_results_sum_buhgolz);

                    for (var obj in after_tour_team_results_sum) {
                        after_tour_team_results_sum_array.push([
                            obj,
                            tournament_id,
                            after_tour_team_results_sum[obj].scores || 0,
                            after_tour_team_results_sum[obj].team_scores || 0,
                            played_arrays[obj] || 0,
                            team_berger[obj] || 0,
                        ]);
                    }

                    if (let_tournament_insert) {
                        return pool
                            .query('DELETE FROM tournaments_teams_scores WHERE tournament_id = ?', tournament_id);
                    }
                } else {
                    return true;
                }




            }).then(rows => {
                if (tourney.type > 10) {
                    if (let_tournament_insert) {

                        return pool.query('INSERT INTO tournaments_teams_scores (team_id, tournament_id, scores, team_scores, bh, berger) VALUES ?', [after_tour_team_results_sum_array]).catch(function (err) {
                            console.log(err);
                        });
                    }
                } else {
                    return true;
                }

            }).then(rows => {
                if (tourney.type > 10) {
                    var for_addition_teams = [];
                    for (var i = 0; i < team_swiss.swiss.length; i++) {
                        var obj = team_swiss.swiss[i], p1_won = null, p2_won = null;

                        if (obj.home == null) {
                            p1_won = 0;
                            p2_won = tourney.team_boards;
                        }
                        if (obj.away == null) {
                            p1_won = tourney.team_boards;
                            p2_won = 0;
                        }

                        for_addition_teams.push(
                            [
                                obj.home,
                                obj.away,
                                p1_won,
                                p2_won,
                                after_tour_team_results_sum_buhgolz[obj.home] || 0,
                                after_tour_team_results_sum_buhgolz[obj.away] || 0,
                                tourney.id,
                                new Date(),
                                req.session.passport.user.id,
                                tourney.current_tour + 1,
                            ]);
                    }


                    if (((tourney.current_tour + 1) <= tourney.tours_count)) {
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
                                'add_by,' +
                                'tour) VALUES ?', [for_addition_teams]);
                        }
                    }
                } else {
                    return true;
                }


            }) .then(rows => {

                if (tourney.type > 10) {
                    return pool.query('SELECT tt.id AS team_id,tt.team_name, tp.user_id, tp.team_board, u.name,u.email ' +
                        'FROM tournaments_teams AS tt LEFT JOIN tournaments_participants AS tp ON tp.team_id = tt.id LEFT JOIN users AS u ON tp.user_id = u.id WHERE tt.tournament_id = ? ORDER BY tt.id DESC, tp.team_board ASC', tournament_id)
                } else {
                    return true;
                }

            }).then(rows => {
                if (tourney.type > 10) {
                    team_pairs = DRAW_TEAM.makeInsertTeamsScoresObject(rows, current_tour_results, team_swiss);
                } else {
                    return true;
                }
            }).then(rows => {

                if (tourney.type === 11) {
                    if (((tourney.current_tour + 1) <= tourney.tours_count)) {

                        var for_addition = DRAW.makeInsertObject(team_pairs.pairs, participants_object, tourney, req.session.passport.user.id, change_rating);
                        if (let_tournament_insert) {
                            return pool.query('INSERT INTO tournaments_results (' +
                                'p1_id, ' +
                                'p2_id, p1_won, p2_won,p1_scores,p2_scores, tournament_id,created_at,add_by,tour,board, rating_change_p1, rating_change_p2, p1_rating_for_history, p2_rating_for_history) VALUES ?', [for_addition]);
                        }
                    }
                } else {
                    return true;
                }

            })
            .then(rows => {

                var tour = ((tourney.current_tour + 1) <= tourney.tours_count) ? tourney.current_tour + 1 : null;

                    res.json({
                        "status": "ok",
                        "updated_tour" : tour
                    });
                }).catch(function (err) {
                    console.log(err);
                    res.json({
                        "status": "error",
                        "msg" : err.message
                    });
                });

            } else {
                res.json({
                    "status": "error",
                    "msg": "tournament_id is null",
                });
            }
        }
    });


    router.post('/save_result', [isLoggedIn],
        function (req, res, next) {
        let tournament_id = req.body.tournament_id;
        let result = JSON.parse(req.body.result);
        tournament_id = parseInt(tournament_id);

        if (!isNaN(tournament_id)) {

            let office = {
                p1_won: result.p1_won,
                p2_won: result.p2_won,
            };

            var tourney, participants, teams_points;

            pool
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
                        var rating_p1 = results[0].rating_p1;
                        var rating_p2 = results[0].rating_p2;
                        if (result.p1_won == 0 && result.p2_won == 0) {
                            office["p1_rating_for_history"] = office["p2_rating_for_history"] =  office["rating_change_p1"] = office["rating_change_p2"] = null;
                        } else {
                            var odds_p1_wins = elo.expectedScore(rating_p1, rating_p2);
                            var odds_p2_wins = elo.expectedScore(rating_p2, rating_p1);
                            office["p1_rating_for_history"] = elo.newRating(odds_p1_wins, result.p1_won, rating_p1);
                            office["p2_rating_for_history"] = elo.newRating(odds_p2_wins, result.p2_won, rating_p2);
                            office["rating_change_p1"] = office["p1_rating_for_history"] - rating_p1;
                            office["rating_change_p2"] = office["p2_rating_for_history"] - rating_p2;
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
                            tournaments_rating : office["p1_rating_for_history"]
                        },
                        result.p1_id,
                    ]);

            }).then(function (results) {

                return pool.query('UPDATE users SET ? ' +
                    'WHERE ' +
                    'id  = ?',
                    [
                        {
                            tournaments_rating : office["p2_rating_for_history"]
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

                    console.log([
                        office,
                        tourney.id,
                        tourney.current_tour,
                        result.p1_id,
                        result.p2_id,

                    ]);

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
        if (!isNaN(tournament_id)) {
            pool
                .query('SELECT tournaments.*, users.name FROM tournaments LEFT JOIN users ON users.id = tournaments.creator_id WHERE tournaments.id = ?', tournament_id)
               .then(rows => {
                   if (rows.length > 0) {
                       rows[0].start_date = moment(rows[0].start_date).format("DD-MM-YYYY");
                       rows[0].end_date = moment(rows[0].end_date).format("DD-MM-YYYY");
                       rows[0].created_at = moment(rows[0].created_at).format("DD-MM-YYYY");

                       res.render('tournament/show', {
                           tournament  : rows[0],
                           countries : countries

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
                        DRAW.teamSwiss(req, res, next, pool, tournament, tournament_id, tour_id);
                    } else {
                        DRAW.defaultSwiss(req, res, next, pool, tournament, tournament_id, tour_id);
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
        console.log(tournament_id);
        console.log(user_id);
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

                console.log(pairing);

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



                    res.render('tournament/pairing', {
                        tournament  : tournament,
                        pairing  : JSON.stringify(pairing),
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
                             console.log(teams);
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
        console.log(order["190"]);

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

            console.log(test);
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


