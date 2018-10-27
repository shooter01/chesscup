

const Sounds = {
    "capture" : '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',
    "move" : '//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAAIKABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQECAgICAgICAgICAgICAgICAgICAgICAgICAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwP////////////////////////////////8AAAA5TEFNRTMuOTlyAc0AAAAAAAAAABSAJAVSQgAAgAAACCjzj7vYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQxAAAFOIA/BSUAAM0J+f3O6ACnNee0ogQCsVgmCYbJ5EAIAAwA4Lw/FxcXFzzBQUFKkXDsG4NAaA0DwUFEpxQUMT/R3d3+EFxd+ET9CBQUFET93LPfQXFxc975cUMqXd33e/9EFxc9+E3FBQUFEqXPFBQUMRK9/REREFxc93/9yxcXFxd7//5LFBQUMT4IFxc+4REFBcXfROSxQUM3FxeyAbh/aEIm4oZJYuLi78u7vpUoif7i4NA8MqEUCgUmw5mwxoNhsJACu4ZhgHRgyZZgWHIqqZeueMkxHM3y1Ndq6MJCDUfBwJhxhGHwQG3JpGEgxquXQa8Wm4eW6emVT1JSdI4cNeZk6PGC4Bk3Nhl9JGQ4WbEuhXCzIjC4SeTSqfnfyTVMiVFg6ZZiyIOGytFpuavMMu/hmknPx9l6/H3RSdhsbcGwwn////5HSXutcsceZ9ExXVbLCcf/////8qnIft4P/P4WLUuhp0p+5DTvf//////9PL87dfvc+4cpaaNVvuY8x3ZAY1sAj/aoARfMwK00MOzT2PPZaEIuJpt//uSxAwDlxC1Jj3NgAMXQSOBzA4obGAHUb9qB4GsGvUkZXCgCK5mxMmslOaUQJy6GahFHgqBkZEYiGmQGpkRqLFpgIYAAR2CYPXiX6CgeY0hmWEIiCSYCAIAgCWs3YvM0JpTCoo1qWxxiS7nulr4y53X9fWd5rK7WiUaymZbKbNLlvX2sameda1TU2V/uNKHSoabaNFxqpYOvxRMRSNGRc5vJUAV1R/01N7RD56ISzzor9/+MtOM44/aRjFwrMNhAxALQQJzCgTMxo0zUmDLZLMwGQyeVjCYiJBOkWBiWCCgYpOxmQCiEHAIFoyHexxmywvtcR4LxFwxiIdgYAAxCEKDoWajDIXxe10npbx9Y9F5REfjMTeW9MUvaOd3n+71nHEcX3wYkTVCOKrBQB0E54EZaIzUZkKxyL+zpMp94k4iRpmUM37JWJbDs1kbn+pmU1tJ80KTe6vzMoUlj6jmebY9DCFc61cWk4S9MuEi22ImrIpA3dIRsxDYK5UgACkkIJw1ebyNAQDLYlUILMCAHBKiaYHDIIYGHmVFAOCAEFJxmP/7ksQTARYZoyDtmHkK80FiQc0Y+QAoQKostmh9+XKo1yrFhhypQ6UnYa12MRKPQ0+rq3qtn/yrAx/a3AKJ2HGAFbVUkzABWLJdDSJpToQDgG1MPOYg23FqRIIEAN8SqWQMghv8dzmsuG1YzvEKZZrLDJLl9J/wXI8pEzqUnqX6ab118/POXX8Eh0yOBVdZlIgO+8vq9VaVOc5aw/zssmDXMaHoOW1SeMFBswiJjBQHMomQKqS1RjyJ3NJ2JZqg4GCsCkJc5SKRUta0/WEu3YmKfUZp3FrurGsiJGsSRY9MgeQWRKJbm5ICZZRZtOpKC4mZ7dLC1PM1m4+2YmcnLmJEZR2NnJfNmteXqn1AdB+HVszmouWjOU1bOa15T/GNRgKdnb/y1xTvOPG8pLZze88j3zadudmHJQspKvhrbeVpY2tk0peSRjXajxiFlbaCWepb6RFWdhaJItTmWOUASZNrURSGeaCoB6MOdM8QyFwq8SKGGKGCIlpmqbMpgiNhwCKJjSVogwEmNJGlOUaWYmicXCREtBctvyqLhaJx6kmvKNj/+5LEIoPUPdz6TJhvwAAANIAAAARaJ0VMUaVcrDVqQoKDQ1n5sFBOMKWH//soNBxIYGgpaR2GrA6Tax1DBnGFKhiQwQcSCcmuUpNSZaTVDVrSP81DAnIy/thq1QUFBoZNSZaR//zKUmAQwIWMwSDx79RMQU1FMy45OS41qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq',
    "endgame" : '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BlFoh4H/+5IE6QAC0SDI6yEaoF/NWPpgA1RK9K8lpLxkQYKWI/TAjOkKtAAMKWqtS916baVbyrZUNak5S1LUlWy3CgKrDZvM+Ma/dYx5/Vb9m//t4zKl4/S9Z9UpqXYK+w/Kq8Y+T/bY/Jcy3L/PKfqRO02vQp01hpaqs6DmF1RR0UEkv/+p59fl//////oPKWoxwovqUpQvMWUNGzhYZx3wrZ9odo8dWRcotJYelpH1LneP9md2uR/Oz315pizzzFT5uiNj3Vv3WtuPavbYZcP3ldzgIRCX2VwqDkCsEQ8npE+tcv1qL+aJ+U8hfhXz5TU2/tbKtmlyko9UKjnRCvZLHlMYSVVdqmKxlms0ubpvulZsmO/JxlcatJTZVFmEYo+THDKbcRmLKE0hGWgGI0mVnAo6mGmgpakACkREVGed69F8z/S+Z//Xs3OLJS1dyq/36hHGJyUVh0cGfrNjgl8QjBq5ZKpPpq25yOc0/j7P/l/D5P+5LY5rLLVtSe6k5q2co/s0yxvYGSIUjgySJCfpmkw0cdH9k0WtxMjmsQwDlvf2ea+Y//uSBO6JEvFrxLEBNfJcLZimCGbOCsWzCACNnsFutqFkESfY7bTo4MfzL+/S8Hv2Q4OejyjF6Zvs5Bkz+/n/09/ZNNnJts0vXJli3LbNYt+yFu2jOG4mIEzrpisJyY9JRy8QBwHsKSyerzU0B0GpkjskkWjfciBCEIVCEpCcQnhCEITCIQhchf4RCELIQj/h/xf//4eEw7li//xCEJ/mH/z//+eYf//Zm+qqqqs3AzMzdVVUmaAQpgp8n//zE///////mH8vhDMKh+qrhTz+9ARVUBEqoUBqrAIGJDNAIUYUSoCAnhQGGFEhiMgwptdfhqTbM3szMX+UOTNes0utbpZW0Oj5cuaelpcdCUIQJGJJLOmJyEoUnASgdJq0klk6fJJ9tUxBTUUzLjk5LjVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kgT3gPMIbUHII0+wXI2oIAAs4gk9pweAhHfJpDaegBGz2FVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=',
    "lowtime" : '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'
}



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
    aa.add( 'endgame', 1,[[]]);
    aa.add( 'lowtime', 1,[[]]);

})();


