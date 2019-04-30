
const invite_user_to_game = function (user_id, game_data, app) {
   // console.log("INVITED : ", user_id);
    //console.log(game_data);
    //если пользователь на сайте
    //console.log(Object.keys(app.globalPlayers))
    if ( app.globalPlayers[user_id]) {
        app.globalPlayers[user_id].send(game_data);
    }

};


module.exports = invite_user_to_game;