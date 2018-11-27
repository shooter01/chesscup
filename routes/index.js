var express = require('express');
// var mysql = require('mysql-promise');
var router = express.Router();
const moment = require('moment');
const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');
const countries = require('./countries');
var api_key = 'key-b8979f45de416021750386d336a5e8de';
var domain = 'englando.com';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
var Elo = require('arpad');

var uscf = {
    default: 20,
    2100: 15,
    2400: 10
};

var min_score = 100;
var max_score = 10000;

var elo = new Elo(uscf, min_score, max_score);


module.exports = function (app, passport, pool) {
  /* GET home page. */
    router.get('/', function(req, res) {


        pool.query('SELECT * FROM tournaments ORDER BY tournaments.id DESC LIMIT 10').then(function (results) {

            res.render('index', {
                tournaments : results,
                moment: moment,
                title: 'Tournaments',
                countries : countries

            });

        }).catch(function (err) {
            console.log(err);
        });
    });


    router.get('/chat/:chat_id/messages',
        function (req, res, next) {
            let chat_id = req.params.chat_id;
            var tourney, participants, is_in = false;
            if (chat_id) {

                app.mongoDB.collection("chat").find({chat_id: chat_id}, function(err, cursor) {
                    let messages = [];
                    cursor.forEach(function (message) {
                        messages.push(message);
                    }, function () {
                        res.json({
                            status : "ok",
                            messages : JSON.stringify(messages)
                        });
                    });
                });
            } else {
                res.json({
                    status : "error",
                    messages : []
                });
            }
        });


    router.post('/signup', [


        check('username')
            .isEmail().withMessage('The email field is required')
            .trim()
            .normalizeEmail(),
        check('name', 'The name field is required').exists().isLength({ min: 1 }),
        check('password', 'The password field is required').exists().isLength({ min: 1 }),
        check('passwordConfirmation', 'Check password confirmation')
            .exists()
            .isLength({ min: 1 })
            .custom((value, { req }) => value === req.body.password),
        // check('g-recaptcha-response', 'Подтвердите, что вы не робот').exists().isLength({ min: 1 }),


    ], function (req, res, next) {

        var isAjaxRequest = req.xhr;


        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            //return res.status(422).json({ errors: errors.mapped() });

                    res.status(422).render('signup', {
                        errors: errors.mapped(),
                        username : req.body.username,
                        name : req.body.name,
                    });


        } else {


            pool
                .query('SELECT * FROM users WHERE email = ? ', req.body.username)
                .then(rows => {
                    if (rows.length === 0) {
                        let theme = {
                            email: req.body.username.trim(),
                            password: req.body.password.trim(),
                            name: req.body.name.trim(),
                            rating: 1200,
                            tournaments_rating: 1200,
                        };
                        if (theme.school_id == 'null') {
                            theme.school_id = null;
                        }
                        var insertId, user_id;
                        pool.query('INSERT INTO users SET ?', theme).then(function (results) {
                            if (results.insertId > 0) {
                                //console.log(theme.role == 100 && theme.school_id == "null");
                                //console.log(theme.school_id == "null");
                                insertId = (theme.school_id == null) ? results.insertId : theme.school_id;
                                user_id = results.insertId;
                                return pool.query('UPDATE users SET school_id = ? WHERE id = ?', [insertId, insertId]);
                            }

                        }).then(function (results) {
                            if (insertId && theme.role > 99) {
                                return pool.query('INSERT INTO offices SET ?', {
                                    text : "Мои ученики",
                                    school_id : user_id,
                                    is_office : 0,
                                    is_common : true,
                                    owner_id : user_id,
                                });
                            } else {
                                return true;
                            }

                        }).then(function (result) {
                            if (isAjaxRequest) {
                                res.json({
                                    status : "ok"
                                });
                            } else {
                                res.render('login', {
                                    showTest : null,
                                    "signup": "Use your email and password to login",
                                });
                            }
                        }).catch(function (err) {
                            //console.log(err);
                        });

                    } else {
                        if (isAjaxRequest) {
                            res.json({
                                status : "error",
                                errors: {
                                    "username" : {
                                        "msg" : "Email already exists"
                                    }
                                },
                            });
                        } else {

                            pool.query('SELECT * FROM users WHERE role = 1000')
                                .then(rows => {
                                    return res.status(422).render('signup', {
                                        errors: {
                                            "username" : {
                                                "msg" : "Email already exists"
                                            }
                                        },
                                        username : req.body.username,
                                        name : req.body.name,
                                        schools : rows,
                                        school_id : req.body.school_id,
                                        role : req.body.role,

                                    });
                                }).catch((err) => {
                                console.log(err);
                            });

                        }

                    }
                }).then(function (rows) {
                //console.log(rows);
            }).catch(function (err) {
                console.log(err);
            });
        }

    });

    router.get('/login', function (req, res) {
        // render the page and pass in any flash data if it exists
        var showTest = null;
        if (process.env.PORT == 4747) {
            showTest = true;
        }

        res.render('login', {message : req.flash("error")[0], showTest : showTest});
    });

    router.get('/password/reset', function (req, res) {
        res.render('reset');
    });

    router.post('/password/email', [
        check('email')
            .isEmail().withMessage('The email field is required')
            .trim()
            .normalizeEmail()
    ],function (req, res) {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                errors: errors.mapped()
            });
        } else {
            pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", req.body.email.trim())
                .then(rows => {
                    console.log(rows);
                    if (rows.length > 0) {
                        var data = {
                            from: 'chesscup.org <no-reply@chesscup.org>',
                            to: rows[0].email,
                            subject: 'Password recovery',
                            text: 'Password : ' + rows[0].password
                        };

                        mailgun.messages().send(data, function (error, body) {
                            console.log(error);
                            res.json({
                                status : "ok",
                            });
                        });


                    } else {
                        res.json({
                            status : "error",
                            msg: "Email not found"
                        });
                    }

                }).catch((err) => {
                console.log(err);
                res.json({
                    status : "error",
                    msg : err
                });
            });
        }




    });

    router.get('/signup', function (req, res) {
        // render the page and pass in any flash data if it exists

        pool.query('SELECT * FROM users WHERE role = 1000')
            .then(rows => {
                res.render('signup', {
                    schools : rows,
                    message : req.flash("error")[0]
                });
            }).catch((err) => {
            console.log(err);
        });
    });


    router.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/login');
    });

    router.post('/login',
        passport.authenticate('local-login', {
            successRedirect: '/',
            failureRedirect: '/login',
            failureFlash: true,
            session: true
        })
    );

    return router;
};