class App {
    constructor(props) {

        const self = this;

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
            timeleft : timeleft,
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
        this.move = this.move.bind(this);

        //ряды ходов
        this.row = 0;
        this.temp_move = this.state.moves.length - 2;
        self.resignCount = 0;
        self.drawCount = 0;
        self.lowTimePlayed = false;

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
        console.log(width);
        const dirty = $('#dirty');
        dirty.width(width).height(width);
        $(".player_bar").width(width);


        this.setState({
            who_to_move: (this.game.turn() === 'w') ? "white" : "black"
        });



        this.$clock_bottom_time = $(".clock_bottom_time");
        this.$clock_top_time = $(".clock_top_time");
        this.$clock_top = $(".clock_top");
        this.$clock_bottom = $(".clock_bottom");
        this.$moves = $(".moves");
        this.$timeleft_black = $("#timeleft_black");
        this.$timeleft_white = $("#timeleft_white");

        this.cg = Chessground(dirty[0], {
            fen: this.game.fen(),
            turnColor: (this.game.turn() === 'w') ? "white" : "black",
            orientation: (this.state.isPlayer) ? this.state.playerColor : "white",
            highlight: {
                lastMove: true,
                check: true
            },
            animation: {
                enabled: false,
                duration: 0,
            },
            movable: {
                showDests: true,
                free: false,
                dests: (this.state.isPlayer) ? getDests(self.game) : null,
                color: (this.state.isPlayer) ? this.state.playerColor : null,
            },
            events: {
                move: self.move
            }
        });

        setTimeout(function () {
            self.socketIOConnect();
            self.setNames();
            self.setTime();
            self.setIsOver();
            self.checkMobile();
            self.setTimer();
            self.setListeners();

            //если ходов нет, очищаем массив
            if (self.state.moves && self.state.moves.length) {

                if (self.state.moves[0] === "") {
                    self.setState({
                        moves : []
                    });
                } else {
                    self.fillMoves();
                    self.scrollToBottom();

                }

            }

            self.setInitialTimers();
            self.setRunning();
        }, 2000)







    }

