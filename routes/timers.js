
const make_draw = require('./make_draw');


module.exports = function (app) {
    const pool = app.pool;
    setInterval(function () {
      //  console.log("aaa");

        pool
            .query('SELECT * FROM tournaments WHERE is_active = 0 AND start_time < ?', new Date())
            .then(games => {
               // console.log(games);
                if (games.length > 0) {
                    return pool
                        .query('UPDATE tournaments SET is_active = 1  WHERE is_active = 0 AND start_time < ?', new Date()).then(rows => {
                            make_draw({
                                tournament_id : 43,
                                pool : app.pool,
                                app : app,
                            });
                        })
                }
            });
    }, 5000);

}