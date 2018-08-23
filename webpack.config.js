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
        final : './app/tournament/final.jsx',
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