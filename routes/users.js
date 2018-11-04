var express = require('express');
var router = express.Router();
const {isLoggedIn} = require('./middlewares');
const { check, validationResult } = require('express-validator/check');

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
    return retVal + "@chessround.com";
}

module.exports = function(app, passport, pool) {

  /* GET users listing. */
    router.get('/', function (req, res) {
        res.send('respond with a resource');
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


    return router;

}