    move(source, target, promotion) {
        const self = this;

        // see if the move is legal
        const move = self.game.move({
            from: source,
            to: target,
            promotion: this.state.promotion
        });

        // illegal move
        if (move === null) {
            self.game.undo();
            this.cg.set({fen: self.game.fen()});
            return false;
        }

        if (this.state.is_started !== 0) {
            this.$timeleft_white.addClass("hidden");
            this.$timeleft_black.addClass("hidden");
        }


        this.cg.set({
            turnColor: (this.game.turn() === 'w') ? "white" : "black",
            movable: {
                dests: getDests(self.game),
            }
        });

        const newState = {
            who_to_move: (this.game.turn() === 'w') ? "white" : "black",
        };

        self.setState(newState);

        let send_data = {
            data: self.game.fen(),
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
        if (self.game.in_checkmate() === true) {
            send_data.is_over = 1;
            send_data.p1_won = (this.game.turn() === "w") ? 0 : 1;
            send_data.p2_won = (this.game.turn() === "b") ? 0 : 1;
            send_data.p1_id = p1;
            send_data.p2_id = p2;
            send_data.tourney_id = this.state.tourney_id;
        } else if (self.game.in_draw() === true) {
            send_data.is_over = 1;
            send_data.p1_won = 0.5;
            send_data.p2_won = 0.5;
            send_data.p1_id = p1;
            send_data.p2_id = p2;
            send_data.tourney_id = this.state.tourney_id;
        } else {
            // check?
            if (self.game.in_check() === true) {
                self.cg.set({
                    check: true,
                    state: {
                        check: true,
                    }
                });
            }
        }

        this.socket.emit('eventServer', JSON.stringify(send_data));


    }


    setState(new_state, callback){
        Object.assign(this.state, new_state);
        if (callback) callback.apply(this);
    }


    checkMobile(){
        if (clientWidth < 1000) {
            $(".mobile-controls").removeClass("hidden");
        } else {
            $(".table_wrap").removeClass("hidden");
        }
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
            $(".bottom_name").html(this.state.p1_name);
            $(".up_name").html(this.state.p2_name);
        } else {
            $(".up_name").html(this.state.p1_name);
            $(".bottom_name").html(this.state.p2_name);
        }


        $(".p1_name").html(this.state.p1_name);
        $(".p2_name").html(this.state.p2_name);
    }

    rematchClick(event){
        const self = this;
        //const element = $(event.target);
        this.socket.emit('rematch_game', JSON.stringify({
            "user_id" : u,
            "user_name" : user_name,
            "enemy_id" : (u == p1) ? p2 : p1,
        }));
    }

