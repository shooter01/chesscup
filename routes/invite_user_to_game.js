
const invite_user_to_game = function (user_id, game_data, app) {
    console.log("INVITED : ", user_id);
    console.log(game_data);
    //если пользователь на сайте
    if ( app.globalPlayers[user_id]) {
        app.globalPlayers[user_id].emit('playzone_start_game', game_data);
    }
};


module.exports = invite_user_to_game;