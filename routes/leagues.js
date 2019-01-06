var express = require('express');
var router = express.Router();
const {isLoggedIn} = require('./middlewares');
const { check, validationResult } = require('express-validator/check');
const countries = require('./countries');
const sharp = require('sharp');
const path = require('path');
const nl2br  = require('nl2br');

const multer = require('multer');
const crypto = require('crypto');
const mime = require('mime');

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


        pool.query("SELECT COUNT(*) as count FROM leagues WHERE is_hidden = 0", function (err, result, fields) {
            var sql1 = "SELECT leagues.* FROM leagues WHERE is_hidden = 0 LIMIT ?,?";

            pool
                .query(sql1, [limit_start, limit])
                .then(rows => {

                    var total = result[0].count,
                        pageSize = limit,
                        pageCount = total / pageSize;


                    res.render('leagues/leagues', {
                        countries : countries,
                        count: result[0].count,
                        total: total,
                        pageSize: pageSize,
                        currentPage: page,
                        pageCount: pageCount,
                        leagues : rows,

                    });


                }).catch(function (err) {
                // console.log(err);
                res.json({
                    status : "error",
                    err : err,
                });
            });
        });
    });


    router.get('/create', [isLoggedIn], function (req, res, next) {
        res.render('leagues/create', {
            countries : countries
        });
    });


    router.post('/create', [
            isLoggedIn,
            check('title', 'The title field is required').exists().isLength({ min: 1 }).custom((value, { req }) => {

                return new Promise((resolve, reject) => {

                    pool.query('SELECT * FROM leagues WHERE creator_id = ?', [
                        req.session.passport.user.id
                    ]).then(function (rows) {
                        if(rows.length > 0) {
                            return reject("Нельзя владеть несколькими лигами. Вы являетесь владельцем лиги : " + rows[0].name);
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
                };


                pool.query('INSERT INTO leagues SET ?', office)
                    .then(function (results) {
                        team_id = results.insertId;
                        return true;
                    }).then(function (results) {
                            return pool.query('UPDATE users SET ? ' +
                                'WHERE ' +
                                'users.id = ?',
                                [
                                    {is_league_owner : team_id},
                                    req.session.passport.user.id,

                                ])
                    }).then(function (results) {
                        if (team_id > 0) {
                            res.json({
                                status : "ok",
                                insertId : team_id
                            });
                        } else {
                            res.json({
                                status : "error",
                            });
                        }
                    }).catch(function (err) {
                         console.log(err);
                            res.json({
                                status : "error",
                                err : err
                            });
                    });
            }
        });


    router.post('/seasons/create', [
            isLoggedIn,
            check('league_id', 'The league_id field is required').exists().isLength({ min: 1 }).custom((value, { req }) => {

                return new Promise((resolve, reject) => {

                    pool.query('SELECT * FROM leagues_seasons WHERE league_id = ? AND is_over = ?',
                        [value, 0]
                    ).then(function (rows) {
                        if(rows.length > 0) {
                            return reject("У вас есть незавершенные сезоны. Завершите все сезоны.");
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


                pool.query('SELECT * FROM leagues_seasons WHERE league_id = ?',
                    [req.body.league_id.trim(), 0]
                ).then(function (rows) {


                    let office = {
                        name: "Сезон " + (rows.length + 1),
                        description: "",
                        league_id: req.body.league_id.trim(),
                        creator_id: req.session.passport.user.id,
                        created_at: new Date(),
                        is_over: 0,
                    };


                    return pool
                        .query('INSERT INTO leagues_seasons SET ?', office)
                        .then(results => {
                            res.json({
                                status: "ok",
                            });

                        })
                }).catch(function (err) {
                    console.log(err);
                    res.json({
                        status: "error",
                    });
                });
            }
        });

    router.post('/seasons/end', [
            isLoggedIn,
            check('season_id', 'Вы не указали сезон.').exists().isLength({ min: 1 }).custom((value, { req }) => {
                return new Promise((resolve, reject) => {

                    pool.query('SELECT * FROM leagues_seasons WHERE id = ?', [
                        value.trim()
                    ]).then(function (rows) {
                        if(rows.length > 0 && (rows[0].creator_id != req.session.passport.user.id)) {
                            return reject("У вас нет прав редактировать этот сезон");
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


                pool.query('UPDATE leagues_seasons SET ? ' +
                    'WHERE ' +
                    'leagues_seasons.id = ?',
                    [
                        {is_over : 1},
                        req.body.season_id,

                    ]).then(function () {
                        res.json({
                            status : "ok",
                        });
                }).catch(function (err) {
                     console.log(err);
                    res.json({
                        status : "error",
                    });
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

                        pool.query('UPDATE leagues SET ? ' +
                            'WHERE ' +
                            'leagues.id = ?',
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





    router.post('/update', [
            isLoggedIn,
            check('team_id', 'The team_id field is required').exists().isLength({ min: 1 }),
            check('name', 'The name field is required').exists().isLength({ min: 1 }),
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

                let office = {
                    country: req.body.country,
                    description: req.body.description,
                    name: req.body.name,
                };


                pool.query('UPDATE leagues SET ? ' +
                    'WHERE ' +
                    'leagues.id = ?',
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


    router.post('/seasons/update', [
            isLoggedIn,
            check('season_id', 'The season_id field is required').exists().isLength({ min: 1 }),
            check('description', 'The description field is required').exists().isLength({ min: 1 }),
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
                    description: req.body.description,
                };


                pool.query('UPDATE leagues_seasons SET ? ' +
                    'WHERE ' +
                    'leagues_seasons.id = ?',
                    [
                        office,
                        req.body.season_id.trim(),

                    ]).then(rows => {
                  //  console.log(rows);

                            res.json({
                                status : "ok",
                            });

                    }).catch(function (err) {
                         console.log(err);
                        res.json({
                            status : "error",
                        });
                    });
            }
        });






    router.get('/:team_id/season/:season_id',
        function (req, res, next) {
            let team_id = req.params.team_id;
            let season_id = req.params.season_id;
            team_id = parseInt(team_id);
            season_id = parseInt(season_id);
            let team, season, tournaments = [], participants = [];
            if (!isNaN(team_id) && !isNaN(season_id)) {

                /**
                 * получаем иформацию о команде
                 */

                pool
                    .query('SELECT leagues.*, users.name AS creator_name FROM leagues LEFT JOIN users ON users.id = leagues.creator_id WHERE leagues.id = ?', team_id)
            .then(rows => {
                team = rows;
                return pool
                    .query("SELECT * FROM leagues_seasons WHERE id = ?", season_id)
            }).then(rows => {
                    season = rows[0];
                    return pool
                        .query("SELECT * FROM tournaments WHERE season_id = ?", season_id)
            }).then(rows => {
                    tournaments = rows;
                    let sql = "SELECT ts.*, users.name  FROM leagues_scores ts LEFT JOIN users ON users.id = ts.user_id WHERE ts.league_id = ? AND ts.season_id = ?";
                    return pool
                        .query(sql, [team_id, season_id])

                }).then(function (rows) {
                    participants = rows;
                    season.des = nl2br(season.description);

                    if (team.length) {
                    return res.render('leagues/season_show', {
                        league : team[0],
                        season : season,
                        participants : participants,
                        tournaments : tournaments,
                    });
                } else {
                    res.render('error', {
                        message  : "Сезон не найден",
                    });
                }



            }).catch(function (err) {
                console.log(err);
                    res.render('error', {
                        message  : "Сезон не найден",
                    });
        });
            } else {
                res.render('error', {
                    message  : "Сезон не найден",
                });
            }
        });

    router.get('/:team_id',
        function (req, res, next) {
            let team_id = req.params.team_id;
            team_id = parseInt(team_id);
            let team, participants, seasons = [];
            if (!isNaN(team_id)) {

                /**
                 * получаем иформацию о команде
                 */

                pool
                    .query('SELECT leagues.*, users.name AS creator_name FROM leagues LEFT JOIN users ON users.id = leagues.creator_id WHERE leagues.id = ?', team_id)
            .then(rows => {
                team = rows;
                return pool
                    .query("SELECT * FROM leagues_seasons WHERE league_id = ?", team_id)
            }).then(rows => {
                    seasons = rows;
            }).then(function () {
                    team[0].description = nl2br(team[0].description);
                if (team.length) {
                    return res.render('leagues/show', {
                        league : team[0],
                        seasons : seasons,
                    });
                } else {
                    res.render('error', {
                        message  : "Лига не найдена1",
                    });
                }



            }).catch(function (err) {
                console.log(err);
                    res.render('error', {
                        message  : "Лига не найдена1",
                    });
        });
            } else {
                res.render('error', {
                    message  : "Лига не найдена",
                });
            }
        });



    router.get('/:team_id/edit',
        [
            isLoggedIn,
            check('team_id', 'Вы не указали лигу.').exists().isLength({ min: 1 }).custom((value, { req }) => {
                return new Promise((resolve, reject) => {

                    pool.query('SELECT * FROM leagues WHERE id = ?', [
                        value.trim()
                    ]).then(function (rows) {
                        if(rows.length > 0 && (rows[0].creator_id != req.session.passport.user.id)) {
                            return reject("У вас нет прав редактировать эту лигу");
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
                    .query('SELECT leagues.*, users.name AS creator_name FROM leagues LEFT JOIN users ON users.id = leagues.creator_id WHERE leagues.id = ?', team_id)
            .then(rows => {
                league = rows[0];
                league.description = league.description;
                return res.render('leagues/edit', {
                    team : league,
                    countries : countries

                });

            }).catch(function (err) {
             console.log(err);
                    res.render('error', {
                        message  : "Ошибка",
                    });
        });
            } else {
                res.render('error', {
                    message  : "Ошибка",
                });
            }
        });





    return router;

}
