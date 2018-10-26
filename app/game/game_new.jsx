import React from 'react';
import {render} from 'react-dom';
import Timer from "../tournament/Timer.jsx";
import Sounds from "../sounds.jsx";


var aa;
(function(){
    function ArcadeAudio() {
        this.sounds = {};
    }

    ArcadeAudio.prototype.add = function( key, count, settings ) {
        this.sounds[ key ] = [];
        settings.forEach( function( elem, index ) {
            this.sounds[ key ].push( {
                tick: 0,
                count: count,
                pool: []
            } );
            for( var i = 0; i < count; i++ ) {
                var audio = new Audio("data:audio/wav;base64," + Sounds[key]);
                //audio.src = move;
                this.sounds[ key ][ index ].pool.push( audio );
            }
        }, this );
    };

    ArcadeAudio.prototype.play = function( key ) {
        var sound = this.sounds[ key ];
        var soundData = sound.length > 1 ? sound[ Math.floor( Math.random() * sound.length ) ] : sound[ 0 ];
        soundData.pool[ soundData.tick ].play();
        soundData.tick < soundData.count - 1 ? soundData.tick++ : soundData.tick = 0;
    };

    aa = new ArcadeAudio();



    aa.add( 'move', 1,[[]]);
    aa.add( 'capture', 1,[[]]);





})();;


class App {
    constructor(props) {

        var self = this;

        // console.log(fen);

        if (typeof fen != "undefined" && fen != "undefined" && fen != "" && fen != null) {
            this.game = new Chess();

            for (var i = 0; i < self.state.moves.length; i++) {
                var obj = self.state.moves[i];
                this.game.move(obj);
            }

        } else {
            // this.game = new Chess("8/5KP1/8/1k6/8/8/8/8 w - - 34 74");
            this.game = new Chess();
        }


        var isPlayer = false;
        var playerColor = null;

        if (typeof u != "undefined" && p1 == u) {
            isPlayer = true;
            playerColor = "white";
        } else if (typeof u != "undefined" && p2 == u) {
            isPlayer = true;
            playerColor = "black";
        }


        var width = $("#wrpr").outerWidth();
        $("#dirty").width(width).height(width);
        $(".player_bar").width(width);


            this.cg = Chessground(document.getElementById('dirty'), {
                fen: this.game.fen(),
                turnColor: (this.game.turn() === 'w') ? "white" : "black",
                orientation: (isPlayer) ? playerColor : "white",
                highlight: {
                    lastMove: true,
                    check: true
                },
                animation: {
                    enabled: true,
                    duration: 100,
                },
                movable: {
                    showDests: true,
                    free: false,
                    dests: (isPlayer) ? getDests(self.game) : null,
                    color: (isPlayer) ? this.playerColor : null,
                },
                events: {
                    move: this.move
                }
            });

            $(function () {
                self.move_sound = $("#move_sound")[0];
                self.capture_sound = $("#capture_sound")[0];
                self.confirmation_sound = $("#confirmation_sound")[0];
                self.defeat_sound = $("#defeat_sound")[0];

                if (isPlayer ) {
                    self.confirmation_sound.play();
                }
            });



        this.row = 0;



        $("body").on("click", "move", function () {
            var history = self.game.history();
            var index = $(this).index("move");
            self.temp_game = new Chess();


            if (index != history.length - 1) {
                for (var i = 0; i < history.length; i++) {
                    var obj1 = history[i];
                    if (i <= index) {
                        self.temp_game.move(obj1);

                    }
                }

                self.temp_move = index;


                self.cg.set({
                    fen: self.temp_game.fen(),
                    viewOnly: true
                });
            } else {
                self.cg.set({
                    fen: self.game.fen(),
                    viewOnly: false
                });
            }
        });

        $("body").on("click", "#accept_rematch", function () {
            self.socket.emit('rematch_accepted', JSON.stringify({
                "user_id": u,
                "enemy_id": (u == p1) ? p2 : p1,
            }));
        });


        $(document).keydown(function (e) {
            switch (e.which) {
                case 37: // left
                    self.goBack();
                    break;
                case 38: // up
                    break;
                case 39: // right
                    self.goForward();
                    break;
                case 40: // down
                    break;

                default:
                    return; // exit this handler for other keys
            }
            e.preventDefault(); // prevent the default action (scroll / move caret)
        });

        //флаг премува
        this.premoved = false;

    }
}



function getDests(game) {
    var dests = {};
    game.SQUARES.forEach(function (s) {
        var ms = game.moves({square: s, verbose: true});
        if (ms.length)
            dests[s] = ms.map(function (m) {
                return m.to;
            });
    });
    return dests;
}

new App();