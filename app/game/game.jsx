import React from 'react';
import {render} from 'react-dom';


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
            up_rating_change: null,
            bottom_rating_change: null,
            playerColor: null,
            is_over: is_over,
            orientation: "white",

        };
        this.move = this.move.bind(this);
        this.setTime = this.setTime.bind(this);
        this.socketIOConnect = this.socketIOConnect.bind(this);
        this.tick = this.tick.bind(this);
        this.setTimer = this.setTimer.bind(this);

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


        this.cg.set({
            turnColor: (this.game.turn() === 'w') ? "white" : "black",
            movable: {
                dests: getDests(that.game),
                // color : (this.game.turn() === 'w') ? "white" : "black",
            }
        });
        that.setState({
            who_to_move: (this.game.turn() === 'w') ? "white" : "black"
        });

        var send_data = {
            data: that.game.fen(),
            id: g, move: move.san,
            is_over: 0,
        };

        // checkmate?
        if (that.game.in_checkmate() === true) {
            send_data.is_over = 1;
            send_data.p1_won = (this.game.turn() === "w") ? 0 : 1;
            send_data.p2_won = (this.game.turn() === "b") ? 0 : 1;
            send_data.p1_id = p1;
            send_data.p2_id = p2;
            send_data.tourney_id = this.state.tourney_id;
            send_data.tourney_id = this.state.tourney_id;
        } else if (that.game.in_draw() === true) {
            send_data.is_over = 1;
            send_data.p1_won = 0.5;
            send_data.p2_won = 0.5;
            send_data.p1_id = p1;
            send_data.p2_id = p2;
            send_data.tourney_id = this.state.tourney_id;
            send_data.tourney_id = this.state.tourney_id;
        } else {
            // check?
            if (that.game.in_check() === true) {

            }
        }

        this.socket.emit('eventServer', JSON.stringify(send_data));


    }

    componentDidMount() {
        var self = this;

        console.log(fen);

         if (typeof fen != "undefined" && fen != "undefined" && fen != "" && fen != null) {
             this.game = new Chess(fen);
        } else {
            // this.game = new Chess("4k3/8/3K4/6Q1/8/8/8/8 w - - 34 74");
            this.game = new Chess();
         }

        var isPlayer = false;
        var playerColor = null;
        // console.log(p1);
        // console.log(u);
        console.log(this.game.fen());

        if (typeof u != "undefined" && p1 == u) {
            isPlayer = true;
            playerColor = "white";
        } else if (typeof u != "undefined" && p2 == u) {
            isPlayer = true;
            playerColor = "black";
        }


        var width = $("#wrpr").width();
        $("#dirty").width(width).height(width);

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

            // console.log(this.state.isPlayer);
            this.cg = Chessground(document.getElementById('dirty'), {
                fen: this.game.fen(),
                turnColor: (this.game.turn() === 'w') ? "white" : "black",
                orientation: (isPlayer) ? playerColor : "white",
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
                        bottom_rating_change : rating_change_p1,
                        up_rating_change : rating_change_p2,
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
                        up_rating_change : rating_change_p1,
                        bottom_rating_change : rating_change_p2,
                    });
                }

            }




        });


        self.setTime();

    }


    socketIOConnect() {
        var self = this;
        this.socket = io(window.location.origin, {query: 'h=' + u + '&g=' + g});
        this.socket.on('eventClient', function (data) {
            data = JSON.parse(data);
            console.log(data);

            if (data.event === "move") {
                self.game.load(data.fen);

                self.setState({
                    who_to_move: (self.game.turn() === 'w') ? "white" : "black",
                    white_time: data.p1_time_left / 1000,
                    black_time: data.p2_time_left / 1000,
                    is_over: data.is_over
                }, function () {
                    self.setTime();
                    self.cg.set({
                        fen: self.game.fen(),
                        movable: {
                            dests: getDests(self.game)
                        },
                        turnColor: (self.game.turn() === 'w') ? "white" : "black"
                    });


                });
            } else if (data.event === "rating_change") {

                if (self.state.orientation === "white" && self.state.is_over === 1) {
                    self.setState({
                        bottom_rating_change : data.rating_change_p1,
                        up_rating_change: data.rating_change_p2
                    });
                } else if (self.state.orientation === "black" && self.state.is_over === 1) {
                    self.setState({
                        bottom_rating_change : data.rating_change_p2,
                        up_rating_change: data.rating_change_p1
                    });
                }





            }
        });

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

    tick() {
        if (this.state.who_to_move === "white") {
            this.setState({
                white_time: --this.state.white_time
            }, function () {
                this.setTime();
            });
        } else if (this.state.who_to_move === "black") {
            this.setState({
                black_time: --this.state.black_time
            }, function () {
                this.setTime();
            });
        }
    }

    setTimer() {
        var self = this;
        if (this.timer) clearInterval(this.timer);

        this.timer = setInterval(function () {
            if (self.state.is_over == 0) {
                self.tick();
            }
        }, 1000);

    }

    setTime() {
        var p1_minutes = Math.floor((this.state.white_time) / 60);
        var p1_secs = Math.floor((this.state.white_time) % 60 % 60);
        var p2_minutes = Math.floor((this.state.black_time) / 60);
        var p2_secs = Math.floor((this.state.black_time) % 60 % 60);

        p1_minutes = (p1_minutes < 10) ? "0" + p1_minutes : p1_minutes;
        p1_secs = (p1_secs < 10) ? "0" + p1_secs : p1_secs;
        p2_minutes = (p2_minutes < 10) ? "0" + p2_minutes : p2_minutes;
        p2_secs = (p2_secs < 10) ? "0" + p2_secs : p2_secs;

        var up_clock_minutes;
        var up_clock_seconds;
        var bottom_clock_minutes;
        var bottom_clock_seconds;

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
            <div className="row">
                <div className="col-lg-8 col-md-12">

                    <div className="blue merida">
                        <div id="dirty" className="cg-board-wrap"></div>
                    </div>
                </div>
                <div className="col-lg-4 col-md-12">
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
                                <div className="username user_link black online"><i className="line"
                                                                                    title="Joined the game"></i><a
                                    className="text ulpt" data-pt-pos="s" href=""
                                    target="_self">{this.state.up_name}</a>
                                    <span className="rating">{this.state.up_tournaments_rating}
                                        {(this.state.up_rating_change) ? <span
                                                className={(this.state.up_rating_change >= 0) ? "rp up" : "rp down"}>{(this.state.up_rating_change > 0) ? "+" : ""}{this.state.up_rating_change}</span> : null}
                                    </span>
                                </div>
                                <div className="username user_link white online"><i className="line"
                                                                                    title="Joined the game"></i><a
                                    className="text ulpt" data-pt-pos="s" href=""
                                    target="_self">{this.state.bottom_name}</a>
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

                </div>
            </div>
        );
    }
}
render(
    <App/>
    , document.getElementById('game'));

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



