import React from 'react';
import {render} from 'react-dom';


class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            promotion : "q",
            who_to_move : "white",
            isPlayer : false,
            playerColor : null,

        };
        this.move = this.move.bind(this);
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
            this.cg.set({fen : that.game.fen()});
            return false;
        }

        if (move.captured) {
            this.capture_sound.play();
        } else {
            this.move_sound.play();
        }
        console.log(that.game.history());
        var send_data = JSON.stringify({ data: that.game.fen(), id : g, move : move.san });

        this.socket.emit('eventServer', send_data);

        this.cg.set({
            turnColor : (this.game.turn() === 'w') ? "white" : "black",
            movable : {
                dests : getDests(that.game),
                // color : (this.game.turn() === 'w') ? "white" : "black",
            }
        });

        that.setState({
            who_to_move : (this.game.turn() === 'w') ? "white" : "black"
        });
    }

    componentDidMount(){
        var self =  this;
        this.game = new Chess();

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
        this.cg = Chessground(document.getElementById('dirty'), {
            turnColor : this.state.who_to_move,
            orientation : this.state.who_to_move,
            movable : {
                    showDests : true,
                    free : false,
                    dests : getDests(self.game),
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
    socketIOConnect(){
        var self =  this;
        this.socket = io(window.location.origin, {query: 'h=' + u + '&g=' + g});
        this.socket.on('eventClient', function (data) {
            console.log(data);

            self.game.load(data);

            self.cg.set({
                fen: self.game.fen(),
                turnColor:(self.game.turn() === 'w') ? "white" : "black",
                movable : {
                    dests : getDests(self.game),
                }});
        });

        this.socket.on('eventPlayer', function (data) {
            data = JSON.parse(data);
            console.log(data);
            if (data.isPlayer) {




                self.setState({
                    isPlayer : true,
                    playerColor : data.color

                });
                self.cg.set({
                    movable : {
                        color : data.color,
                    }
                });
            }
        });



    }

    render() {
        return (
            <div className="col-lg-12">

                <div className="blue merida">
                    <div id="dirty" className="cg-board-wrap"></div>
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
        var ms = game.moves({ square: s, verbose: true });
        if (ms.length)
            dests[s] = ms.map(function (m) { return m.to; });
    });
    return dests;
}



