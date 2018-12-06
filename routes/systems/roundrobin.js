const pairsCalc = require('robin-js'); // CJS




const roundrobin = function (results, participants, tourney, bye_participants) {
    let pairs = [], insert_object = [], already_played = {}, test = [];



    for (let i = 0; i < participants.length; i++) {
        test.push(participants[i].user_id);
    }


    //составляем пары
    pairs = pairsCalc(test);

    //брем пару по индексу
    if (typeof pairs[tourney.current_tour] != "undefined") {
        for (let pair of pairs[tourney.current_tour]) {
            //for (let pair of round) {

            if (pair.length > 1) {

                insert_object.push({
                    home : pair[0],
                    away : pair[1],
                });
            }
            //}

        }
    }


   // console.log(pairs[tourney.current_tour]);
   // console.log(insert_object);

    var promise = new Promise(function(resolve, reject) {
        resolve();
    }).then(function () {
        return insert_object;
    });

    return promise;


};


module.exports = roundrobin;