    setIsOver(){
        const self = this;
        //если игра завершена
        if (this.state.is_over === 1) {
            $(".players-btns").addClass("hidden");

            if (this.state.isPlayer){
                $(".rematch").removeClass("hidden");
            }

            //выиграли белые
            if (this.state.p1_won === 1) {
                $(".p1_won").removeClass("hidden");
            } else if (this.state.p2_won === 1) {
                $(".p2_won").removeClass("hidden");
            } else if (this.state.p2_won === 0.5) {
                $(".p2_draw").removeClass("hidden");
            }

            if (this.state.isPlayer && this.state.tourney_id === null) {
                $(".tourney_text").text("РЕВАНШ");
                $(".rematch").on("click", function (event) {
                    self.rematchClick();
                    return false;
                });
            }


            self.setState({
                bottom_rating_change: (typeof rating_change_p1 != "undefined") ? rating_change_p1 : 0,
                up_rating_change: (typeof rating_change_p2 != "undefined") ? rating_change_p2 : 0,
            });

            self.cg.set({
                movable: {
                    color: null
                },
                turnColor: null
            });

            //скрываем все управляющие кнопки
            $(".control.buttons").not(".rematch").addClass("hidden");

            if (this.state.isPlayer) {
                aa.play('endgame');
            }


        } else {
            //если партия не завершена
            if (this.state.isPlayer){
                $(".players-btns").removeClass("hidden");
            }
        }
    }

    fillMoves(){
        for (let i = 0; i < this.state.moves.length; i++) {
            if ($.trim(this.state.moves[i]) != "") {
                this.addMove(this.state.moves[i], i);
            }
        }
        if (this.state.moves.length > 2) {
            $(".draw-yes").removeAttr("disabled")
        }
    }

    setTimer() {
        const self = this;
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

    resign(button) {
        // var element = this;

        var self = this;
        var element = $(button);
        //var value = event.target.value;


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

        } else {
            element.closest(".control").addClass("confirm");
            element.addClass("yes active");
            element.wrap($("<div class='act_confirm resign'></div>"));

        }


        setTimeout(function () {
            if (self.state.is_over == 0) {
                element.unwrap();
                element.closest(".control").removeClass("confirm");
                element.removeClass("yes active");
            }
            self.resignCount = 0;
        }, 3000);
    }
    draw(button) {
        // var element = this;

        const self = this;
        const element = $(button);
        //var value = event.target.value;


        self.drawCount++;
        console.log(self.drawCount);
        if (self.drawCount > 1) {
            self.socket.emit('draw_offer', JSON.stringify({
                "enemy_id" : (u == p1) ? p2 : p1,
                "game_id" : g
            }));

            $(".pending").parent().removeClass("hidden");
            $(".negotiation").parent().addClass("hidden");
            element.unwrap();
            element.closest(".control").removeClass("confirm");
            element.removeClass("yes active");
            self.drawCount = 0;
            clearTimeout(this.drawTimeout);
            $(".draw").attr("disabled", "disabled");

        } else {
            element.closest(".control").addClass("confirm");
            element.addClass("yes active");
            element.wrap($("<div class='act_confirm resign'></div>"));

            this.drawTimeout = setTimeout(function () {
                if (self.state.is_over == 0) {
                    element.unwrap();
                    element.closest(".control").removeClass("confirm");
                    element.removeClass("yes active");
                }
                self.drawCount = 0;
            }, 3000);

        }

    }

