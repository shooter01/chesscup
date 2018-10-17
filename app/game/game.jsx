import React from 'react';
import {render} from 'react-dom';
import Timer from "../tournament/Timer.jsx";


class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            promotion: "q",
            who_to_move: null,
            isPlayer: false,
            white_time: p1_time_left / 1000,
            black_time: p2_time_left / 1000,
            tourney_id: tourney_id,
            tour_id: tour_id,
            moves: moves.split(","),
            up_rating_change: null,
            row: 0,
            bottom_rating_change: null,
            up_player_online: false,
            bottom_player_online: false,
            playerColor: null,
            tourney_href: "/tournament/" + tourney_id,
            is_over: is_over,
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

        this.resignCount = 0;

    }

    move(source, target, promotion) {
        var that = this;
        var prom = this.state.promotion;
        var piece = that.game.get(source).type;


        // see if the move is legal
        var move = that.game.move({
            from: source,
            to: target,
            promotion: prom
        });
        //  console.log(source);
        //  console.log(target);
        //  console.log(move);
        // illegal move
        if (move === null) {
            that.game.undo();
            this.cg.set({fen: that.game.fen()});
            return false;
        }


        if (move.captured) {
            this.capture_sound.play();
        } else {
            this.move_sound.play();
        }
        //  console.log(that.game.history());


        if (this.state.is_started != 0) {
            $("#timeleft_white").addClass("hidden");
        }


        this.cg.set({
            turnColor: (this.game.turn() === 'w') ? "white" : "black",
            movable: {
                dests: getDests(that.game),
                // color : (this.game.turn() === 'w') ? "white" : "black",
            }
        });

        //var a = this.state.moves;
        //a.push(move.san);

        that.setState({
            who_to_move: (this.game.turn() === 'w') ? "white" : "black",
            //moves: a,
        });

        var send_data = {
            data: that.game.fen(),
            id: g,
            move: move.san,
            captured: move.captured,
            from: move.from,
            to: move.to,
            is_over: 0,
            player: (this.game.turn() === 'w') ? "p2" : "p1", //who made the last move
        };
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
                })

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
            var valid = self.game.moves();
            var p = [];
            for (var i = 0; i < valid.length; i++) {
                var obj = valid[i];
                p.push(obj.slice(-2));
            }


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
                        bottom_rating_change: rating_change_p1,
                        up_rating_change: rating_change_p2,
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
                        up_rating_change: rating_change_p1,
                        bottom_rating_change: rating_change_p2,
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
                player: (self.state.playerColor === 'white') ? "p1" : "p2", //who made the last move
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
                    white_time: data.p1_time_left / 1000,
                    black_time: data.p2_time_left / 1000,
                    is_over: data.is_over,
                    is_started: 1,
                }, function () {
                    self.setTime();
                    self.cg.set({
                        fen: self.game.fen(),
                        lastMove: [data.from, data.to],
                        movable: {
                            dests: getDests(self.game)
                        },
                        turnColor: (self.game.turn() === 'w') ? "white" : "black"
                    });

                    self.cg.playPremove();


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
                            self.capture_sound.play();
                        } else {
                            self.move_sound.play();
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
            } else if (data.event === "game_over") {
// debugger;
                clearInterval(self.timer);
                self.setState({
                    is_over: data.is_over
                });

                self.cg.set({
                    movable: {
                        color: null
                    },
                    turnColor: null
                });

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


            /*for (var obj in data) {
             if (p1 == obj) {
             if (self.state.orientation === "black") {
             this.setState({
             bottom_player_online : true
             });
             } else {
             self.setState({
             up_player_online : true
             });
             }

             } else if (p2 == obj){
             if (self.state.orientation === "black") {
             self.setState({
             bottom_player_online : true
             });
             } else {
             self.setState({
             up_player_online : true
             });
             }
             }
             }*/

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
                white_time: --this.state.white_time
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
                black_time: --this.state.black_time
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
// console.log("test");
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
            if (self.state.is_over == 0 && self.state.is_started == 1) {
                self.tick();
            } else {
                clearInterval(this.timer);
            }
        }, 1000);

    }


    setTime() {
        var p1_minutes = Math.floor((this.state.white_time) / 60);
        var p1_secs = Math.floor((this.state.white_time) % 60 % 60);
        var p2_minutes = Math.floor((this.state.black_time) / 60);
        var p2_secs = Math.floor((this.state.black_time) % 60 % 60);

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
        // console.log(this.state.orientation);
        if (this.state.orientation === "white") {
            bottom_clock_minutes = p1_minutes;
            bottom_clock_seconds = p1_secs;
            up_clock_minutes = p2_minutes;
            up_clock_seconds = p2_secs;
        } else if (this.state.orientation === "black") {
            bottom_clock_minutes = p2_minutes;
            bottom_clock_seconds = p2_secs;
            up_clock_minutes = p1_minutes;
            up_clock_seconds = p1_secs;
        }

        if (this.state.orientation === "white" && this.state.who_to_move === "white" && this.state.is_over !== 1) {
            $(".clock_bottom").addClass("running");
            $(".clock_top").removeClass("running");
        } else if (this.state.orientation === "black" && this.state.who_to_move === "white" && this.state.is_over !== 1) {
            $(".clock_top").addClass("running");
            $(".clock_bottom").removeClass("running");
        } else if (this.state.orientation === "white" && this.state.who_to_move === "black" && this.state.is_over !== 1) {
            $(".clock_top").addClass("running");
            $(".clock_bottom").removeClass("running");
        } else if (this.state.orientation === "black" && this.state.who_to_move === "black" && this.state.is_over !== 1) {
            $(".clock_bottom").addClass("running");
            $(".clock_top").removeClass("running");
        } else {
            $(".clock_top").removeClass("running");
            $(".clock_bottom").removeClass("running");
        }

        this.setState({
            up_clock_minutes: up_clock_minutes,
            up_clock_seconds: up_clock_seconds,
            bottom_clock_minutes: bottom_clock_minutes,
            bottom_clock_seconds: bottom_clock_seconds
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
                                <span className="rating"> ({this.state.up_tournaments_rating})
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
                                <span className="rating"> ({this.state.bottom_tournaments_rating})
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
                                    {this.state.up_clock_seconds}
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
                                                    <div className="follow_up"><a className="text fbt strong glowed"
                                                                                  data-icon="G"
                                                                                  href={this.state.tourney_href}>Вернуться
                                                        к турниру</a></div>
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
                                    {this.state.bottom_clock_seconds}
                                </div>
                            </div>
                        </div>

                        : null}

                    {this.state.is_started ? null :
                        <div className="alert alert-danger mt-1 mb-1 " id="timeleft_white">Время на ход белых: <Timer/>
                        </div>}

                    {(clientWidth < 1000) ?

                        <div>{(this.state.isPlayer) ?

                            <div>
                                {(this.state.is_over == 1) ?
                                    <div className="control buttons">
                                        <div className="follow_up"><a className="text fbt strong glowed" data-icon="G"
                                                                      href={this.state.tourney_href}>Вернуться к
                                            турниру</a></div>
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
                                <a className="user_link ulpt" href="">{p1_name}&nbsp;({p1_tournaments_rating})</a>
                            </div>

                            <div className="player color-icon is black text">
                                <a className="user_link" href="">
                                    {p2_name}&nbsp;({p2_tournaments_rating})</a>
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
