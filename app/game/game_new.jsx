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

})();


class App {
    constructor(props) {

        var self = this;

        this.state = {
            promotion: "q",
            who_to_move: null,
            isPlayer: false,
            amount: amount,
            white_time: p1_time_left,
            p1_name: p1_name,
            p2_name: p2_name,
            black_time: p2_time_left,
            tourney_id: (typeof tourney_id != "undefined") ? tourney_id : null,
            tour_id: (typeof tour_id != "undefined") ? tour_id : null,
            moves: moves.split(","),
            up_rating_change: null,
            row: 0,
            bottom_rating_change: null,
            up_player_online: false,
            bottom_player_online: false,
            playerColor: null,
            tourney_href: (typeof tourney_id != "undefined") ? "/tournament/" + tourney_id : "/play",
            tourney_text: (typeof tourney_id != "undefined") ? "Вернуться к турниру" : "REMATCH",
            is_over: is_over,
            p1_won: p1_won,
            p2_won: p2_won,
            is_started: parseInt(is_started),
            orientation: "white",
            up_name: p2_name,
            up_tournaments_rating: p2_tournaments_rating,
            bottom_name: p1_name,
            bottom_tournaments_rating: p1_tournaments_rating
        };

        //ряды ходов
        this.row = 0;

        //флаг премува
        this.premoved = false;


        if (typeof fen != "undefined" && fen != "undefined" && fen != "" && fen != null) {
            this.game = new Chess();
            for (let i = 0; i < self.state.moves.length; i++) {
                let obj = self.state.moves[i];
                this.game.move(obj);
            }

        } else {
            this.game = new Chess();
        }

        if (typeof u != "undefined" && p1 == u) {
            this.state.isPlayer = true;
            this.state.playerColor = "white";
        } else if (typeof u != "undefined" && p2 == u) {
            this.state.isPlayer = true;
            this.state.playerColor = "black";
            this.state.orientation = "black";
        }

        const width = $("#wrpr").outerWidth();
        const dirty = $('#dirty');
        dirty.width(width).height(width);
        $(".player_bar").width(width);


        this.cg = Chessground(dirty[0], {
            fen: this.game.fen(),
            turnColor: (this.game.turn() === 'w') ? "white" : "black",
            orientation: (this.state.isPlayer) ? this.state.playerColor : "white",
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
                dests: (this.state.isPlayer) ? getDests(self.game) : null,
                color: (this.state.isPlayer) ? this.state.playerColor : null,
            },
            events: {
                move: this.move
            }
        });
        this.socketIOConnect();
        this.setNames();
    }

    setState(new_state, callback){
        Object.assign(this.state, new_state);
        if (callback) callback.apply(this);
    }

    setPlayersOnline(){

        if (this.state.up_player_online) {
            $(".up_player_online").addClass("online").removeClass("offline");
        } else {
            $(".up_player_online").addClass("offline").removeClass("online")
        }

        if (this.state.bottom_player_online) {
            $(".bottom_player_online").addClass("online").removeClass("offline");
        } else {
            $(".bottom_player_online").addClass("offline").removeClass("online")
        }
    }

    setNames(){
        if (this.state.orientation === "white") {
            $(".up_name").html(this.state.p1_name);
            $(".bottom_name").html(this.state.p2_name);
        } else {
            $(".bottom_name").html(this.state.p1_name);
            $(".up_name").html(this.state.p2_name);
        }
    }

    socketMove(data){
        const self = this;
        self.game.move({ from: data.from, to: data.to });

        if (self.game.fen() !== data.fen) {
            self.game.load(data.fen);
        }

        self.setState({
            who_to_move: (self.game.turn() === 'w') ? "white" : "black",
            white_time: data.p1_time_left,
            black_time: data.p2_time_left,
            is_over: data.is_over,
            is_started: (self.game.turn() === 'w') ? 1 : self.state.is_started,
        }, function () {
            self.setTime();


            var is_over = (data.is_over == 1);


            if (is_over) {
                self.defeat_sound.play()
            }

            self.cg.set({
                fen: self.game.fen(),
                viewOnly : is_over,
                lastMove: [data.from, data.to],
                movable: {
                    dests: getDests(self.game)
                },
                turnColor: (self.game.turn() === 'w') ? "white" : "black"
            });

            self.premoved = self.cg.playPremove();


            if (self.game.in_check() === true) {
                self.cg.set({
                    check: true,
                    state: {
                        check: true,
                    }
                })

            }

            if (typeof data.san != "undefined" && data.san != "undefined") {
                var a = this.state.moves;
                a.push(data.san);
                self.setState({
                    moves: a,
                }, function () {
                    this.addMove(data.san);
                    self.scrollToBottom();

                });

                if (data.captured) {
                    aa.play('capture');
                } else {
                    aa.play('move');
                }
            }
        });
    }
    socketRatingChange(data){
        const self = this;

        if (self.state.orientation === "white" && self.state.is_over === 1) {
            self.setState({
                bottom_rating_change: data.rating_change_p1,
                up_rating_change: data.rating_change_p2
            });
        } else if (self.state.orientation === "black" && self.state.is_over === 1) {
            self.setState({
                bottom_rating_change: data.rating_change_p2,
                up_rating_change: data.rating_change_p1
            });
        }

        self.cg.set({
            viewOnly : true,
            movable: {
                color: null
            },
            turnColor: null
        });
    }
    socketGamerOver(data){
        const self = this;

        clearInterval(self.timer);
        self.setState({
            is_over: data.is_over,
            p1_won: data.p1_won,
            p2_won: data.p2_won,
            white_time : data.p1_time_left,
            black_time : data.p2_time_left
        }, function () {
            self.setTime();
        });

        self.cg.set({

            movable: {
                color: null
            },
            turnColor: null
        });

        self.defeat_sound = $("#defeat_sound")[0];
    }
    socketGameAborted(data){
        const self = this;

        clearInterval(self.timer);
        self.setState({
            is_over: data.is_over
        });

        self.cg.set({
            viewOnly : true,
            movable: {
                color: null
            },
            turnColor: null
        });

        alert("Игра отменена сервером");
    }
    socketRematchOffer(data){
        const self = this;
        $("#rematchModal").modal("show");
    }
    socketPlayerOnline(data){
        const self = this;
        if (!data[p1]) {
            if (self.state.orientation === "black") {
                self.setState({
                    up_player_online: false
                }, self.setPlayersOnline);
            } else {
                self.setState({
                    bottom_player_online: false
                }, self.setPlayersOnline);
            }
        } else {
            if (self.state.orientation === "black") {
                self.setState({
                    up_player_online: true
                }, self.setPlayersOnline);
            } else {
                self.setState({
                    bottom_player_online: true
                }, self.setPlayersOnline);
            }
        }
        if (!data[p2]) {
            if (self.state.orientation === "black") {
                self.setState({
                    bottom_player_online: false
                }, self.setPlayersOnline);
            } else {
                self.setState({
                    up_player_online: false
                }, self.setPlayersOnline);
            }
        } else {
            if (self.state.orientation === "white") {
                self.setState({
                    up_player_online: true
                }, self.setPlayersOnline);
            } else {
                self.setState({
                    bottom_player_online: true
                }, self.setPlayersOnline);
            }
        }
    }
    playzoneStartGame(data){
        const self = this;
        console.log(data);

        location.href = "/play/game/" + data.game_id;
    }

    socketIOConnect(){
            const self = this; let url = "";
            if (typeof u != "undefined") {
                url = 'h=' + u;
            } else {
                url = '';
            }
            this.socket = io(window.location.origin, {query: url + '&g=' + g});

            this.socket.on('eventClient', function (data) {
                data = JSON.parse(data);
                //  debugger;
                self.cg.set({
                    check: false,
                    state: {
                        check: false,
                    }
                });

                if (data.event === "move") {
                    self.socketMove(data);

                } else if (data.event === "rating_change") {

                    self.socketRatingChange(data);

                } else if (data.event === "game_over") {
                    self.socketGamerOver(data);


                } else if (data.event === "game_aborted") {

                    self.socketGameAborted(data);

                } else if (data.event === "rematch_offer") {
                    self.socketRematchOffer(data);

                }
            });

            this.socket.on('playerOnline', function (data) {
                data = JSON.parse(data);

                self.socketPlayerOnline(data);
            });


            this.socket.on('playzone_start_game', function (data) {
                data = JSON.parse(data);
                self.playzoneStartGame(data);
            });

            if (this.state.isPlayer === true) {
                let who_online = "white";
                if (this.state.orientation === "black") {
                    who_online = "black";
                }
                this.socket.emit('playerOnOff', JSON.stringify({online: who_online, p_id: u, game_id: g}))
            }

    }


    setListeners(){

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

$(function () {
    new App();
})
