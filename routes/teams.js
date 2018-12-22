var express = require('express');
var router = express.Router();
const {isLoggedIn} = require('./middlewares');
const { check, validationResult } = require('express-validator/check');
const countries = require('./countries');
const sharp = require('sharp');
const path = require('path');

const multer = require('multer');
const crypto = require('crypto');
const mime = require('mime');
const ObjectId = require('mongodb').ObjectId;

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/original')
    },
    filename: function (req, file, cb) {
        crypto.pseudoRandomBytes(16, function (err, raw) {
            cb(null, raw.toString('hex') + Date.now() + '.' + mime.getExtension(file.mimetype));
        });
    }
});
var upload = multer({
    storage: storage,
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
            return callback(new Error('Only images are allowed'))
        }
        callback(null, true)
    },
    limits:{
        fileSize: 1024 * 1024
    }
});


function generatePassword() {
    var length = 6,
        charset = "0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

function generateEmail() {
    var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal + "@chesscup.org";
}

module.exports = function(app, passport, pool) {

    router.get('/', function (req, res) {
        var page = req.query.page || null;
        var limit_start = 0, limit = 20;
        page = parseInt(page, 10);
        if (typeof page === "undefined" || !Number.isInteger(page)) {
            page = 1;
        }
        limit_start = page * limit - limit;


        pool.query("SELECT COUNT(*) as count FROM teams WHERE is_hidden = 0", function (err, result, fields) {
            var sql1 = "SELECT teams.* FROM teams WHERE is_hidden = 0 ORDER BY participants_count DESC LIMIT ?,?";

            pool
                .query(sql1, [limit_start, limit])
                .then(rows => {

                    var total = result[0].count,
                        pageSize = limit,
                        pageCount = total / pageSize;


                    res.render('teams/teams', {
                        countries : countries,
                        count: result[0].count,
                        total: total,
                        pageSize: pageSize,
                        currentPage: page,
                        pageCount: pageCount,
                        teams : rows,

                    });


                }).catch(function (err) {
                // console.log(err);
                res.json({
                    status : "error",
                });
            });
        });
    });


    router.get('/create', [isLoggedIn], function (req, res, next) {
        res.render('teams/create', {
            countries : countries
        });
    });


    router.post('/create', [
            isLoggedIn,
            check('title', 'The title field is required').exists().isLength({ min: 1 }).custom((value, { req }) => {

                return new Promise((resolve, reject) => {

                    pool.query('SELECT * FROM teams WHERE creator_id = ?', [
                        req.session.passport.user.id
                    ]).then(function (rows) {
                        if(rows.length > 0) {
                            return reject("Нельзя владеть несколькими командами. Вы являетесь капитаном команды : " + rows[0].name);
                        } else {
                            return resolve();
                        }
                    });
                });
            }),
            check('country', 'The country field is required').exists().isLength({ min: 1 }),
        ],
        function (req, res, next) {
            const errors = validationResult(req);
            //console.log(errors);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    errors: errors.mapped()
                });
            } else {
                let team_id, inserted;

                let office = {
                    name: req.body.title.trim(),
                    country: req.body.country.trim(),
                    created_at: new Date(),
                    image: '/images/user.png',
                    creator_id: req.session.passport.user.id,
                    participants_count : 1
                };


                pool.query('INSERT INTO teams SET ?', office)
                    .then(function (results) {
                        team_id = results.insertId;
                        let office = {
                            team_id: results.insertId,
                            user_id: req.session.passport.user.id,
                            team_title: 1,
                        };

                        return pool.query('INSERT INTO teams_participants SET ?', office);

                    }).then(function (results) {
                        inserted = results.insertId;
                            return pool.query('UPDATE users SET ? ' +
                                'WHERE ' +
                                'users.id = ?',
                                [
                                    {is_team_owner : 1},
                                    req.session.passport.user.id,

                                ])
                    }).then(function (results) {
                        if (inserted > 0) {
                            res.json({
                                status : "ok",
                                insertId : team_id
                            });
                        }
                    }).catch(function (err) {
                        // console.log(err);
                    });
            }
        });

    router.post('/upload', [
            isLoggedIn,

        ],
        function (req, res, next) {
                        const errors = validationResult(req);
                      //  console.log(arguments);


            upload.single("lol")(req,res,function(err) {

                if(err) {
                    return res.json({
                        status : "error",
                        msg : err
                    });
                }
                sharp(req.file.path)
                    .resize(200, 200)
                    .toFile("public/uploads/" + req.file.filename, (err, info) => {

                        pool.query('UPDATE teams SET ? ' +
                            'WHERE ' +
                            'teams.id = ?',
                            [
                                {image : "/uploads/" + req.file.filename},
                                req.body.team_id,

                            ]).then(function () {
                            res.json({
                                image : "/uploads/" + req.file.filename,
                                status : "ok",
                            });
                        }).catch(function (err) {
                            // console.log(err);
                            res.json({
                                status : "error",
                            });
                        });
                    });
            });

            }
        );


    router.post('/apply', [
            isLoggedIn,
            check('team_id', 'The team_id field is required').exists().isLength({ min: 1 }),
        ],
        function (req, res, next) {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    errors: errors.mapped()
                });
            } else {
                var newDateObj;

                let office = {
                    team_id: req.body.team_id.trim(),
                    user_id: req.session.passport.user.id,
                    name: req.session.passport.user.name,
                };


                var sql1 = "SELECT * FROM teams_applies WHERE user_id = ? AND team_id = ?";

                pool
                    .query(sql1, [office.user_id, office.team_id])
                    .then(rows => {

                        if (rows.length == 0) {
                            return pool.query('INSERT INTO teams_applies SET ?', office);
                        } else {
                            return true;

                        }

                    }).then(results => {

                            res.json({
                                status : "ok",
                            });

                    }).catch(function (err) {
                    // console.log(err);
                    res.json({
                        status : "error",
                    });
                });
            }
        });
    router.post('/api/apply_team', [
            isLoggedIn,
            check('team_id', 'The team_id field is required').exists().isLength({ min: 1 }).custom((value, { req }) => {

                return new Promise((resolve, reject) => {

                    pool.query('SELECT * FROM tournaments_teams WHERE applier_id = ? OR team_id = ?', [
                        req.session.passport.user.id,
                        value,
                    ]).then(function (rows) {
                        if(rows.length > 0) {
                            return reject("Вы уже заявили 1 команду или эта команда уже заявлена.");
                        } else {
                            return resolve();
                        }
                    });
                });
            }),
            check('team_name', 'The team_name field is required').exists().isLength({ min: 1 }),
            check('tournament_id', 'The tournament_id field is required').exists().isLength({ min: 1 }).custom((value, { req }) => {

                return new Promise((resolve, reject) => {

                    pool.query('SELECT * FROM tournaments_participants WHERE user_id = ? AND tournament_id = ?', [
                        req.session.passport.user.id,
                        value,
                    ]).then(function (rows) {
                        if(rows.length > 0) {
                            return reject("Вы являетесь участником турнира. Вы не можете заявлять команды.");
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
                var newDateObj;

                let office = {
                    team_id: req.body.team_id.trim(),
                    team_name: req.body.team_name.trim(),
                    applier_id: req.session.passport.user.id,
                    tournament_id: req.body.tournament_id.trim(),
                    is_active: 1,
                };

                let participant = {
                    tournament_id: req.body.tournament_id,
                    user_id: req.session.passport.user.id,
                    start_rating: 1200,
                    team_board: 1,
                    team_id: req.body.team_id.trim(),
                };

                pool.query('INSERT INTO tournaments_teams SET ?', office)
                .then(function (results) {
                    console.log(results.insertId);
                    if (results.insertId) {
                        participant['team_id'] = results.insertId;
                        return pool.query('INSERT INTO tournaments_participants SET ?', participant);
                    } else {
                        return true;
                    }
                }).then(function (results) {
                    return pool.query("SELECT tt.id AS team_id,tt.team_name, tp.user_id, u.name,u.email FROM tournaments_teams" +
                        " AS tt LEFT JOIN tournaments_participants AS tp ON tp.team_id = tt.id LEFT JOIN users AS u " +
                        "ON tp.user_id = u.id WHERE tt.tournament_id = ? ORDER BY tt.id DESC, tp.team_board ASC", office.tournament_id)
                }).then(function (results) {
                    var teams = makeTeams(results);

                    app.mongoDB.collection("ttapplies").deleteMany({user_id: req.session.passport.user.id}, function () {});


                    res.json({
                        status : "ok",
                        teams : teams
                    });

                }).catch(function (err) {
                    console.log(err);
                    res.json({
                        status : "err",
                        msg : err
                    });
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
            teams[obj.team_id].applier_id = obj.applier_id;
            teams[obj.team_id].users = teams[obj.team_id].users || [];

            if (user.user_id) {
                teams[obj.team_id].users.push(user);
            }
        }
        return teams;
    }

    router.post('/approve', [
            isLoggedIn,
            check('team_id', 'The team_id field is required').exists().isLength({ min: 1 }),
        ],
        function (req, res, next) {
            const errors = validationResult(req);
            //console.log(errors);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    errors: errors.mapped()
                });
            } else {
                var newDateObj;

                let office = {
                    team_id: req.body.team_id.trim(),
                    user_id: req.body.user_id.trim(),
                };


                var sql1 = "DELETE FROM teams_applies WHERE user_id = ? AND team_id = ?";

                pool
                    .query(sql1, [office.user_id, office.team_id])
                    .then(rows => {

                        return pool.query('INSERT INTO teams_participants SET ?', office);

                    }).then(rows => {

                        return pool.query('SELECT COUNT(*) AS count FROM  teams_participants ' +
                            'WHERE ' +
                            'teams_participants.team_id = ?',
                            [
                                office.team_id,
                            ])
                    })
                    .then(rows => {
                       // console.log(rows);
                        return pool.query('UPDATE teams SET ? ' +
                            'WHERE ' +
                            'teams.id = ?',
                            [
                                {participants_count : rows[0].count},
                                office.team_id,

                            ])

                    }).then(rows => {

                        res.json({
                            status : "ok",
                        });

                    }).catch(function (err) {
                    // console.log(err);
                    res.json({
                        status : "error",
                    });
                });
            }
        });

    router.post('/dis_apply', [
            isLoggedIn,
            check('team_id', 'The team_id field is required').exists().isLength({ min: 1 }),
        ],
        function (req, res, next) {
            const errors = validationResult(req);
            //console.log(errors);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    errors: errors.mapped()
                });
            } else {
                var newDateObj;

                let office = {
                    team_id: req.body.team_id.trim(),
                    user_id: req.session.passport.user.id,
                };


                var sql1 = "DELETE FROM teams_applies WHERE user_id = ? AND team_id = ?";

                pool
                    .query(sql1, [office.user_id, office.team_id])
                    .then(rows => {

                            res.json({
                                status : "ok",
                            });

                    }).catch(function (err) {
                    // console.log(err);
                    res.json({
                        status : "error",
                    });
                });
            }
        });



    router.post('/leave', [
            isLoggedIn,
            check('team_id', 'The team_id field is required').exists().isLength({ min: 1 }),
        ],
        function (req, res, next) {
            const errors = validationResult(req);
           // console.log(errors);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    errors: errors.mapped()
                });
            } else {

                let office = {
                    team_id: req.body.team_id.trim(),
                    user_id: req.session.passport.user.id,
                };


                var sql1 = "DELETE FROM teams_participants WHERE user_id = ? AND team_id = ?";

                pool
                    .query(sql1, [office.user_id, office.team_id])
                    .then(rows => {

                            res.json({
                                status : "ok",
                            });

                    }).then(rows => {

                    return pool.query('SELECT COUNT(*) AS count FROM  teams_participants ' +
                        'WHERE ' +
                        'teams_participants.team_id = ?',
                        [
                            office.team_id,
                        ])
                })
                    .then(rows => {
                      //  console.log(rows);
                        return pool.query('UPDATE teams SET ? ' +
                            'WHERE ' +
                            'teams.id = ?',
                            [
                                {participants_count : rows[0].count},
                                office.team_id,

                            ])

                    }).catch(function (err) {
                    // console.log(err);
                    res.json({
                        status : "error",
                    });
                });
            }
        });


    router.post('/remove_participant', [
            isLoggedIn,
            check('team_id', 'The team_id field is required').exists().isLength({ min: 1 }),
            check('user_id', 'The user_id field is required').exists().isLength({ min: 1 }),
        ],
        function (req, res, next) {
            const errors = validationResult(req);
           // console.log(errors);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    errors: errors.mapped()
                });
            } else {

                let office = {
                    team_id: req.body.team_id.trim(),
                    user_id: req.body.user_id.trim(),
                };


                var sql1 = "DELETE FROM teams_participants WHERE user_id = ? AND team_id = ?";

                pool
                    .query(sql1, [office.user_id, office.team_id])
                    .then(rows => {

                            return pool.query('SELECT COUNT(*) AS count FROM  teams_participants ' +
                                'WHERE ' +
                                'teams_participants.team_id = ?',
                                [
                                    office.team_id,
                                ])
                        })
                    .then(rows => {
                       // console.log(rows);
                            return pool.query('UPDATE teams SET ? ' +
                                'WHERE ' +
                                'teams.id = ?',
                                [
                                    {participants_count : rows[0].count},
                                    office.team_id,

                                ])

                    }).then(rows => {

                            res.json({
                                status : "ok",
                            });

                    }).catch(function (err) {
                    // console.log(err);
                    res.json({
                        status : "error",
                    });
                });
            }
        });




    router.post('/assign_vice_captain', [
            isLoggedIn,
            check('team_id', 'The team_id field is required').exists().isLength({ min: 1 }),
            check('user_id', 'The user_id field is required').exists().isLength({ min: 1 }),
        ],
        function (req, res, next) {
            const errors = validationResult(req);
            //console.log(errors);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    errors: errors.mapped()
                });
            } else {

                let office = {
                    team_id: req.body.team_id.trim(),
                    user_id: req.body.user_id.trim(),
                };


                pool.query('UPDATE teams SET ? ' +
                    'WHERE ' +
                    'teams.id = ?',
                    [
                        {vice_captain_id : null},
                        office.team_id,

                    ]).then(rows => {

                        return pool.query('UPDATE teams SET ? ' +
                            'WHERE ' +
                            'teams.id = ?',
                            [
                                {vice_captain_id : office.user_id},
                                office.team_id,

                            ])
                    }).then(rows => {
                        //убираем вице капитана
                        return pool.query('UPDATE teams_participants SET ? ' +
                            'WHERE ' +
                            'teams_participants.team_title = ? AND ' +
                            'teams_participants.team_id = ?',
                            [
                                {team_title : 100},
                                2,
                                office.team_id,

                            ])
                    }).then(rows => {
                        //ставим вице капитана
                        return pool.query('UPDATE teams_participants SET ? ' +
                            'WHERE ' +
                            'teams_participants.user_id = ? AND ' +
                            'teams_participants.team_id = ?',
                            [
                                {team_title : 2},
                                office.user_id,
                                office.team_id,

                            ])
                    }).then(rows => {
                 //   console.log(rows);

                            res.json({
                                status : "ok",
                            });

                    }).catch(function (err) {
                        // console.log(err);
                        res.json({
                            status : "error",
                        });
                    });
            }
        });

    router.post('/update', [
            isLoggedIn,
            check('team_id', 'The team_id field is required').exists().isLength({ min: 1 }),
            check('name', 'The name field is required').exists().isLength({ min: 1 }),
            check('country', 'The name field is required').exists().isLength({ min: 1 }),
        ],
        function (req, res, next) {
            const errors = validationResult(req);
            //console.log(errors);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    errors: errors.mapped()
                });
            } else {

                let office = {
                    country: req.body.country,
                    description: req.body.description,
                    name: req.body.name,
                };


                pool.query('UPDATE teams SET ? ' +
                    'WHERE ' +
                    'teams.id = ?',
                    [
                        office,
                        req.body.team_id.trim(),

                    ]).then(rows => {
                  //  console.log(rows);

                            res.json({
                                status : "ok",
                                insertId : req.body.team_id
                            });

                    }).catch(function (err) {
                         console.log(err);
                        res.json({
                            status : "error",
                        });
                    });
            }
        });

    router.post('/assign_captain', [
            isLoggedIn,
            check('team_id', 'The team_id field is required').exists().isLength({ min: 1 }),
            check('user_id', 'The user_id field is required').exists().isLength({ min: 1 }),
        ],
        function (req, res, next) {
            const errors = validationResult(req);
            //console.log(errors);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    errors: errors.mapped()
                });
            } else {

                let office = {
                    team_id: req.body.team_id.trim(),
                    user_id: req.body.user_id.trim(),
                };


                pool.query('UPDATE teams SET ? ' +
                    'WHERE ' +
                    'teams.id = ?',
                    [
                        {creator_id : 0},
                        office.team_id,

                    ]).then(rows => {

                        return pool.query('UPDATE teams SET ? ' +
                            'WHERE ' +
                            'teams.id = ?',
                            [
                                {creator_id : office.user_id},
                                office.team_id,

                            ])
                    }).then(rows => {
                        //убираем капитана
                        return pool.query('UPDATE teams_participants SET ? ' +
                            'WHERE ' +
                            'teams_participants.team_title = ? AND ' +
                            'teams_participants.team_id = ?',
                            [
                                {team_title : 100},
                                1,
                                office.team_id,

                            ])
                    }).then(rows => {
                        //ставим капитана
                        return pool.query('UPDATE teams_participants SET ? ' +
                            'WHERE ' +
                            'teams_participants.user_id = ? AND ' +
                            'teams_participants.team_id = ?',
                            [
                                {team_title : 1},
                                office.user_id,
                                office.team_id,

                            ])
                    }).then(rows => {
                 //   console.log(rows);

                            res.json({
                                status : "ok",
                            });

                    }).catch(function (err) {
                        // console.log(err);
                        res.json({
                            status : "error",
                        });
                    });
            }
        });






    router.get('/:team_id',
        function (req, res, next) {
            let team_id = req.params.team_id;
            team_id = parseInt(team_id);
            let team, participants, is_participant = false, is_applied = false , applies = [];
            if (!isNaN(team_id)) {

                /**
                 * получаем иформацию о команде
                 */

                pool
                    .query('SELECT teams.*, users.name AS creator_name FROM teams LEFT JOIN users ON users.id = teams.creator_id WHERE teams.id = ?', team_id)
            .then(rows => {
                team = rows[0];
               // if (req.isAuthenticated()) {

                    /**
                     * если авторизован - проверяем участник ли
                     */

                    return pool
                        .query("SELECT ta.*, u.name, u.tournaments_rating FROM teams_participants ta LEFT JOIN users u ON u.id = ta.user_id WHERE team_id = ? ORDER BY ta.team_title", [team_id])
              //  } else {
                //    return false;
              //  }

            }).then(rows => {

                participants = rows;
               // console.log(participants);
                if (req.isAuthenticated()) {

                    for (var i = 0; i < participants.length; i++) {
                        var obj = participants[i];
                        if (obj.user_id === req.session.passport.user.id) {
                            is_participant = true;
                            break;
                        }
                    }
                }

                if (req.isAuthenticated() && is_participant) {
                    return true;
                } else if (req.isAuthenticated() && !is_participant) {

                    /**
                     * если авторизован и не участник - проверяем подавал ли заявку
                     */

                    return pool
                        .query("SELECT * FROM teams_applies WHERE user_id = ? AND team_id = ?", [req.session.passport.user.id, team_id])
                } else {
                    return true;
                }

            }).then(rows => {

                if (req.isAuthenticated() && !is_participant) {
                    is_applied = !!rows.length;
                }

                if (req.isAuthenticated() && (team.creator_id === req.session.passport.user.id || team.vice_captain_id === req.session.passport.user.id)) {

                    /**
                     * если авторизован и участник и владелец - проверяем есть ли заявки
                     */

                    return pool
                        .query("SELECT * FROM teams_applies WHERE team_id = ?", team_id)
                } else {
                    return true;
                }


            }).then(rows => {

                if (req.isAuthenticated() && (team.creator_id === req.session.passport.user.id || team.vice_captain_id === req.session.passport.user.id) && rows.length) {
               //     console.log(applies);

                    applies = rows;
                }
               // console.log(participants);
                return res.render('teams/show', {
                    team : team,
                    participants : participants,
                    is_applied : is_applied,
                    is_participant : is_participant,
                    applies : applies
                });

            }).catch(function (err) {
            // console.log(err);
                    res.render('error', {
                        message  : "Команда не найдена",
                    });
        });
            } else {
                res.render('error', {
                    message  : "Команда не найдена",
                });
            }
        });



    router.get('/:team_id/edit',
        [
            isLoggedIn,
            check('team_id', 'Вы не указали команду.').exists().isLength({ min: 1 }).custom((value, { req }) => {
                return new Promise((resolve, reject) => {

                    pool.query('SELECT * FROM teams WHERE id = ?', [
                        value.trim()
                    ]).then(function (rows) {
                        if(rows.length > 0 && (rows[0].creator_id != req.session.passport.user.id || rows[0].vice_captain_id != req.session.passport.user.id)) {
                            return reject("У вас нет прав редактировать команду");
                        } else {
                            return resolve();
                        }
                    });
                });
            })
        ],
        function (req, res, next) {
            let team_id = req.params.team_id;
            team_id = parseInt(team_id);
            let team, participants, is_participant = false, is_applied = false , applies = [];
            if (!isNaN(team_id)) {

                /**
                 * получаем иформацию о команде
                 */

                pool
                    .query('SELECT teams.*, users.name AS creator_name FROM teams LEFT JOIN users ON users.id = teams.creator_id WHERE teams.id = ?', team_id)
            .then(rows => {
                team = rows[0];

                return res.render('teams/edit', {
                    team : team,
                    countries : countries

                });

            }).catch(function (err) {
            // console.log(err);
                    res.render('error', {
                        message  : "Команда не найдена",
                    });
        });
            } else {
                res.render('error', {
                    message  : "Команда не найдена",
                });
            }
        });


        router.post('/applyToTeamInTournament',
        [
            isLoggedIn,
            check('tournament_id', 'The tournament_id field is required').exists().isLength({ min: 1 }),
            check('team_id', 'The team_id field is required').exists().isLength({ min: 1 }).custom((value, { req }) => {

                return new Promise((resolve, reject) => {

                    app.mongoDB.collection("ttapplies")
                        .find(
                            {
                                tournament_id : parseInt(req.body.tournament_id),
                                team_id : parseInt(value),
                                user_id : parseInt(req.session.passport.user.id),
                            }, function (err, cursor) {
                                let ttapplies = [];
                                cursor.forEach(function (game) {
                                    ttapplies.push(game);
                                }, function () {
                                    if(ttapplies.length > 0) {
                                        return reject("Нельзя отправлять несколько заявок в 1 команду");
                                    } else {
                                        return resolve();
                                    }
                                });
                            });
                });
            }),

        ],
        function (req, res, next) {
            let team_id = req.body.team_id;
            let tournament_id = req.body.tournament_id;

            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(422).json({
                    errors: errors.mapped()
                });
            } else {


                app.mongoDB.collection("ttapplies").insertOne({

                    "user_id": req.session.passport.user.id,
                    "team_id": parseInt(team_id),
                    "name": req.session.passport.user.name,
                    "team_name": req.body.team_name,
                    "tournament_id": parseInt(tournament_id),
                }, function () {

                    app.ROOMS.emit('t' + tournament_id,
                        JSON.stringify({
                            action : "get_apply"
                        }));

                    res.json({
                        status : "ok",
                    });
                });
            }
        });

        router.post('/api/decline_player',
        [
            isLoggedIn,
            check('tournament_id', 'The tournament_id field is required').exists().isLength({ min: 1 }),
            check('team_id', 'The team_id field is required').exists().isLength({ min: 1 }),
            check('user_id', 'The user_id field is required').exists().isLength({ min: 1 }),
        ],
        function (req, res, next) {
            let user_id = parseInt(req.body.user_id);
            let team_id = parseInt(req.body.team_id);
            let tournament_id = req.body.tournament_id;

            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(422).json({
                    errors: errors.mapped()
                });
            } else {

                app.ROOMS.emit('t' + tournament_id,
                    JSON.stringify({
                        action : "get_apply"
                    }));
                console.log(user_id);
                console.log(team_id);

                app.mongoDB.collection("ttapplies").deleteMany({user_id: user_id, team_id : team_id}, function () {
                    res.json({
                        status : "ok",
                    });
                });
            }
        });



        router.post('/chooseTeam',
        [
            isLoggedIn,
            check('tournament_id', 'The tournament field is required').exists().isLength({ min: 1 }),

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
                console.log(req.body.tournament_id);
                if (!isNaN(tournament_id)) {


                    /**
                     * получаем иформацию о команде
                     */

                    pool
                        .query('SELECT * FROM tournaments_teams WHERE tournament_id = ?', [req.body.tournament_id])
                        .then(rows => {
                            res.json({
                                status : "ok",
                                teams : rows
                            });

                        }).catch(function (err) {

                        res.json({
                            status : "error",
                            message  : "Команда не найдена",
                        });

                    });
                } else {
                    res.json({
                        status : "error",
                        message  : "Данные не найдены",
                    });
                }
            }
        });



        router.get('/api/get_ttapplies/:tournament_id/:team_id',
        [
            isLoggedIn,
            check('tournament_id', 'The tournament field is required').exists().isLength({ min: 1 }),
            check('team_id', 'The team_id field is required').exists().isLength({ min: 1 }),

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
                let team_id = req.params.team_id;
                team_id = parseInt(team_id);

                console.log(req.params.tournament_id);
                console.log(team_id);

                if (!isNaN(tournament_id)) {


                    /**
                     * получаем иформацию о команде
                     */
                    return app.mongoDB.collection("ttapplies")
                        .find(
                            {
                                tournament_id : tournament_id,
                                team_id : team_id,
                            }, function (err, cursor) {
                                let ttapplies = [];
                                cursor.forEach(function (game) {
                                    ttapplies.push(game);
                                }, function () {
                                    res.json({
                                        status : "ok",
                                        ttapplies : ttapplies
                                    });
                                });

                    })

                } else {
                    res.json({
                        status : "error",
                        message  : "Данные не найдены",
                    });
                }
            }
        });


        router.get('/api/get_ttapplies/:tournament_id',
        [
            check('tournament_id', 'The tournament field is required').exists().isLength({ min: 1 }),

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


                    /**
                     * получаем иформацию о команде
                     */

                     app.mongoDB.collection("ttapplies")
                            .find(
                                {
                                    tournament_id : tournament_id,
                                }, function (err, cursor) {

                                    let ttapplies = [];
                                    cursor.forEach(function (game) {
                                        ttapplies.push(game);

                                    }, function () {
                                        res.json({
                                            status : "ok",
                                            ttapplies : ttapplies
                                        });
                                    });

                                })




                } else {
                    res.json({
                        status : "error",
                        message  : "Данные не найдены",
                    });
                }
            }
        });

router.get('/api/get_teams/:user_id',
    check('user_id', 'The user_id field is required').exists().isLength({ min: 1 }),

    function (req, res, next) {

            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(422).json({
                    errors: errors.mapped()
                });
            } else {

                let user_id = req.params.user_id;
                user_id = parseInt(user_id);


                if (!isNaN(user_id)) {
                        pool
                            .query('SELECT * FROM teams WHERE creator_id = ? OR vice_captain_id = ?', [user_id, user_id])
                            .then(rows => {
                                res.json({
                                    status : "ok",
                                    teams : rows
                                });

                            }).catch(function (err) {

                            res.json({
                                status : "error",
                                message  : "Команда не найдена",
                            });

                        });

                } else {
                    res.json({
                        status : "error",
                        message  : "Данные не найдены",
                    });
                }



            }
        });





    return router;

}
