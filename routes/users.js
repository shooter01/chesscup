var express = require('express');
var router = express.Router();
const {isLoggedIn} = require('./middlewares');
const { check, validationResult } = require('express-validator/check');


module.exports = function(app, passport, pool) {

  /* GET users listing. */
    router.get('/', function (req, res) {
        res.send('respond with a resource');
    });


    router.post('/save_user', [
        isLoggedIn,
        check('password', 'Вы не указали пароль').exists().isLength({min: 1}),
        check('name', 'Вы не указали имя').exists().isLength({min: 1}),
        check('email', 'Вы не указали email').exists().isLength({min: 1}).custom((value, {req}) => {
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

        })
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
            email: req.body.email,
            password: req.body.password,
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
    return router;

}
