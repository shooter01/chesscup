




class TournamentSockets {
    constructor(){
        var url;
        if (typeof u != "undefined") {
            url = 'h=' + u;
        } else {
            url = 'h=null';
        }
        console.log(tournament_id);
        this.socket = io(window.location.origin, {query: url + '&t1=' + tournament_id});
        console.log(this);


        this.socket.on('tournament_start', function (data) {
            console.log(data);
            data = JSON.parse(data);

            var a = 4;

            function playTournamentStart() {
                setTimeout(function () {
                    if (a >= 0){
                        $("#tournament" + a).get(0).play();
                        playTournamentStart(--a);
                    } else {
                        if (data.updated_tour == null){
                            location.href = "/tournament/" + tournament_id + "/final";
                        } else if (data.game_id) {
                            location.href = "/tournament/" + tournament_id + "/game/" + data.game_id;
                        } else {
                            location.href = "/tournament/" + tournament_id + "/tour/" + data.updated_tour;
                        }
                    }

                }, 1000)
            }


            playTournamentStart(--a);




           // $("#tournament2").get(0).play();
           // $("#tournament1").get(0).play();
           // $("#tournament0").get(0).play();





        });

    }
}

new TournamentSockets();

/*




this.socket.on('eventClient', function (data) {
    data = JSON.parse(data);
    console.log(data);
    //  debugger;

    self.cg.set({
        check: false,
        state: {
            check: false,
        }
    })

    if (data.event === "move") {
        self.game.load(data.fen);

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
});*/
