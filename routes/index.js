var express = require('express');
// var mysql = require('mysql-promise');
var router = express.Router();
const moment = require('moment');
const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');
const countries = require('./countries');



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


        pool.query('SELECT tournaments.*, users.name FROM tournaments LEFT JOIN users on users.id = tournaments.school_id ORDER BY tournaments.id DESC').then(function (results) {

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

    return router;
};
