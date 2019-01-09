var webpack = require('webpack');
var path = require('path');
const CompressionPlugin = require("compression-webpack-plugin");
const ConcatPlugin = require('webpack-concat-plugin');

var BUILD_DIR = path.resolve(__dirname, 'public/js/');
var APP_DIR = path.resolve(__dirname, 'app');



var config = {
    entry: {
       /* users : './app/users/users.jsx',
        participants_page : './app/tournament/participants_page.jsx',
        p : './app/tournament/pairing.jsx',
        current_games : './app/tournament/current_games.jsx',*/
        ci : './app/puzzles/cpuzzle.jsx',
        /*chat : './app/tournament/Chat.jsx',
        get_in : './app/tournament/get_in.jsx',
        teams_tables : './app/tournament/teams_tables.jsx',
        tournament_events : './app/tournament/tournament_events.jsx',
        player : './app/tournament/player.jsx',
        online_participants : './app/tournament/online_participants.jsx',
        final : './app/tournament/final.jsx',
        timer : './app/tournament/Timer.jsx',
        profile : './app/users/Profile.jsx',
        start_date : './app/tournament/StartDate.jsx',
        game : './app/game/game.jsx',
        team : './app/team/team.jsx',
        league : './app/league/league.jsx',
        apply_team : './app/team/apply_team.jsx',
        myteam : './app/team/myteam.jsx',
        g : './app/game/game_new.jsx',
        play : './app/play/play.jsx',
        team_pairing : './app/tournament/team_pairing.jsx',
        ws : './app/websockets/ws.jsx',*/
    },
    output: {
        path: BUILD_DIR,
        filename: '[name].min.js'
    },
    module : {
        loaders : [
            {
                test : /\.jsx?/,
                include : APP_DIR,
                loader : 'babel-loader',
            }
        ]
    },
    plugins: [
       /* new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            mangle: true
        }), //minify everything*/
        new webpack.optimize.AggressiveMergingPlugin(),//Merge chunks

    ],
};
module.exports = config;