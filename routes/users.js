var express = require('express');
var router = express.Router();
const {isLoggedIn} = require('./middlewares');
const { check, validationResult } = require('express-validator/check');
const countries = require('./countries');


const path = require('path');
const sharp = require('sharp');
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

  /* GET users listing. */
    router.get('/', function (req, res) {


        var page = req.query.page || null;
        var limit_start = 0, limit = 20;
        page = parseInt(page, 10);
        if (typeof page === "undefined" || !Number.isInteger(page)) {
            page = 1;
        }
        limit_start = page * limit - limit;


        pool.query("SELECT COUNT(*) as count FROM users WHERE is_hidden = 0", function (err, result, fields) {
            var sql1 = "SELECT users.* FROM users WHERE is_hidden = 0 AND id = school_id ORDER BY tournaments_rating DESC LIMIT ?,?";

            pool
                .query(sql1, [limit_start, limit])
                .then(rows => {

                    var total = result[0].count,
                        pageSize = limit,
                        pageCount = total / pageSize;

                    res.render('user/users', {
                        users : rows,
                        countries : countries,
                        count: result[0].count,
                        online : app.globalPlayers,
                        total: total,
                        pageSize: pageSize,
                        currentPage: page,
                        pageCount: pageCount,

                    });
                }).catch(function (err) {
                console.log(err);
            });
        });




    });


    router.post('/save_user', [
        isLoggedIn,
        // check('password', 'Вы не указали пароль').exists().isLength({min: 1}),
        check('name', 'Вы не указали имя').exists().isLength({min: 1}),
        /* check('email', 'Вы не указали email').exists().isLength({min: 1}).custom((value, {req}) => {
            console.log(pool.query);

            return new Promise((resolve, reject) => {
                pool.query('SELECT * FROM users WHERE email = ?', value.trim()).then(function (rows) {
                    console.log(rows.length);
                    if (rows.length !== 0) {
                        return reject("Такой Email уже есть в системе");
                    } else {
                        return resolve();
                    }
                })

            });

        })*/
    ], function (req, res, next) {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            //return res.status(422).json({ errors: errors.mapped() });
            return res.status(422).json({
                "status": "error",
                errors: errors.mapped(),
            });
        }

        let insertId;

        let theme = {
            name: req.body.name,
            email:  generateEmail(),
            password: generatePassword(),
            role: req.body.role,
            rating: req.body.rating || 1200,
            tournaments_rating: req.body.tournaments_rating || 1200,
            school_id: req.session.passport.user.school_id,
        };
        var theme2 = req.body;

        pool.query('INSERT INTO users SET ?', theme).then(function (results) {
            insertId = results.insertId;
            let info = {
                sex: theme2.sex,
                parent_name: theme2.parent_name,
                phone: theme2.phone,
                district: theme2.district,
                birth_date: theme2.birth_date,
                user_id: insertId
            };

            return pool.query('INSERT INTO students_info SET ?', info);

        }).then(function (results) {
            let teacher = {
                teacher_id: req.body.teacher_id || req.session.passport.user.id,
                student_id: insertId,
            };
            return pool.query('INSERT INTO students SET ?', teacher)
        }).then(function (results) {
            res.json({
                "status": "ok",
                "user_id": insertId,
                "rating": theme.rating,
                "tournaments_rating": theme.tournaments_rating,
            });
        }).catch(function (err) {
            console.log(err);
        });

    });


    router.post('/hide', [
        isLoggedIn,
        check('user_id', 'Вы не указали пользователя').exists().isLength({min: 1}),

    ], function (req, res, next) {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            //return res.status(422).json({ errors: errors.mapped() });
            return res.status(422).json({
                "status": "error",
                errors: errors.mapped(),
            });
        }

        let insertId;

        let office = {
          is_hidden : 1
        };

        pool.query('UPDATE users SET ? ' +
            'WHERE ' +
            'users.id = ?',
            [
                office,
                req.body.user_id,

            ]).then(function (results) {
            res.json({
                status : "ok",
            });
        }).catch(function (err) {
            console.log(err);
        });

    });


    router.get('/stat/:user_id', function (req, res, next) {
        let ratings, student, tournament_ratings = [], teacher_info = {};
        pool
            .query('SELECT * FROM solved WHERE user_id = ? AND changed_rating IS NOT NULL GROUP BY date', [req.params.user_id])
            .then(rows => {
                ratings = rows;
                return pool
                    .query('SELECT users.* FROM users WHERE users.id = ?', [req.params.user_id])
            }).then(rows => {
            student = rows;
            return pool
                .query('SELECT users.* FROM students LEFT JOIN users ON students.teacher_id = users.id WHERE students.student_id = ?', [req.params.user_id, req.params.user_id])
        }).then(rows => {
            teacher_info = rows;
            return pool
                .query('select tr.p1_id,tr.p2_id,tr.p1_won, tr.p1_scores,tr.p1_rating_for_history,tr.created_at,tr.p2_rating_for_history,tr.p2_won, tr.p2_scores, tr.tour FROM tournaments_results tr WHERE tr.p1_id = ? OR tr.p2_id = ? ORDER BY tr.id DESC LIMIT 20', [req.params.user_id, req.params.user_id])
        }).then(rows => {


            for (var i = 0; i < rows.length; i++) {
                var obj = rows[i];
                var temp = {};
                //console.log(obj);

                if (obj.p1_id == req.params.user_id) {
                    temp.created_at = obj.created_at;
                    temp.rating = obj.p1_rating_for_history;
                    tournament_ratings.push(temp);
                } else if (obj.p2_id == req.params.user_id) {
                    temp.created_at = obj.created_at;
                    temp.rating = obj.p2_rating_for_history;
                    tournament_ratings.push(temp);
                }
            }
            //console.log(tournament_ratings);

            res.render('administrators/stat', {
                ratings : JSON.stringify(ratings),
                teacher_info : teacher_info,
                student : student,
                tournament_ratings : JSON.stringify(tournament_ratings),
            });
        }).catch(function (err) {
            console.log(err);
        });
    });




    router.get('/:user_id', function (req, res, next) {
        let games = [], tournaments = [], profile;
        let user_id = req.params.user_id;
        user_id = parseInt(user_id);
        if (!isNaN(user_id)) {
            pool
                .query('SELECT * FROM users WHERE id = ?', user_id)
                .then(rows => {
                    profile = rows[0];

                    if (rows.length > 0) {
                        return pool
                            .query('SELECT tr.*, u1.name AS p1_name,u1.tournaments_rating AS p1_rating, u2.name AS p2_name, u2.tournaments_rating AS p2_rating FROM tournaments_results tr LEFT JOIN users u1 ON tr.p1_id = u1.id LEFT JOIN  users u2 ON tr.p2_id = u2.id WHERE (tr.p2_id = ? OR tr.p1_id = ?) LIMIT 5', [user_id, user_id]).then(rows => {
                                games = rows;

                                return pool
                                    .query('SELECT tp.*, t.title, t.id AS t_id FROM tournaments_participants tp RIGHT JOIN tournaments t ON t.id = tp.tournament_id WHERE tp.user_id = ? LIMIT 5', user_id)
                            }).then(rows => {
                                tournaments = rows;

                                return app.mongoDB.collection("visits").findOne({user_id: user_id})
                            }).then(rows => {
                                profile.visited_at = (rows) ? rows.visit_at.getTime() : null;
                                profile.current = new Date().getTime();

                                res.render('user/profile', {
                                    profile  : profile,
                                    games  : games,
                                    tournaments  : tournaments,
                                    countries : countries
                                });
                            })



                    } else {
                        res.render('error', {
                            message  : "Пользователь не найден",
                            error  : "Пользователь не найден",
                        });
                    }


                })
                .then(rows => {



                }).catch(function (err) {
                    console.log(err);
                });
        } else {
            res.render('error', {
                message  : "Пользователь не найден",
            });
        }
    });


    router.get('/:user_id/edit',
        [
            isLoggedIn,
            check('user_id', 'Вы не указали юзера.').exists().isLength({ min: 1 }).custom((value, { req }) => {
                return new Promise((resolve, reject) => {


                    if(value != req.session.passport.user.id) {
                        return reject("Ошибка доступа");
                    } else {
                        return resolve();
                    }

                });
            })
        ]
        ,function (req, res, next) {


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
                let ratings, student, tournament_ratings = [], teacher_info = {};
                let user_id = req.params.user_id;
                user_id = parseInt(user_id);
                if (!isNaN(user_id)) {
                    pool
                        .query('SELECT * FROM users WHERE id = ?', user_id)
                        .then(rows => {

                            if (rows.length > 0) {

                                res.render('user/edit', {
                                    profile  : rows[0],
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


    router.post('/upload', [
            isLoggedIn,
        ],
        function (req, res, next) {
            const errors = validationResult(req);
              console.log(req.file);


            try {
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

                            pool.query('UPDATE users SET ? ' +
                                'WHERE ' +
                                'users.id = ?',
                                [
                                    {image : "/uploads/" + req.file.filename},
                                    req.session.passport.user.id,

                                ]).then(function () {

                                req.session.passport.user.image = "/uploads/" + req.file.filename;


                                res.json({
                                    image : "/uploads/" + req.file.filename,
                                    status : "ok",
                                });
                            }).catch(function (err) {
                                console.log(err);
                                res.json({
                                    status : "error",
                                });
                            });
                        });
                });
            } catch(e){

            }


        }
    );

    router.post('/update', [
            // check('secret', 'The secret field is required').exists().isLength({ min: 1 }),
            check('email', 'The email field is required').exists().isLength({ min: 1 }).isEmail(),
        ],
        function (req, res, next) {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {

                return res.status(422).json({
                    errors: errors.mapped()
                });
            } else {

                let office = {
                    email: req.body.email.trim(),
                    lichess: req.body.lichess.trim(),
                    country: req.body.country.trim(),
                };

                pool.query('UPDATE users SET ? ' +
                    'WHERE ' +
                    'users.id = ?',
                    [
                        office,
                        req.session.passport.user.id,

                    ]).then(function (results) {
                            res.json({
                                status : "ok",
                            });
                }).catch(function (err) {
                    console.log(err);
                });
            }
    });


    return router;

}
