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






    router.get('/:team_id',
        function (req, res, next) {
            let team_id = req.params.team_id;
            team_id = parseInt(team_id);
            var team, participants, is_in = false;
            if (!isNaN(team_id)) {
                pool
                    .query('SELECT teams.*, users.name AS creator_name FROM teams LEFT JOIN users ON users.id = teams.creator_id WHERE teams.id = ?', team_id)


                    .then(rows => {
                        team = rows[0];

                        if (rows.length) {

                            return res.render('teams/show', {
                                team : team
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
                    message  : "Турнир не найден",
                });
            }
        });





    return router;

}
