let swisspairing = require('swiss-pairing');




const swiss = function (tourney, newParticipants, newArr, berger_object, colors) {

    let promise = new Promise(function(resolve, reject) {
        resolve();
    }).then(function () {
        return swisspairing().getMatchups(tourney.current_tour + 1, newParticipants, newArr);
    });

    return promise;




};


module.exports = swiss;