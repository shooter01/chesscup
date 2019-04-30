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


class App extends React.Component {
    constructor(props) {
        super(props);
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

        };
        this.move = this.move.bind(this);
        this.setTime = this.setTime.bind(this);
        this.socketIOConnect = this.socketIOConnect.bind(this);
        this.tick = this.tick.bind(this);
        this.setTimer = this.setTimer.bind(this);
        this.resign = this.resign.bind(this);
        this.fillMoves = this.fillMoves.bind(this);
        this.addMove = this.addMove.bind(this);
        this.goBack = this.goBack.bind(this);
        this.goForward = this.goForward.bind(this);
        this.scrollToBottom = this.scrollToBottom.bind(this);
        this.rematchClick = this.rematchClick.bind(this);

        this.resignCount = 0;

    }

    move(source, target, promotion) {
        var that = this;
        var prom = this.state.promotion;
        //console.log(this.premoved);

        // see if the move is legal
        var move = that.game.move({
            from: source,
            to: target,
            promotion: prom
        });

        // illegal move
        if (move === null) {
            that.game.undo();
            this.cg.set({fen: that.game.fen()});
            return false;
        }


        /*if (move.captured) {
            setTimeout(function () {
                aa.play('capture');
            }, 175)
            //this.capture_sound.play();
        } else {
            setTimeout(function () {
                aa.play('move');
            }, 175)
            // this.move_sound.play();
        }*/
        //  console.log(that.game.history());


        if (this.state.is_started != 0) {
            $("#timeleft_white").addClass("hidden");
            $("#timeleft_black").addClass("hidden");
        }


        this.cg.set({
            turnColor: (this.game.turn() === 'w') ? "white" : "black",
            movable: {
                dests: getDests(that.game),
                // color : (this.game.turn() === 'w') ? "white" : "black",
            }
        });

        var newState = {
            who_to_move: (this.game.turn() === 'w') ? "white" : "black",
        };

        that.setState(newState);

        var send_data = {
            data: that.game.fen(),
            id: g,
            tourney_id: this.state.tourney_id,
            move: move.san,
            captured: move.captured,
            from: move.from,
            to: move.to,
            is_over: 0,
            player: (this.game.turn() === 'w') ? "p2" : "p1", //who made the last move
        };
        if (this.premoved === true) {
            send_data['premoved'] = true;
            this.premoved = false;
        }
        // checkmate?
        if (that.game.in_checkmate() === true) {
            send_data.is_over = 1;
            send_data.p1_won = (this.game.turn() === "w") ? 0 : 1;
            send_data.p2_won = (this.game.turn() === "b") ? 0 : 1;
            send_data.p1_id = p1;
            send_data.p2_id = p2;
            send_data.tourney_id = this.state.tourney_id;
        } else if (that.game.in_draw() === true) {
            send_data.is_over = 1;
            send_data.p1_won = 0.5;
            send_data.p2_won = 0.5;
            send_data.p1_id = p1;
            send_data.p2_id = p2;
            send_data.tourney_id = this.state.tourney_id;
        } else {
            // check?
            if (that.game.in_check() === true) {
                that.cg.set({
                    check: true,
                    state: {
                        check: true,
                    }
                });
            }
        }

        this.socket.emit('eventServer', JSON.stringify(send_data));


    }

    componentDidMount() {
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

        this.setState({
            who_to_move: (this.game.turn() === 'w') ? "white" : "black",
            isPlayer: isPlayer,
            playerColor: playerColor,
            orientation: (isPlayer) ? playerColor : "white"
        }, function () {
            /*var valid = self.game.moves();
            var p = [];
            for (var i = 0; i < valid.length; i++) {
                var obj = valid[i];
                p.push(obj.slice(-2));
            }*/


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
                    color: (this.state.isPlayer) ? this.state.playerColor : null,
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

                if (isPlayer && self.state.is_started == 0 && self.state.is_over == 0) {
                    self.confirmation_sound.play();
                }
            });

            this.socketIOConnect();
            this.setTimer();

            if (this.state.orientation === "white") {
                this.setState({
                    up_name: p2_name,
                    up_tournaments_rating: p2_tournaments_rating,
                    bottom_name: p1_name,
                    bottom_tournaments_rating: p1_tournaments_rating
                });

                if (this.state.is_over == 1) {
                    this.setState({
                        bottom_rating_change: (typeof rating_change_p1 != "undefined") ? rating_change_p1 : 0,
                        up_rating_change: (typeof rating_change_p2 != "undefined") ? rating_change_p2 : 0,
                    });

                    self.cg.set({
                        movable: {
                            color: null
                        },
                        turnColor: null
                    });
                }

            } else if (this.state.orientation === "black") {
                this.setState({
                    bottom_name: p2_name,
                    bottom_tournaments_rating: p2_tournaments_rating,
                    up_name: p1_name,
                    up_tournaments_rating: p1_tournaments_rating
                });

                if (this.state.is_over == 1) {
                    this.setState({
                        up_rating_change: (typeof rating_change_p1 != "undefined") ? rating_change_p1 : 0,
                        bottom_rating_change: (typeof rating_change_p2 != "undefined") ? rating_change_p2 : 0,
                    });

                    self.cg.set({
                        movable: {
                            color: null
                        },
                        turnColor: null
                    });
                }
            }
            self.setTime();

            if (this.state.is_started == 0 && this.state.is_over == 0) {
                $("#timeleft_white").removeClass("hidden");


            }
        });


        this.row = 0;
        this.temp_move = this.state.moves.length - 2;

        if (this.state.moves && this.state.moves.length) {

            if (this.state.moves[0] === "") {
                this.setState({
                    moves : []
                });
            } else {
                this.fillMoves();
                this.scrollToBottom();

            }

        }


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
                    viewOnly : true
                });
            } else {
                self.cg.set({
                    fen: self.game.fen(),
                    viewOnly : false
                });
            }
        });

        $("body").on("click", "#accept_rematch", function () {
            self.socket.emit('rematch_accepted', JSON.stringify({
                "user_id" : u,
                "user_name" : self.state.p1_name,
                "enemy_name" : self.state.p2_name,
                "amount" : self.state.amount,
                "enemy_id" : (u == p1) ? p2 : p1,
            }));
        });





        $(document).keydown(function(e) {
            switch(e.which) {
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

                default: return; // exit this handler for other keys
            }
            e.preventDefault(); // prevent the default action (scroll / move caret)
        });

        //флаг премува
        this.premoved = false;


    }

    rematchClick(event){
        var self = this;
        var element = $(event.target);
        this.socket.emit('rematch_game', JSON.stringify({
            "user_id" : u,
            "user_name" : user_name,
            "enemy_id" : (u == p1) ? p2 : p1,
        }));




        event.preventDefault();
        return false;
    }
    goBack(){
        var self = this;
        var history = self.game.history();

        self.temp_game = new Chess();
        if (self.temp_move - 1 >= 0) {
            --self.temp_move;

            for (var i = 0; i < history.length; i++) {
                var obj1 = history[i];
                if (i <= self.temp_move) {
                    self.temp_game.move(obj1);
                }
            }
            self.move_sound.play();

            self.cg.set({
                fen: self.temp_game.fen(),
                viewOnly : true
            });
        } else {
            self.cg.set({
                fen: self.temp_game.fen(),
                viewOnly : false

            });

        }
    }
    goForward(){
        var self = this;
        var history = self.game.history();

        self.temp_game = new Chess();
        if ((self.temp_move + 1 < history.length)) {
            self.temp_move++;

            var lastMove;

            for (var i = 0; i < history.length; i++) {
                var obj1 = history[i];
                if (i <= self.temp_move) {
                    lastMove = self.temp_game.move(obj1);

                }
            }

            if (lastMove.captured) {
                self.capture_sound.play();
            } else {
                self.move_sound.play();
            }

            self.cg.set({
                fen: self.temp_game.fen(),
                viewOnly : true

            });

        } else {
            self.cg.set({
                fen: self.game.fen(),
                viewOnly : false

            });
        }
    }

    fillMoves(){


        for (var i = 0; i < this.state.moves.length; i++) {
            var obj = this.state.moves[i];
            if ($.trim(obj) != "") {
                this.addMove(obj, i);
            }
        }
    }

    addMove(san, i){
        var m = i;
        if (typeof m == "undefined"){
            m = this.state.moves.length - 1;
        }
        if (m % 2 == 0) {
            $(".moves").append($("<index>" + ++this.row + "</index>"));
        }
        $(".moves").append($("<move>" + san + "</move>"))
    }

    resign(event) {
        // var element = this;

        var self = this;
        var element = $(event.target);
        //var value = event.target.value;

        //   $(this).closest(".control").addClass("confirm");
        element.addClass("yes active");

        //   var wrapper = $("<div class='act_confirm resign'></div>");

        //   $(this).wrap(wrapper);


        self.resignCount++;

        if (self.resignCount > 1) {
            var send_data = {
                data: self.game.fen(),
                id: g,
                is_over: 1,
                player: (self.state.who_to_move === 'white') ? "p1" : "p2", //кто должен ходить
            };

            send_data.is_over = 1;
            send_data.p1_won = (self.state.playerColor === 'white') ? 0 : 1;
            send_data.p2_won = (self.state.playerColor === 'black') ? 0 : 1;
            send_data.p1_id = p1;
            send_data.p2_id = p2;
            send_data.tourney_id = self.state.tourney_id;
            self.socket.emit('eventServer', JSON.stringify(send_data));

        }


        setTimeout(function () {
            // if (self.state.is_over == 0) {
            // $(element).unwrap();
            /// $(element).closest(".control").removeClass("confirm");
            $(element).removeClass("yes active");
            //}
            self.resignCount = 0;
        }, 3000);
    }

    getPromotionChoice() {
        return $('<div id="promotion_choice" class="top"><square style="top: 0%;left: 75%"><piece class="queen white"></piece></square><square style="top: 12.5%;left: 75%"><piece class="knight white"></piece></square><square style="top: 25%;left: 75%"><piece class="rook white"></piece></square><square style="top: 37.5%;left: 75%"><piece class="bishop white"></piece></square></div>')
    }


    socketIOConnect() {
        var self = this, url;
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
            })

            if (data.event === "move") {
                // self.game.load(data.fen);
                //self.game.move(data.san);
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


                    var is_over = (data.is_over == 1) ? true : false;

                    if (u == p1 && this.state.who_to_move == "white") {
                        if (!is_over) {
                            const moves = self.game.moves({verbose:true});
                            const move = moves[Math.floor(Math.random() * moves.length)];
                            //console.log(move);
                            setTimeout(function () {
                                self.move(move.from, move.to);
                            }, 100);
                        }
                    }

                    if (u == p2 && this.state.who_to_move == "black") {
                        if (!is_over) {
                            const moves = self.game.moves({verbose:true});
                            const move = moves[Math.floor(Math.random() * moves.length)];
                            //console.log(move);
                            setTimeout(function () {
                                self.move(move.from, move.to);
                            }, 100);
                        }
                    }

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

            } else if (data.event === "rating_change") {

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

            } else if (data.event === "game_over") {
// debugger;
                //console.log(data);
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

            } else if (data.event === "game_aborted") {

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

            } else if (data.event === "rematch_offer") {
                $("#rematchModal").modal("show");

            }
        });

        this.socket.on('playerOnline', function (data) {
            data = JSON.parse(data);

            if (!data[p1]) {
                if (self.state.orientation === "black") {
                    self.setState({
                        up_player_online: false
                    });
                } else {
                    self.setState({
                        bottom_player_online: false
                    });
                }
            } else {
                if (self.state.orientation === "black") {
                    self.setState({
                        up_player_online: true
                    });
                } else {
                    self.setState({
                        bottom_player_online: true
                    });
                }
            }
            if (!data[p2]) {
                if (self.state.orientation === "black") {
                    self.setState({
                        bottom_player_online: false
                    });
                } else {
                    self.setState({
                        up_player_online: false
                    });
                }
            } else {
                if (self.state.orientation === "white") {
                    self.setState({
                        up_player_online: true
                    });
                } else {
                    self.setState({
                        bottom_player_online: true
                    });
                }
            }

        });


        this.socket.on('playzone_start_game', function (data) {
            data = JSON.parse(data);
            //console.log(data);

            location.href = "/play/game/" + data.game_id;

        });

        if (this.state.isPlayer == true) {
            var who_online = "white";
            if (this.state.orientation === "black") {
                who_online = "black";
            }

            this.socket.emit('playerOnOff', JSON.stringify({"online": who_online, p_id: u, game_id: g}))
        }

        //  this.socket.on('playerOnOff', function (data) {


        //this.socket.emit('checkTime1', JSON.stringify(send_data))
        //    });
        /*this.socket.on('eventPlayer', function (data) {
         data = JSON.parse(data);
         console.log(data);
         if (data.isPlayer) {
         self.setState({
         isPlayer: true,
         playerColor: data.color

         });
         self.cg.set({
         movable: {
         color: data.color,
         }
         });
         }
         });*/
    }

    scrollToBottom(){
        //scroll to bottom
        var objDiv = document.querySelector(".moves");
        if (objDiv) {
            objDiv.scrollTop = objDiv.scrollHeight;
        }
    }

    tick() {
        if (this.state.who_to_move === "white") {
            this.setState({
                white_time: this.state.white_time - 100
            }, function () {
                if (this.state.white_time < 0) {
                    var send_data = {
                        data: this.game.fen(),
                        id: g,
                        player: "p1"
                    };

                    send_data.p1_won = 0;
                    send_data.p2_won = 1;
                    send_data.p1_id = p1;
                    send_data.p2_id = p2;
                    send_data.tourney_id = this.state.tourney_id;
                    //debugger;


                    this.socket.emit('checkTime1', JSON.stringify(send_data));

                } else {
                    this.setTime();
                }
            });
        } else if (this.state.who_to_move === "black") {
            this.setState({
                black_time: this.state.black_time - 100
            }, function () {
                //debugger;
                if (this.state.black_time < 0 && this.state.is_over != 1) {

                    var send_data = {
                        data: this.game.fen(),
                        id: g,
                        player: "p2"
                    };
                    send_data.p1_won = 1;
                    send_data.p2_won = 0;
                    send_data.p1_id = p1;
                    send_data.p2_id = p2;
                    send_data.tourney_id = this.state.tourney_id;
                    this.socket.emit('checkTime1', JSON.stringify(send_data));
                } else {
                    this.setTime();
                }
            });
        }
    }

    setTimer() {
        var self = this;
        if (this.timer) clearInterval(this.timer);

        this.timer = setInterval(function () {
            if (
                self.state.is_over == 0
                && self.state.is_started == 1
            ) {
                self.tick();
            } else {
                clearInterval(this.timer);
            }
        }, 100);

    }


    setTime() {
       /* var p1_minutes = Math.floor((this.state.white_time) / 60);
        var p1_secs = Math.floor((this.state.white_time) % 60 % 60);
        var p2_minutes = Math.floor((this.state.black_time) / 60);
        var p2_secs = Math.floor((this.state.black_time) % 60 % 60);*/


        var p1_minutes = Math.floor((this.state.white_time/(1000*60)));
        var p1_secs = Math.floor((this.state.white_time/1000) % 60);
        var p1_milliseconds = Math.floor((this.state.white_time % 1000 / 100).toFixed(1));

        var p2_minutes = Math.floor((this.state.black_time/(1000*60)));
        var p2_secs = Math.floor((this.state.black_time/1000) % 60);
        var p2_milliseconds = Math.floor((this.state.black_time % 1000 / 100).toFixed(1));

        p1_minutes = (p1_minutes < 0) ? 0 : p1_minutes;
        p1_secs = (p1_secs < 0) ? 0 : p1_secs;
        p2_minutes = (p2_minutes < 0) ? 0 : p2_minutes;
        p2_secs = (p2_secs < 0) ? 0 : p2_secs;

        p1_minutes = (p1_minutes < 10) ? "0" + p1_minutes : p1_minutes;
        p1_secs = (p1_secs < 10) ? "0" + p1_secs : p1_secs;
        p2_minutes = (p2_minutes < 10) ? "0" + p2_minutes : p2_minutes;
        p2_secs = (p2_secs < 10) ? "0" + p2_secs : p2_secs;

        var up_clock_minutes;
        var up_clock_seconds;
        var bottom_clock_minutes;
        var bottom_clock_seconds;
        var bottom_clock_milliseconds;
        var up_clock_milliseconds;
        // console.log(this.state.orientation);
        if (this.state.orientation === "white") {
            bottom_clock_minutes = p1_minutes;
            bottom_clock_seconds = p1_secs;
            bottom_clock_milliseconds = p1_milliseconds;
            up_clock_minutes = p2_minutes;
            up_clock_seconds = p2_secs;
            up_clock_milliseconds = p2_milliseconds;
        } else if (this.state.orientation === "black") {
            bottom_clock_minutes = p2_minutes;
            bottom_clock_seconds = p2_secs;
            bottom_clock_milliseconds = p2_milliseconds;
            up_clock_minutes = p1_minutes;
            up_clock_seconds = p1_secs;
            up_clock_milliseconds = p1_milliseconds;
        }

        if (this.state.orientation === "white" && this.state.who_to_move === "white" && this.state.is_over !== 1) {
            $(".clock_bottom").addClass("running");
            $(".clock_top").removeClass("running");

            if (this.state.white_time < 10000) {
                $(".clock_bottom").addClass("emerg");
                $(".clock_top").removeClass("emerg");
            }

        } else if (this.state.orientation === "black" && this.state.who_to_move === "white" && this.state.is_over !== 1) {
            $(".clock_top").addClass("running");
            $(".clock_bottom").removeClass("running");

            if (this.state.white_time < 10000) {
                $(".clock_top").addClass("emerg");
                $(".clock_bottom").removeClass("emerg");
            }

        } else if (this.state.orientation === "white" && this.state.who_to_move === "black" && this.state.is_over !== 1) {
            $(".clock_top").addClass("running");
            $(".clock_bottom").removeClass("running");

            if (this.state.black_time < 10000) {
                $(".clock_top").addClass("emerg");
                $(".clock_bottom").removeClass("emerg");
            }

        } else if (this.state.orientation === "black" && this.state.who_to_move === "black" && this.state.is_over !== 1) {
            $(".clock_bottom").addClass("running");
            $(".clock_top").removeClass("running");

            if (this.state.black_time < 10000) {
                $(".clock_bottom").addClass("emerg");
                $(".clock_top").removeClass("emerg");
            }

        } else {
            $(".clock_top").removeClass("running");
            $(".clock_bottom").removeClass("running");
        }

        this.setState({
            up_clock_minutes: up_clock_minutes,
            up_clock_seconds: up_clock_seconds,
            up_clock_milliseconds: up_clock_milliseconds,
            bottom_clock_minutes: bottom_clock_minutes,
            bottom_clock_seconds: bottom_clock_seconds,
            bottom_clock_milliseconds: bottom_clock_milliseconds,
        });


    }

    render() {


        return (
            <div className="mt-1 row lichess_ground lichess_board_wrap">

                <div className="col-lg-8 col-md-12">

                    <div className="clock_top">
                        <div
                            className={(this.state.up_player_online == true) ? "username user_link black online pt-2 pb-2 player_bar" : "username user_link black offline pt-2 pb-2 player_bar "}>
                            <i className="line"
                               title="Joined the game"></i>
                            <a className="text ulpt name" data-pt-pos="s" href="" target="_self">{this.state.up_name}
                                <span className="rating"> {this.state.up_tournaments_rating}
                                    {(this.state.up_rating_change) ? <span
                                            className={(this.state.up_rating_change >= 0) ? "rp up" : "rp down"}>{(this.state.up_rating_change > 0) ? "+" : ""}{this.state.up_rating_change}</span> : null}
                                </span>
                            </a>

                            <span className="time aclock">{this.state.up_clock_minutes}
                                <span className="low">:</span>
                                {this.state.up_clock_seconds}
                            </span>
                        </div>
                    </div>


                    <div className="blue merida">

                        <div id="dirty" className="cg-board-wrap"></div>
                    </div>

                    <div className="clock_bottom">
                        <div
                            className={(this.state.bottom_player_online == true) ? "username user_link black online pt-2 pb-2 player_bar" : "username user_link black offline pt-2 pb-2 player_bar "}>
                            <i className="line"
                               title="Joined the game"></i>
                            <a className="text ulpt name" data-pt-pos="s" href=""
                               target="_self">{this.state.bottom_name}
                                <span className="rating">{this.state.bottom_tournaments_rating}
                                    {(this.state.bottom_rating_change) ? <span
                                            className={(this.state.bottom_rating_change >= 0) ? "rp up" : "rp down"}>{(this.state.bottom_rating_change > 0) ? "+" : ""}{this.state.bottom_rating_change}</span> : null}
                                </span>
                            </a>

                            <span className="time aclock">{this.state.bottom_clock_minutes}
                                <span className="low">:</span>
                                {this.state.bottom_clock_seconds}
                            </span>

                        </div>
                    </div>


                </div>
                <div className="col-lg-4 col-md-12">

                    {(clientWidth > 1000) ?
                        <div className="table_wrap">

                            <div className="clock clock_top">
                                <div className="time">{this.state.up_clock_minutes}
                                    <span className="low">:</span>
                                    {this.state.up_clock_seconds}.<span className="small-bottom">{this.state.up_clock_milliseconds}</span>
                                </div>
                                <div className="bar"></div>
                            </div>


                            <div className="table">
                                <div>
                                    <div
                                        className={(this.state.up_player_online == true) ? "username user_link black online" : "username user_link black offline"}>
                                        <i className="line"
                                           title="Joined the game"></i><a
                                        className="text ulpt" data-pt-pos="s" href=""
                                        target="_self">{this.state.up_name}</a>
                                        <span className="rating">{this.state.up_tournaments_rating}
                                            {(this.state.up_rating_change) ? <span
                                                    className={(this.state.up_rating_change >= 0) ? "rp up" : "rp down"}>{(this.state.up_rating_change > 0) ? "+" : ""}{this.state.up_rating_change}</span> : null}
                                    </span>
                                    </div>


                                    <div className="replay">
                                        <div className="buttons">
                                            <button className="fbt flip hint--top" data-hint="Перевернуть доску"
                                                    data-act="flip" disabled><span data-icon="B"></span></button>
                                            <nav>
                                                <button className="fbt" data-icon="W" data-ply="0" disabled></button>
                                                <button className="fbt" data-icon="Y" data-ply="28" disabled></button>
                                                <button className="fbt" data-icon="X" data-ply="30" disabled></button>
                                                <button className="fbt" data-icon="V" data-ply="39" disabled></button>
                                            </nav>
                                            <button className="fbt  hint--top" data-hint="Перевернуть доску"
                                                    data-act="" disabled><span data-icon=""></span></button></div>
                                        <div className="moves">


                                        </div>
                                    </div>


                                    {(this.state.isPlayer) ?

                                        <div>
                                            {(this.state.is_over == 1) ?
                                                <div className="control buttons">
                                                    <div className="follow_up">
                                                        <a className="text fbt strong glowed" onClick={this.rematchClick} data-icon="G"
                                                           href={this.state.tourney_href}>{this.state.tourney_text}</a></div>
                                                </div> :

                                                <div className="control icons ">
                                                    <button disabled className="fbt hint--bottom takeback-yes"
                                                            data-hint="Попросить соперника вернуть ход">
                                                        <span data-icon="i"></span>
                                                    </button>
                                                    <button className="fbt hint--bottom draw-yes" disabled
                                                            data-hint="Предложить ничью">
                                                        <span data-icon="2"></span>
                                                    </button>

                                                    <button className="fbt hint--bottom resign-confirm"
                                                            onClick={this.resign} data-hint="Сдаться"><span
                                                        data-icon="b"></span></button>
                                                </div>
                                            }
                                        </div>
                                        : null}

                                    <div
                                        className={(this.state.bottom_player_online == true) ? "username user_link black online" : "username user_link black offline"}>
                                        <i className="line" title="Joined the game"></i>
                                        <a className="text ulpt" data-pt-pos="s" href="" target="_self">
                                            {this.state.bottom_name}
                                        </a>
                                        <span className="rating">{this.state.bottom_tournaments_rating}</span>
                                        <span
                                            className={(this.state.bottom_rating_change >= 0) ? "rp up" : "rp down"}>
                                        {(this.state.bottom_rating_change > 0) ? "+" : ""}{this.state.bottom_rating_change}</span>
                                    </div>
                                </div>

                            </div>

                            <div className="clock clock_bottom">
                                <div className="bar"></div>
                                <div className="time">{this.state.bottom_clock_minutes}
                                    <span className="low">:</span>
                                    {this.state.bottom_clock_seconds}.<span className="small-bottom">{this.state.bottom_clock_milliseconds}</span>
                                </div>
                            </div>
                        </div>

                        : null}

                    {this.state.p1_won == 1 ?
                        <div className="alert alert-secondary mt-1 mb-1 " ><b>Белые выиграли</b>
                        </div> : null
                    }

                    {this.state.p2_won == 1 ?
                        <div className="alert alert-secondary mt-1 mb-1 " ><b>Черные выиграли</b>
                        </div> : null
                    }
                    {this.state.p2_won == 0.5 ?
                        <div className="alert alert-secondary mt-1 mb-1 " ><b>Ничья</b>
                        </div> : null
                    }

                    {(this.state.is_started === 1 || this.state.is_over === 1) ? null :
                        <div>
                            {(this.state.moves.length == 0) ?
                                <div className="alert alert-danger mt-1 mb-1 " id="timeleft_white">Время на ход белых: <Timer/></div> : null}

                            {(this.state.moves.length == 1) ?
                                <div className="alert alert-danger mt-1 mb-1 " id="timeleft_black">Время на ход черных: <Timer/></div> : null}
                        </div>
                    }

                    {(clientWidth < 1000) ?

                        <div>{(this.state.isPlayer) ?

                            <div>
                                {(this.state.is_over == 1) ?
                                    <div className="control buttons">
                                        <div className="follow_up"><a className="text fbt strong glowed" data-icon="G" onClick={this.rematchClick}
                                                                      href={this.state.tourney_href}>{this.state.tourney_text}</a></div>
                                    </div> :

                                    <div className="control icons ">
                                        <button disabled className="fbt hint--bottom takeback-yes"
                                                data-hint="Попросить соперника вернуть ход">
                                            <span data-icon="i"></span>
                                        </button>
                                        <button className="fbt hint--bottom draw-yes" disabled
                                                data-hint="Предложить ничью">
                                            <span data-icon="2"></span>
                                        </button>

                                        <button className="fbt hint--bottom resign-confirm" onClick={this.resign}
                                                data-hint="Сдаться"><span data-icon="b"></span></button>
                                    </div>
                                }
                            </div>
                            : null}</div>
                        : null
                    }




                    <div className="side_box padded">
                        <div className="players">

                            <div className="player color-icon is white text">
                                <a className="user_link ulpt" href="">{p1_name}&nbsp;{p1_tournaments_rating}</a>
                            </div>

                            <div className="player color-icon is black text">
                                <a className="user_link" href="">
                                    {p2_name}&nbsp;{p2_tournaments_rating}</a>
                            </div>

                        </div>
                    </div>

                    <div>
                        <button className="fbt mobile-btn d-lg-none" onClick={this.goBack} data-icon="Y" data-ply="28"></button>
                        <button className="fbt mobile-btn d-lg-none" onClick={this.goForward} data-icon="X" data-ply="30" disabled=""></button>
                    </div>

                    {/*<a href="" className="btn btn-light mt-2">Скачать pgn</a>*/}
                </div>
            </div>
        );
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





render(
    <App/>
    , document.getElementById('game'));

/*
 render(
 <Timer/>
 , document.getElementById('timer'));
 */
