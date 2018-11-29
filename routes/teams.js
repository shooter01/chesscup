var express = require('express');
var router = express.Router();
const {isLoggedIn} = require('./middlewares');
const { check, validationResult } = require('express-validator/check');
const countries = require('./countries');

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
            var sql1 = "SELECT teams.* FROM teams WHERE is_hidden = 0 ORDER BY id DESC LIMIT ?,?";

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
                console.log(err);
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
            check('title', 'The title field is required').exists().isLength({ min: 1 }),
            check('country', 'The country field is required').exists().isLength({ min: 1 }),
        ],
        function (req, res, next) {
            const errors = validationResult(req);
            console.log(errors);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    errors: errors.mapped()
                });
            } else {
                var newDateObj;

                let office = {
                    name: req.body.title.trim(),
                    country: req.body.country.trim(),
                    created_at: new Date(),
                    image: '/images/user.png',
                    creator_id: req.session.passport.user.id,
                };


                pool.query('INSERT INTO teams SET ?', office).then(function (results) {
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


    router.post('/apply', [
            isLoggedIn,
            check('team_id', 'The team_id field is required').exists().isLength({ min: 1 }),
        ],
        function (req, res, next) {
            const errors = validationResult(req);
            console.log(errors);
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
                    console.log(err);
                });
            }
        });



    router.post('/approve', [
            isLoggedIn,
            check('team_id', 'The team_id field is required').exists().isLength({ min: 1 }),
        ],
        function (req, res, next) {
            const errors = validationResult(req);
            console.log(errors);
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

    router.post('/dis_apply', [
            isLoggedIn,
            check('team_id', 'The team_id field is required').exists().isLength({ min: 1 }),
        ],
        function (req, res, next) {
            const errors = validationResult(req);
            console.log(errors);
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
                    console.log(err);
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
                        .query("SELECT ta.*, u.name, u.tournaments_rating FROM teams_participants ta LEFT JOIN users u ON u.id = ta.user_id WHERE team_id = ?", [team_id])
              //  } else {
                //    return false;
              //  }

            }).then(rows => {

                participants = rows;

                is_participant = !!rows.length;

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

                if (req.isAuthenticated() && team.creator_id === req.session.passport.user.id) {

                    /**
                     * если авторизован и участник и владелец - проверяем есть ли заявки
                     */

                    return pool
                        .query("SELECT * FROM teams_applies WHERE team_id = ?", team_id)
                } else {
                    return true;
                }


            }).then(rows => {

                if (req.isAuthenticated() && team.creator_id == req.session.passport.user.id && rows.length) {
                    console.log(applies);

                    applies = rows;
                }
                console.log(participants);
                return res.render('teams/show', {
                    team : team,
                    participants : participants,
                    is_applied : is_applied,
                    is_participant : is_participant,
                    applies : applies
                });

            }).catch(function (err) {
            console.log(err);
        });
            } else {
                res.render('error', {
                    message  : "Турнир не найден",
                });
            }
        });





    return router;

}
