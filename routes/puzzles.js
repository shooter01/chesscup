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
                start = parseInt(start);
                if (!isNaN(start)) {
                    pool.query('SELECT id, fen, moves FROM sb_puzzles ORDER BY end_rating LIMIT ?, 100', start*10)
                        .then(rows => {
                            console.log(rows);
                            rows = shuffle(rows);
                            rows = rows.slice(0, 10);
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
                            console.log(rows);
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
                if (!isNaN(p_id) && !isNaN(r)) {

                    pool.query('SELECT * FROM sb_puzzles WHERE id = ? LIMIT 1', p_id)
                        .then(rows => {
                            console.log(rows);
                            //если пазл найден
                            if (rows.length > 0) {
                                let changed_rating = rows[0].end_rating;
                                if (r == 1) {
                                    changed_rating = changed_rating - 10;
                                } else {
                                    changed_rating = changed_rating + 10;
                                }

                                return pool.query('UPDATE sb_puzzles SET end_rating = ? WHERE id = ?',
                                    [
                                        changed_rating,
                                        p_id,
                                    ])
                            } else {
                                return true;
                            }
                        }).then(rows => {
                           if (rows == true) {
                               res.json({
                                   status : "errored",
                               });

                           } else {
                               res.json({
                                   status : "ok",
                               });
                           }
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


