var webpack = require('webpack');
var path = require('path');
const CompressionPlugin = require("compression-webpack-plugin");
const ConcatPlugin = require('webpack-concat-plugin');

var BUILD_DIR = path.resolve(__dirname, 'public/js/');
var APP_DIR = path.resolve(__dirname, 'app');



var config = {
    entry: {
        users : './app/users/users.jsx',
        participants : './app/tournament/participant.jsx',
        pairing : './app/tournament/pairing.jsx',
        current_games : './app/tournament/current_games.jsx',
        chat : './app/tournament/Chat.jsx',
        get_in : './app/tournament/get_in.jsx',
        tournament_events : './app/tournament/tournament_events.jsx',
        player : './app/tournament/player.jsx',
        online_participants : './app/tournament/online_participants.jsx',
        final : './app/tournament/final.jsx',
        timer : './app/tournament/Timer.jsx',
        start_date : './app/tournament/StartDate.jsx',
        game : './app/game/game.jsx',
        play : './app/play/play.jsx',
        team_pairing : './app/tournament/team_pairing.jsx',
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
        /*new webpack.DefinePlugin({
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