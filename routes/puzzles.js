var express = require('express');
var router = express.Router();
const {isLoggedIn} = require('./middlewares');
const { check, validationResult } = require('express-validator/check');
const moment = require('moment');
const countries = require('./countries');
const ObjectId = require('mongodb').ObjectId;

const DRAW_TEAM = require('./draw_team_functions');

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




    router.post('/get',
        [
            check('h', 'The puzzles field is required').exists().isLength({ min: 1 })
        ]
        ,function (req, res) {


            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(422).json({
                    errors: errors.mapped()
                });
            } else {
                let start = req.body.h;
                let tasks = [];
                let hash = req.body.hash;
                start = parseInt(start); //LIMIT ?, 100 , start*10
                if (!isNaN(start)) {
                   pool.query('SELECT id, fen, moves, end_rating AS r FROM sb_puzzles ORDER BY r LIMIT ?, 100', start*100)
                   //  pool.query('SELECT id, fen, moves, end_rating AS r FROM sb_puzzles WHERE id = 1924')
                        .then(rows => {
                            rows = shuffle(rows);
                            tasks = rows.slice(0, 10);

                           /* for (var i = 0; i < 30; i++) {
                                var obj = rows[0];
                                tasks.push(obj);
                            }*/
                            const user_image = req.session.passport.user.image; //user_id

                            if (typeof hash === "undefined") {
                                return app.mongoDB.collection("puzzle_rush").insertOne(
                                    {
                                        user_id : req.session.passport.user.id,
                                        result : 0,
                                        user_name : req.session.passport.user.name,
                                        country : req.session.passport.user.country,
                                        user_image : user_image ? user_image : '/images/user.png',
                                        time : new Date()
                                    }
                                );
                            } else {
                                return true;
                            }

                        }).then((err, rows) => {
                            var mongo_id = (typeof err.insertedId !== "undefined") ? err.insertedId : hash;
                            res.json({
                                status : "ok",
                                p : JSON.stringify(tasks),
                                hash : mongo_id
                            });
                        })
                        .catch(function (err) {
                            console.log(err);
                        });
                } else {
                    res.json({
                        status : "error",
                        msg : "hacker detected"
                    });
                }
            }
    });

    router.post('/get_results',
        [
            check('restrict', 'The restrict field is required').exists().isLength({ min: 1 })
        ]
        ,function (req, res) {


            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(422).json({
                    errors: errors.mapped()
                });
            } else {
                let restrict = req.body.restrict;

                /*var date_past = moment(new Date()).add(-1, 'h').toDate();
                var date = new Date();*/

                var start = moment().startOf('day').toDate(); // set to 12:00 am today
                var end = moment().endOf('day').toDate(); // set to 23:59 pm today

                let aggr = [];

                if (restrict === "daily") {
                    aggr.push({ $match : { "time" : { $gt: start, $lt: end } } });
                }
                aggr.push({
                    $sort: { result: -1 }
                });
                aggr.push({
                    $group: {
                        _id: "$user_id",
                        result: { $first: "$result" },
                        user_name: { $first: "$user_name" },
                        country: { $first: "$country" },
                        user_image: { $first: "$user_image" },
                        o_id: { $first: "$_id" }
                    }
                });
                aggr.push({
                    $project: {
                        _id: "$o_id",
                        user_name: "$user_name",
                        user_image: "$user_image",
                        country: "$country",
                        user_id: "$_id",
                        result: 1
                    }
                });

                app.mongoDB.collection("puzzle_rush").aggregate(aggr).limit(50).toArray(function(err, result) {
                    if (err) throw err;
                    result = result.sort(compare2);

                    if (req.isAuthenticated()) {
                        let my_result = [], aggr = [];

                        /*aggr.push({ $match : { "time" : { $gt: start, $lt: end }, user_id : req.session.passport.user.id } });
                        aggr.push({
                            $sort: { result: -1 }
                        });*/

                        app.mongoDB.collection("puzzle_rush").find({user_id : req.session.passport.user.id,  "time" : { $gt: start, $lt: end } })
                            .sort({result:-1}).limit(1).toArray(function(err, user_today) {


                            app.mongoDB.collection("puzzle_rush").find({user_id : req.session.passport.user.id}).sort({result:-1}).limit(1).toArray(function(err, user_all) {
                                res.json({
                                    status : "ok",
                                    users : result,
                                    user : {
                                        user_today : user_today,
                                        user_all : user_all
                                    }
                                });
                            });
                        });
                    } else {
                        res.json({
                            status : "ok",
                            users : result
                        });
                    }

                });



            }
    });

    function compare2(a, b) {
        if (a.result > b.result)
            return -1;
        if (a.result < b.result)
            return 1;
        return 1;
    }

    router.post('/api/get_puzzle/:p_id',
        [
            check('p_id', 'The puzzle_id field is required').exists().isLength({ min: 1 })
        ]
        ,function (req, res) {


            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(422).json({
                    errors: errors.mapped()
                });
            } else {

                let puzzle_id = req.body.p_id;
                puzzle_id = parseInt(puzzle_id);
                if (!isNaN(puzzle_id)) {
                    pool.query('SELECT id, fen, moves FROM sb_puzzles WHERE id = ?', puzzle_id)
                        .then(rows => {
                            res.json({
                                status : "ok",
                                p : JSON.stringify(rows)
                            });
                        })
                        .catch(function (err) {
                            console.log(err);
                        });
                } else {
                    res.json({
                        status : "error",
                        msg : "hacker detected"
                    });
                }
            }
    });


    router.get('/:puzzle_id', function (req, res) {
        let puzzle_id = req.params.puzzle_id;
        puzzle_id = parseInt(puzzle_id);
        if (!isNaN(puzzle_id)) {
            res.render('puzzles/puzzle', {
                puzzle_id : req.params.puzzle_id
            });
        } else {
            res.render('error', {
                message  : "Puzzle not found",
                error  : "Puzzle not found",
            });
        }
    });




    router.post('/save',
        [
            check('p_id', 'The p_id field is required').exists().isLength({ min: 1 }),
            check('r', 'The r field is required').exists().isLength({ min: 1 })
        ],
        function (req, res) {


            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(422).json({
                    errors: errors.mapped()
                });
            } else {

                let p_id = req.body.p_id; //puzzle_id
                p_id = parseInt(p_id);
                let r = req.body.r; //rating
                r = parseInt(r);
                let puzzle = [];
                if (!isNaN(p_id) && !isNaN(r)) {

                    let player_new_rating = 0, puzzle_new_rating = 0;

                    pool.query('SELECT * FROM sb_puzzles WHERE id = ? LIMIT 1', p_id)
                        .then(rows => {
                            puzzle = rows;
                            return pool
                                .query('SELECT * FROM users WHERE id = ?',
                                    req.session.passport.user.id)
                        }).then(rows => {
                            let user = rows;
                        //если пазл найден
                            if (puzzle.length > 0) {
                                //let changed_rating = puzzle[0].end_rating;
                                //TODO эту проверку можно убрать когда будет гарантия что у всех рейтинги в виде цифры
                                user[0].rating = (parseInt(user[0].rating)) ? user[0].rating : 400;

                                var odds_player_wins = elo.expectedScore(user[0].rating, puzzle[0].end_rating);
                                var odds_puzzle_wins = elo.expectedScore(puzzle[0].end_rating, user[0].rating);

                                const puz_result = (r === 1) ? 0 : 1;

                                player_new_rating = elo.newRating(odds_player_wins, r, user[0].rating);
                                puzzle_new_rating = elo.newRating(odds_puzzle_wins, puz_result, puzzle[0].end_rating);

                                return pool.query('UPDATE sb_puzzles SET end_rating = ? WHERE id = ?',
                                    [
                                        puzzle_new_rating,
                                        p_id,
                                    ])
                            } else {
                                return true;
                            }

                        }).then(rows => {
                            if (puzzle.length > 0) {
                                return pool.query('UPDATE users SET rating = ? WHERE id = ?', [player_new_rating, req.session.passport.user.id]);
                            } else {
                                return true;
                            }
                        }).then(rows => {
                            if (r === 1) {
                                app.mongoDB.collection("puzzle_rush").updateOne(
                                    {
                                        _id : ObjectId(req.body.hash)
                                    },
                                    { $inc: { result: +1 } }

                                );
                            } else {
                                return true;
                            }

                        }).then(rows => {
                          /* if (rows == true) {
                               res.json({
                                   status : "errored",
                               });

                           } else {*/
                               res.json({
                                   status : "ok",
                               });
                           //}
                        })
                        .catch(function (err) {
                            console.log(err);
                        });

                    /*if (theme.result == 1) {
                        theme.changed_rating = elo.newRatingIfWon(current_rating, puzzle_rating);
                    } else {
                        theme.changed_rating = elo.newRatingIfLost(current_rating, puzzle_rating);
                    }
                    theme.diff = theme.changed_rating - current_rating;*/



                } else {
                    res.json({
                        status : "error",
                        msg : "hacker detected"
                    });
                }
            }
        });




    router.post('/save_result',
        [
            check('result', 'The result field is required').exists().isInt({ min: 0, max: 500 }).isLength({ min: 1 }),
        ],
        function (req, res) {


            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(422).json({
                    errors: errors.mapped()
                });
            } else {

                let result = req.body.result; //result
                result = parseInt(result);
                let user_id = req.session.passport.user.id; //user_id
                const user_name = req.session.passport.user.name; //user_id
                const user_image = req.session.passport.user.image; //user_id
                user_id = parseInt(user_id);
                if (!isNaN(result) && !isNaN(user_id)) {


                    app.mongoDB.collection("puzzle_rush").updateOne(
                        {
                            _id : user_id,
                            result : result,
                        },
                        function (err, data) {
                            res.json({
                                status : "ok",
                            });
                        }
                    );

                } else {
                    res.json({
                        status : "error",
                        msg : "hacker detected"
                    });
                }
            }
        });


    function shuffle(array) {
        var tmp, current, top = array.length;

        if(top) while(--top) {
            current = Math.floor(Math.random() * (top + 1));
            tmp = array[current];
            array[current] = array[top];
            array[top] = tmp;
        }

        return array;
    }



    return router;


}


