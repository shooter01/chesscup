import React from 'react';
import {render} from 'react-dom';


class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            promotion: "q",
            who_to_move: "white",
            isPlayer: false,
            playerColor: null,

        };
        this.move = this.move.bind(this);
        this.setTime = this.setTime.bind(this);
        this.socketIOConnect = this.socketIOConnect.bind(this);

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
        console.log(source);
        console.log(target);
        console.log(move);
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
        console.log(that.game.history());
        var send_data = JSON.stringify({data: that.game.fen(), id: g, move: move.san});

        this.socket.emit('eventServer', send_data);

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
    }

    componentDidMount() {
        var self = this;

        var fenP = (typeof fen != "undefined" && fen != "") ? fen : null;
        console.log(fen);

        if (fen) {
            this.game = new Chess(fenP);
        } else {
            this.game = new Chess();
        }

        var fm = (this.game.turn() === 'w') ? "white" : "black";


        var width = $("#wrpr").width();
        $("#dirty").width(width);
        $("#dirty").height(width);



        var valid = self.game.moves();
        var p = [];
        for (var i = 0; i < valid.length; i++) {
            var obj = valid[i];
            p.push(obj.slice(-2));
        }
        console.log(this.game.fen());



        this.cg = Chessground(document.getElementById('dirty'), {
            fen: this.game.fen(),
            turnColor: (this.game.turn() === 'w') ? "white" : "black",
            orientation: this.state.who_to_move,
            movable: {
                showDests: true,
                free: false,
                dests: getDests(self.game),
                color: this.state.who_to_move,
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

    }

    socketIOConnect() {
        var self = this;
        this.socket = io(window.location.origin, {query: 'h=' + u + '&g=' + g});
        this.socket.on('eventClient', function (data) {
            console.log(data);
            data = JSON.parse(data);
            self.game.load(data.fen);
            console.log((self.game.turn() === 'w') ? "white" : "black");
            self.cg.set({
                fen: self.game.fen(),
                turnColor: (self.game.turn() === 'w') ? "white" : "black",
                movable: {
                    dests: getDests(self.game),
                }
            });



        });

        this.socket.on('eventPlayer', function (data) {
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
        });
    }

    setTime(){
        var p1_minutes =  Math.floor(p1_time_left/(1000*60));
        var p1_secs =  Math.floor((p1_time_left/1000)-(p1_minutes*60));
        var p2_minutes =  Math.floor(p2_time_left/(1000*60));
        var p2_secs =  Math.floor((p2_time_left/1000)-(p1_minutes*60));

        self.setState({
            p1_minutes : p1_minutes,
            p1_seconds : p1_secs,
            p2_minutes : p2_minutes,
            p2_seconds : p2_secs,
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
                        <div className="clock clock_black clock_top">
                            <div className="bar"></div>
                            <div className="time">{this.state.p1_minutes}
                                <span>:</span>
                                {this.state.p1_seconds}
                            </div>
                        </div>
                        <div className="table">
                            <div className="username user_link black online"><i className="line"
                                                                                title="Joined the game"></i><a
                                className="text ulpt" data-pt-pos="s" href="" target="_self">{p1_name}</a>
                                <span className="rating">{p1_tournaments_rating}</span>
                            </div>
                            <div className="table_inner">
                                <div className="replay">
                                    <div className="buttons">


                                    </div>
                                </div>
                                <div className="control buttons">
                                    <div className="follow_up"></div>
                                </div>
                                <div className="username user_link white online"><i className="line"
                                                                                    title="Joined the game"></i><a
                                    className="text ulpt" data-pt-pos="s" href="" target="_self">{p2_name}</a>
                                    <span className="rating">{p2_tournaments_rating}</span>
                                </div>
                            </div>
                        </div>
                        <div className="clock clock_white clock_bottom running">
                            <div className="bar"></div>
                            <div className="time">{this.state.p2_minutes}
                                <span className="low">:</span>
                                {this.state.p1_seconds}
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