    tick() {
        if (this.state.who_to_move === "white") {
            this.setState({
                white_time: this.state.white_time - 100
            }, function () {
                if (this.state.white_time < 0) {
                    let send_data = {
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

                    let send_data = {
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

    setTime(){
        let p1_minutes = Math.floor((this.state.white_time/(1000*60)));
        let p1_secs = Math.floor((this.state.white_time/1000) % 60);
        let p1_milliseconds = Math.floor((this.state.white_time % 1000 / 100).toFixed(1));

        let p2_minutes = Math.floor((this.state.black_time/(1000*60)));
        let p2_secs = Math.floor((this.state.black_time/1000) % 60);
        let p2_milliseconds = Math.floor((this.state.black_time % 1000 / 100).toFixed(1));

        p1_minutes = (p1_minutes < 0) ? 0 : p1_minutes;
        p1_secs = (p1_secs < 0) ? 0 : p1_secs;
        p2_minutes = (p2_minutes < 0) ? 0 : p2_minutes;
        p2_secs = (p2_secs < 0) ? 0 : p2_secs;

        p1_minutes = (p1_minutes < 10) ? "0" + p1_minutes : p1_minutes;
        p1_secs = (p1_secs < 10) ? "0" + p1_secs : p1_secs;
        p2_minutes = (p2_minutes < 10) ? "0" + p2_minutes : p2_minutes;
        p2_secs = (p2_secs < 10) ? "0" + p2_secs : p2_secs;

        let up_clock_minutes;
        let up_clock_seconds;
        let bottom_clock_minutes;
        let bottom_clock_seconds;
        let bottom_clock_milliseconds;
        let up_clock_milliseconds;
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


        if (this.state.white_time < 10000) {
            if (this.state.orientation === "white") {
                this.$clock_bottom.addClass("emerg");
                //this.$clock_top.removeClass("emerg");
                /*if (this.state.isPlayer && this.lowTimePlayed === false) {
                 aa.play('lowtime');
                 this.lowTimePlayed = true;
                 }*/
            } else {
                this.$clock_top.addClass("emerg");
                //this.$clock_bottom.removeClass("emerg");
            }
        }

        if (this.state.black_time < 10000) {
            if (this.state.orientation === "white") {
                this.$clock_top.addClass("emerg");
                //this.$clock_bottom.removeClass("emerg");

            } else {
                this.$clock_bottom.addClass("emerg");
                //this.$clock_top.removeClass("emerg");

            }
        }



        this.$clock_top_time.html(up_clock_minutes + '<span class="low">:</span>' + up_clock_seconds + "." + '<span class="small-bottom">' + up_clock_milliseconds + '</span>');
        this.$clock_bottom_time.html(bottom_clock_minutes + '<span class="low">:</span>' + bottom_clock_seconds + "." + '<span class="small-bottom">' + bottom_clock_milliseconds + '</span>');


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

            const is_over = (data.is_over == 1);

            /* if (is_over) {
             self.defeat_sound.play()
             }*/

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
                    self.addMove(data.san);
                    self.scrollToBottom();

                });

                if (data.captured) {
                    aa.play('capture');
                } else {
                    aa.play('move');
                }
            }
        });

        if (this.state.is_started === 1) {
            self.$timeleft_black.addClass("hidden");
            self.$timeleft_white.addClass("hidden");
            if (this.state.moves.length > 2) {
                $(".draw-yes").removeAttr("disabled")
            }
            self.setRunning();
        } else {
            if (this.state.moves.length === 0) {
                self.$timeleft_white.removeClass("hidden");
            }
            if (this.state.moves.length === 1) {
                self.$timeleft_black.removeClass("hidden");
                self.$timeleft_white.addClass("hidden");
                self.startTimer();
            }
        }
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
            //self.move_sound.play();

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


    setRunning(){
        const self = this;
        if (this.state.orientation === "white" && this.state.who_to_move === "white" && this.state.is_over !== 1) {
            this.$clock_bottom.addClass("running");
            this.$clock_top.removeClass("running");

        } else if (this.state.orientation === "black" && this.state.who_to_move === "white" && this.state.is_over !== 1) {
            this.$clock_top.addClass("running");
            this.$clock_bottom.removeClass("running")
        } else if (this.state.orientation === "white" && this.state.who_to_move === "black" && this.state.is_over !== 1) {
            this.$clock_top.addClass("running");
            this.$clock_bottom.removeClass("running");
        } else if (this.state.orientation === "black" && this.state.who_to_move === "black" && this.state.is_over !== 1) {
            this.$clock_bottom.addClass("running");
            this.$clock_top.removeClass("running");
        } else {
            this.$clock_top.removeClass("running");
            this.$clock_bottom.removeClass("running");
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
                //self.capture_sound.play();
            } else {
                //self.move_sound.play();
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

    addMove(san, i){
        let m = i;
        if (typeof m === "undefined"){
            m = this.state.moves.length - 1;
        }
        if (m % 2 == 0) {
            this.$moves.append($("<index>" + ++this.row + "</index>"));
        }
        this.$moves.append($("<move>" + san + "</move>"))
    }

    setInitialTimers(){
        const self = this;
        //debugger
        if (this.state.is_started !== 1 && this.state.is_over !== 1){
            if (this.state.moves.length === 0) {
                self.$timeleft_white.removeClass("hidden");
                self.startTimer();
            }
            if (this.state.moves.length === 1) {
                self.$timeleft_black.removeClass("hidden");
                self.$timeleft_white.addClass("hidden");
                self.startTimer();
            }
        }
    }

    startTimer(){
        const self = this;
        this.initial_timer = this.state.timeleft/1000;
        clearInterval(self.start_interval);
        this.start_interval = setInterval(function () {
            const minutes = Math.floor((self.initial_timer) / 60);
            const secs = Math.floor((self.initial_timer) % 60 % 60);
            if (self.initial_timer >= 0 && self.state.is_started === 0) {
                $(".timeleft").html(minutes + ":" + secs);
                --self.initial_timer;
            } else {
                clearInterval(self.start_interval);
                $(".timeleft").html("00:00");
                if (self.state.is_started === 1) {
                    self.$timeleft_black.addClass("hidden");
                    self.$timeleft_white.addClass("hidden");
                }
            }
        }, 1000);
    }

    scrollToBottom(){
        //scroll to bottom
        const objDiv = document.querySelector(".moves");
        if (objDiv) {
            objDiv.scrollTop = objDiv.scrollHeight;
        }
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
            self.setIsOver();
            self.setTime();
        });

        self.cg.set({

            movable: {
                color: null
            },
            turnColor: null
        });

        self.defeat_sound = $("#defeat_sound")[0];

        self.$timeleft_black.addClass("hidden");
        self.$timeleft_white.addClass("hidden");

    }
    socketGameAborted(data){
        const self = this;

        clearInterval(self.timer);
        self.setState({
            is_over: data.is_over
        }, self.setIsOver);

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
        data = data.players;
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
    decline_draw(data){
        const self = this;
        console.log(data);

        $(".pending").parent().addClass("hidden");
        $(".negotiation").parent().addClass("hidden");


    }
    draw_offer(data){
        const self = this;
        console.log(data);

        $(".draw").parent().removeClass("hidden").attr("disabled", "disabled");
        $(".negotiation").parent().removeClass("hidden");
        $("body").off("click.draw_accept").on("click.draw_accept", ".accept", function () {
            var send_data = {
                data: self.game.fen(),
                id: g,
                is_over: 1,
                player: (self.state.who_to_move === 'white') ? "p1" : "p2", //кто должен ходить
            };
            send_data.is_over = 1;
            send_data.p1_won = 0.5;
            send_data.p2_won = 0.5;
            send_data.p1_id = p1;
            send_data.p2_id = p2;
            send_data.tourney_id = self.state.tourney_id;
            self.socket.emit('eventServer', JSON.stringify(send_data));
        });

        $("body").off("click.decline_draw").on("click.decline_draw", ".decline", function () {
            self.socket.emit('decline_draw', JSON.stringify({
                game_id : g
            }));
        });

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
            //data = JSON.parse(data);
            //  debugger;
            self.cg.set({
                check: false,
                state: {
                    check: false,
                }
            });

            console.log(data);

            if (data.event === "move") {
                self.socketMove(data);

            } else if (data.event === "rating_change") {

                self.socketRatingChange(data);

            }
            else if (data.event === "game_over") {
                self.socketGamerOver(data);


            }
            else if (data.event === "game_aborted") {

                self.socketGameAborted(data);

            }
            else if (data.event === "rematch_offer") {
                self.socketRematchOffer(data);

            }
            else if (data.event === "playerOnline") {
                self.socketPlayerOnline(data);
            }
            else if (data.event === "playzone_start_game") {
                self.playzoneStartGame(data);
            }
            else if (data.event === "draw_offer") {
                self.draw_offer(data);
            }
            else if (data.event === "decline_draw") {
                self.decline_draw(data);
            }
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

        const self = this;

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

        $("body").on("click", ".resign", function (event) {

            self.resign(this);
        });

        $("body").on("click", ".draw", function () {

            self.draw(this);
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

window.onload = function () {
    window.party = new App();
}


