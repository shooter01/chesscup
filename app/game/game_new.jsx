
import Sounds from "../sounds.jsx";
import WS from "../ws";



window.s_capture = new Audio("data:audio/wav;base64," + Sounds["capture"]);
window.s_move = new Audio("data:audio/wav;base64," + Sounds["move"]);
window.s_endgame = new Audio("data:audio/wav;base64," + Sounds["endgame"]);
window.s_lowtime = new Audio("data:audio/wav;base64," + Sounds["lowtime"]);
window.s_confirmation = new Audio("data:audio/wav;base64," + Sounds["confirmation"]);

window.s_audio_capture1 = new Audio("data:audio/wav;base64," + Sounds["capture"]);
window.s_audio_move1 = new Audio("data:audio/wav;base64," + Sounds["move"]);

s_capture.volume = 0.2;
s_move.volume = 0.2;
s_endgame.volume = 0.2;
s_lowtime.volume = 0.2;
s_confirmation.volume = 0.2;
s_audio_move1.volume = 0.2;
s_audio_capture1.volume = 0.2;

const REASONS = {
    "insufficient_material" : "Недостаточно материала",
    "time_run_out" : "Время истекло",
    "stalemate" : "Пат",
    "draw" : "Ничья",
    "whitedidntmove" : "Белые не сделали ход",
    "threefold_repetition" : "Троекратное повторение позиции",
    "blackdidntmove" : "Черные не сделали ход",
    "mate" : "Мат",
    "resign" : function (p1_won) {
        if (p1_won === 0) {
            return "Белые сдались";
        } else if (p1_won === 1) {
            return "Черные сдались";
        }
    },
    "titles" : function (p1_won) {
        if (p1_won === 0) {
            return "Победа черных";
        } else if (p1_won === 1) {
            return "Победа белых";
        }else if (p1_won === 0.5) {
            return "Ничья";
        }
    },
};




/*var aa;
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

})();*/


class App {
    constructor(props) {

        const self = this;

        this.state = {
            promotion: "q",
            who_to_move: null,
            isPlayer: false,
            amount: amount,
            time_inc: time_inc,
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
            reason: reason,
            p1_won: p1_won,
            p2_won: p2_won,
            is_started: parseInt(is_started),
            orientation: "white",
            up_name: p2_name,
            p1_tournaments_rating: p1_tournaments_rating,
            p1_rating_change: (typeof p1_rating_change !== "undefined") ? p1_rating_change : null,
            bottom_name: p1_name,
            p2_tournaments_rating: p2_tournaments_rating,
            p2_rating_change: (typeof p2_rating_change !== "undefined") ? p2_rating_change : null,
            chat_id : (typeof window.chat_id != "undefined") ? window.chat_id : null,
            messages : []
        };
        this.move = this.move.bind(this);

        //ряды ходов
        this.row = 0;
        this.temp_move = this.state.moves.length - 2;
        self.resignCount = 0;
        self.drawCount = 0;
        self.rekt_count = 0;
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

        if (!this.renderPos()) {return false;}


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
        dirty.width(width).height(width).show();
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
        this.$tourney_text = $(".tourney_text");
        this.objDiv = document.querySelector(".moves");



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
        this.socketIOConnect();
        this.setNames();
        this.setRatings();
        this.setTime();
        this.setIsOver("init");
        this.checkMobile();
        this.setTimer();
        this.setListeners();
        this.getMessages();


        //если ходов нет, очищаем массив
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

        this.setInitialTimers();
        self.setRunning();

        if (this.state.isPlayer && this.state.is_started === 0 && this.state.is_over === 0) {
            s_confirmation.play();
        }

        if (this.state.is_over) {
            this.addResult();
        }

        this.game.header('White', p1_name);
        this.game.header('Black', p2_name);
        this.game.header('Site', 'chesscup.org');

        self.checkSynced();
        $('.message-input-text, .sendMessage').remove();
        this.setMatterialDiff();
        this.setTitle();
    }

    getMeta(){
        return $("head meta[name='author']").attr("content") === 'chesscup';
    }

    setMatterialDiff(){
        const self = this;
        setTimeout(function () {
            const mat_diff = getMaterialDiff(self.cg.state);
            const score = getScore(self.cg.state);

            let black_html = $("<div>");
            let white_html = $("<div>");

            if (clientWidth < 1000) {
                black_html.html("<score>Black: </score>");
                white_html.html("<score>White: </score>");
            }

            for (var obj in mat_diff.black) {
                black_html.append($("<tomb><mono-piece class='" + obj + "'></mono-piece></tomb>"));
            }

            for (var obj in mat_diff.white) {
                white_html.append($("<tomb><mono-piece class='" + obj + "'></mono-piece></tomb>"));
            }

            if (score > 0) {
                white_html.append($("<score>+" + Math.abs(score) + "</score>"));
            } else if (score < 0) {
                black_html.append($("<score>+" + Math.abs(score) + "</score>"));
            }

            if (self.state.orientation === "white") {
                $("#up_cemetry").html(black_html);
                $("#bottom_cemetry").html(white_html);
            } else {
                $("#up_cemetry").html(white_html);
                $("#bottom_cemetry").html(black_html);
            }
        }, 10);

    }

    getElem(){
        return $("#app").length;
    }

    getPos(){
        return location.host;
    }

    renderPos(){
        var host = this.getPos();
        var app = this.getElem();
        var meta = this.getMeta();

        var l = "l";
        var c = "c";
        var e = "e";
        var a = "a";
        var h = "h";
        var o = "o";
        var g = "g";
        var u = "u";
        var p = "p";
        var r = "r";
        var s = "s";
        var t = "t";
        var c7 = "7";
        var c0 = "0";
        var h1 = [":", c7, c0, c0, c0].join("");
        var lh = l+o+c+a+l+h+o+s+t;

        var position2 = lh + "" + h1;
        var position3 = c+h+e+s+s+c+u+p + "." + o+r+g;
        if ((position2 != host && position3 != host) || !app || !meta) {
            this.renderPos = function () {
                return false;
            };
            return false;
        } else {
            this.renderPos = function () {
                return true;
            };
            return true;
        }
    }

    downloadPgn(){

        const filename = "chesscup.org_" + g + ".pgn";
        const pgn = this.game.pgn();
        let element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.game.pgn()));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
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
            action : "eventServer",
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
            send_data.reason = "mate";
            send_data.tourney_id = this.state.tourney_id;
        } else if (self.game.in_draw() === true) {
            send_data.is_over = 1;
            send_data.p1_won = 0.5;
            send_data.p2_won = 0.5;
            send_data.p1_id = p1;
            send_data.p2_id = p2;

            if (self.game.in_stalemate()){
                send_data.reason = "stalemate";
            } else if (self.game.in_threefold_repetition()){
                send_data.reason = "threefold_repetition";
            } else if (self.game.insufficient_material()){
                send_data.reason = "insufficient_material";
            }

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

        self.socket.ws.send(JSON.stringify(send_data));

    }

    //проверяем текущую позицию с позицией на сервере
    checkSynced(){
        const self = this;
        if (self.state.is_started === 0) {
            self.sync_timer = setInterval(function () {

                if (self.state.is_started === 1 || self.state.is_over == 1) {
                    clearInterval(self.sync_timer);
                } else {
                    self.socket.ws.send(JSON.stringify({
                        action : "check_sync",
                        game_id : g,
                        moves_length : self.game.history().length
                    }));
                }

            }, 1000);

        }

    }


    setState(new_state, callback){
        Object.assign(this.state, new_state);
        if (callback) callback.apply(this);
    }


    checkMobile(){
        if (clientWidth < 960) {
            $(".mobile-controls").removeClass("hidden");
            // $("#lichess_ground").append($("#chat_side"));

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

    setRatings(){

        var $up_rating_change = $(".up_rating_change");
        var $bottom_rating_change = $(".bottom_rating_change");

        if (this.state.orientation === "white") {

            $(".up_tournaments_rating").html(this.state.p2_tournaments_rating);
            $(".bottom_tournaments_rating").html(this.state.p1_tournaments_rating);

            if (this.state.is_over === 1 && this.state.p2_rating_change && this.state.p2_rating_change != "null" && this.state.p1_rating_change != "null") {
                $up_rating_change.html((this.state.p2_rating_change > 0) ? "+" + this.state.p2_rating_change : this.state.p2_rating_change);
                $bottom_rating_change.html((this.state.p1_rating_change > 0) ? "+" + this.state.p1_rating_change : this.state.p1_rating_change);

                if (this.state.p2_rating_change > 0) {
                    $up_rating_change.addClass("up");
                    $bottom_rating_change.addClass("down");
                } else {
                    $up_rating_change.addClass("down");
                    $bottom_rating_change.addClass("up");
                }
            }
        } else {

            $(".up_tournaments_rating").html(this.state.p1_tournaments_rating);
            $(".bottom_tournaments_rating").html(this.state.p2_tournaments_rating);

            if (this.state.is_over === 1 && this.state.p2_rating_change && this.state.p2_rating_change != "null" && this.state.p1_rating_change != "null") {
                $up_rating_change.html((this.state.p1_rating_change > 0) ? "+" + this.state.p1_rating_change : this.state.p1_rating_change);
                $bottom_rating_change.html((this.state.p2_rating_change > 0) ? "+" + this.state.p2_rating_change : this.state.p2_rating_change);

                if (this.state.p1_rating_change > 0) {
                    $up_rating_change.addClass("up");
                    $bottom_rating_change.addClass("down");
                } else {
                    $up_rating_change.addClass("down");
                    $bottom_rating_change.addClass("up");
                }
            }
        }
    }


    rematchClick(){
        const self = this;

        if (typeof this.rematchSent != "undefined" && this.rematchSent === true) {

            $(".offer_sent").replaceWith(this.rematchBtnCache);
            this.rematchSent = false;
            this.$tourney_text = $(".tourney_text");
            self.socket.ws.send(JSON.stringify({
                action : "rematch_cancel",
                game_id : g
            }));
            let item = {
                action: "message",
                msg: "отменил реванш",
                user_id: u,
                name: user_name,
                game_id: g,

                chat_id : this.state.chat_id
            };

            self.socket.ws.send(JSON.stringify(item));
            return false;
        }

        this.rematchBtnCache = this.$tourney_text.get(0).outerHTML;
        this.rematchSent = true;

        this.$tourney_text.replaceWith('<a class="button rematch offer_sent white me" title="Предложение реванша отправлено">' +
            '<div class="spinner"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="none"></circle></svg></div></a>')

        //console.log(element);

        self.socket.ws.send(JSON.stringify({
            "action" : "rematch_game",
            "user_id" : u,
            "current_color" : (u == p1) ? "white" : "black",
            "user_name" : user_name,
            "enemy_id" : (u == p1) ? p2 : p1,
        }));

        let item = {
            msg: "предложил реванш",
            user_id: u,
            action: 'message',
            name: user_name,
            game_id: g,

            chat_id : this.state.chat_id
        };

        self.socket.ws.send(JSON.stringify(item));

    }

    setIsOver(caller){
        const self = this;
        //если игра завершена
        if (this.state.is_over === 1) {
            $(".players-btns").addClass("hidden");

            if (this.state.isPlayer){
                $(".rematch").removeClass("hidden");
            }

            //выиграли белые
            /*if (this.state.p1_won === 1) {
                $(".p1_won").removeClass("hidden");
            } else if (this.state.p2_won === 1) {
                $(".p2_won").removeClass("hidden");
            } else if (this.state.p2_won === 0.5) {
                $(".p2_draw").removeClass("hidden");
            }*/

            if (this.state.isPlayer) {
                if (this.state.tourney_id === null) {
                    this.$tourney_text.text("РЕВАНШ");
                    $(".rematch").on("click", function (event) {
                        self.rematchClick();
                        return false;
                    });
                } else {
                    this.$tourney_text.text("К ТУРНИРУ");
                    this.$tourney_text.attr("href", this.state.tourney_href);
                }
            }


            self.cg.set({
                movable: {
                    color: null
                },
                turnColor: null
            });

            //скрываем все управляющие кнопки
            $(".control.buttons").not(".rematch").addClass("hidden");

            if (this.state.isPlayer && caller != "init") {
                window.s_endgame.play();
                //aa.play('endgame');
            }
            document.title = "Игра завершена " + self.state.p1_name + " vs " + self.state.p2_name;

        } else {
            //если партия не завершена
            if (this.state.isPlayer){
                $(".players-btns").removeClass("hidden");
            }
        }
    }

    addResult(){
        //console.log(this.state.reason);
        var reason = "";
        if (this.state.reason === "resign") {
            reason = REASONS[this.state.reason](this.state.p1_won);
        } else {
            reason = REASONS[this.state.reason];
        }
        const result = $('<div class="result_wrap"><p class="result">' + this.state.p1_won + '-' + this.state.p2_won
            + '</p><div class="status"><div>' + reason + '</div><div>' + REASONS.titles(this.state.p1_won) + '</div></div>');
        this.$moves.append(result);
        $(".game_result").removeClass("hidden").html(result.clone());

        this.scrollToBottom();


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
            self.resignCount = 0;

            var send_data = {
                data: self.game.fen(),
                id: g,
                action: "eventServer",
                is_over: 1,
                player: (self.state.who_to_move === 'white') ? "p1" : "p2", //кто должен ходить
            };
            send_data.is_over = 1;
            send_data.p1_won = (self.state.playerColor === 'white') ? 0 : 1;
            send_data.p2_won = (self.state.playerColor === 'black') ? 0 : 1;
            send_data.p1_id = p1;
            send_data.p2_id = p2;
            send_data.reason = "resign";
            send_data.tourney_id = self.state.tourney_id;
            self.socket.ws.send(JSON.stringify(send_data));

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
        if (self.drawCount > 1) {
            self.drawCount = 0;

            self.socket.ws.send(JSON.stringify({
                "enemy_id" : (u == p1) ? p2 : p1,
                "game_id" : g,
                "action" : "draw_offer",
            }));

            $(".pending").parent().removeClass("hidden");
            $(".negotiation").parent().addClass("hidden");
            element.unwrap();
            element.closest(".control").removeClass("confirm");
            element.removeClass("yes active");
            self.drawCount = 0;
            clearTimeout(this.drawTimeout);
            $(".draw").attr("disabled", "disabled");

            let item = {
                msg: "предложил ничью",
                action: "message",
                user_id: u,
                name: user_name,
                game_id: g,

                chat_id : this.state.chat_id
            };

            self.socket.ws.send(JSON.stringify(item));

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
        const self = this;
        if (this.state.who_to_move === "white") {
            this.setState({
                white_time: this.state.white_time - 100
            }, function () {
                if (this.state.white_time < 0 && self.state.is_over !== 1) {
                    let send_data = {
                        data: this.game.fen(),
                        id: g,
                        action: "checkTime1",
                        player: "p1"
                    };

                    send_data.p1_won = 0;
                    send_data.p2_won = 1;
                    send_data.p1_id = p1;
                    send_data.p2_id = p2;
                    send_data.tourney_id = this.state.tourney_id;
                    //debugger;

                    self.socket.ws.send(JSON.stringify(send_data));

                } else {
                    this.setTime();
                }
            });
        } else if (this.state.who_to_move === "black") {
            this.setState({
                black_time: this.state.black_time - 100
            }, function () {

                //debugger;
                if (this.state.black_time < 0 && this.state.is_over !== 1) {

                    let send_data = {
                        data: this.game.fen(),
                        id: g,
                        action: "checkTime1",
                        player: "p2"
                    };
                    send_data.p1_won = 1;
                    send_data.p2_won = 0;
                    send_data.p1_id = p1;
                    send_data.p2_id = p2;
                    send_data.tourney_id = this.state.tourney_id;
                    self.socket.ws.send(JSON.stringify(send_data));
                } else {
                    this.setTime();
                }
            });
        }
    }

    setTime(){
        let p1_minutes = Math.floor((this.state.white_time/(1000*60)));
        let p1_secs = Math.floor((this.state.white_time/1000) % 60);

        let p1_milliseconds, p2_milliseconds;

        let p2_minutes = Math.floor((this.state.black_time/(1000*60)));
        let p2_secs = Math.floor((this.state.black_time/1000) % 60);


        if (this.state.is_over === 1) {
            p1_milliseconds = Math.floor((this.state.white_time % 1000 / 10));
            p2_milliseconds = Math.floor((this.state.black_time % 1000 / 10));
        } else {
            p1_milliseconds = Math.floor((this.state.white_time % 1000 / 100));
            p2_milliseconds = Math.floor((this.state.black_time % 1000 / 100));
        }

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
        let upclock;
        let bottomclock;

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
                bottomclock = bottom_clock_minutes + '<span class="low">:</span>' + bottom_clock_seconds + "." + '<span class="small-bottom">' + bottom_clock_milliseconds + '</span>';
                //this.$clock_top.removeClass("emerg");
                if (this.state.isPlayer && this.state.playerColor === "white" && this.lowTimePlayed === false && this.state.is_over === 0) {
                    s_lowtime.play();
                    this.lowTimePlayed = true;
                }
            } else {
                upclock = up_clock_minutes + '<span class="low">:</span>' + up_clock_seconds + "." + '<span class="small-bottom">' + up_clock_milliseconds + '</span>';
                this.$clock_top.addClass("emerg");
                //this.$clock_bottom.removeClass("emerg");
            }
        } else {

            if (this.state.orientation === "white") {
                bottomclock = bottom_clock_minutes + '<span class="low">:</span>' + bottom_clock_seconds;
            } else {
                upclock = up_clock_minutes + '<span class="low">:</span>' + up_clock_seconds;
            }



        }

        if (this.state.black_time < 10000) {
            if (this.state.orientation === "white") {
                this.$clock_top.addClass("emerg");

                upclock = up_clock_minutes + '<span class="low">:</span>' + up_clock_seconds + "." + '<span class="small-bottom">' + up_clock_milliseconds + '</span>';

            } else {
                this.$clock_bottom.addClass("emerg");

                bottomclock = bottom_clock_minutes + '<span class="low">:</span>' + bottom_clock_seconds + "." + '<span class="small-bottom">' + bottom_clock_milliseconds + '</span>';

                if (this.state.isPlayer && this.state.playerColor === "black" && this.lowTimePlayed === false && this.state.is_over === 0) {
                    s_lowtime.play();
                    this.lowTimePlayed = true;
                }
                //this.$clock_top.removeClass("emerg");

            }
        } else {


            if (this.state.orientation === "white") {
                upclock = up_clock_minutes + '<span class="low">:</span>' + up_clock_seconds;
            } else {
                bottomclock = bottom_clock_minutes + '<span class="low">:</span>' + bottom_clock_seconds;
            }


        }



        /*this.$clock_top_time.html(up_clock_minutes + '<span class="low">:</span>' + up_clock_seconds + "." + '<span class="small-bottom">' + up_clock_milliseconds + '</span>');
        this.$clock_bottom_time.html(bottom_clock_minutes + '<span class="low">:</span>' + bottom_clock_seconds + "." + '<span class="small-bottom">' + bottom_clock_milliseconds + '</span>');*/
        this.$clock_top_time.html(upclock);
        this.$clock_bottom_time.html(bottomclock);


    }


    checkFocus(){
        const self = this;

        var hasFocus = document.hasFocus();
        if (!hasFocus) {

            setTimeout(function () {

                self.setUnfocusedTitle();
                self.checkFocus();
            }, 500);
        } else {
            self.setTitle();
        }
    }
    setTitle(forced){
        const self = this;
        if (self.state.isPlayer && self.state.playerColor === self.state.who_to_move) {
            document.title = "Ваш ход";
        } else if (self.state.isPlayer && self.state.playerColor !== self.state.who_to_move) {
            document.title = "Ожидание хода соперника";
        }
        if (self.state.is_over === 1) {
            document.title = "Игра завершена " + self.state.p1_name + " vs " + self.state.p2_name;
        }
    }
    setUnfocusedTitle(){
        const self = this;
        if (typeof self.lastMessage === "undefined") {
            document.title = "*";
            self.lastMessage = true;
        } else {
            self.setTitle();
            self.lastMessage = undefined;
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

            let is_over = (data.is_over == 1);

           /* if (u == p1 && this.state.who_to_move == "white") {
                if (!is_over) {
                    const moves = self.game.moves({verbose:true});
                    const move = moves[Math.floor(Math.random() * moves.length)];
                    console.log(move);
                    setTimeout(function () {
                        self.move(move.from, move.to);
                    }, 100);
                }
            }

            if (u == p2 && this.state.who_to_move == "black") {
                if (!is_over) {
                    const moves = self.game.moves({verbose:true});
                    const move = moves[Math.floor(Math.random() * moves.length)];
                    console.log(move);
                    setTimeout(function () {
                        self.move(move.from, move.to);
                    }, 100);
                }
            }

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
                    a = null;
                });

                if (data.captured) {

                    if (!window.s_capture.paused) {
                        setTimeout(function () {
                            s_audio_capture1.play()
                        }, 50);
                    } else {
                        window.s_capture.play();
                    }





                } else {


                    if (!window.s_move.paused) {
                        setTimeout(function () {
                            s_audio_move1.play()
                        }, 50);
                    } else {
                        window.s_move.play();
                    }


                }
            }
            self.setMatterialDiff();
            self.setTitle();
           // self.checkFocus();
            is_over = null;
            a = undefined;
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
    cancelMove(data){
        const self = this;
        //если игра завершена, но сокет с ходом проскочил и это обнаружилось как он сделал ход
        //отменяем последений ход пользователя для него, если игра уже завершена, но сокет с ходом проскочил
        if (typeof u !== "undefined" && u == p1 && data.canceled_side === "p1") {
            const undo = self.game.undo();
           // console.log("white undo");
           // console.log(undo);
        } else if (typeof u !== "undefined" && u == p2 && data.canceled_side === "p2") {
            const undo =  self.game.undo();
           // console.log("black undo");

           // console.log(undo);
        }
        // console.log(self.game.fen());

        self.cg.set({
            fen: self.game.fen(),
            viewOnly : true,
            movable: {
                color: null
            },
            turnColor: null
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
    getMessages(){
        var self = this;
        if (this.state.chat_id) {
            $.getJSON("/chat/" + this.state.chat_id + "/messages", function (data) {
                if (data.status == "ok") {
                    try {
                        data = JSON.parse(data.messages);
                        var temp = $("<div>");

                        for (var i = 0; i < data.length; i++) {
                            var obj = JSON.parse(data[i].msg);
                            temp.append('<div class="mt-1 mt-2"><b>' + obj.name + '</b>&nbsp;&nbsp;' + obj.msg + '</div>');
                        }
                        $(".messages").html(temp);

                        self.scrollToBottomMessages()


                        // console.log(temp);
                    } catch(e) {
                        console.log(e.message);
                    }
                }

            })
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
        if (this.objDiv) {
            this.objDiv.scrollTop = this.objDiv.scrollHeight;
        }
    }
    scrollToBottomMessages(){
        var objDiv = document.querySelector("#messages");
        if (objDiv) {
            objDiv.scrollTop = objDiv.scrollHeight;
        }
    }

    socketRatingChange(data){
        const self = this;

        if (self.state.is_over === 1) {
            self.setState({
                p1_rating_change: data.rating_change_p1,
                p2_rating_change: data.rating_change_p2
            });
        }

        self.setRatings();

        self.cg.set({
            viewOnly : true,
            movable: {
                color: null
            },
            turnColor: null
        });
    }
    socketAddMessage(data){
        const self = this;

        $(".messages").append('<div class="mt-1 mt-2"><b>' + data.data.name + '</b>&nbsp;&nbsp;' + data.data.msg + '</div>');

        this.scrollToBottomMessages()
       // console.log(data);
    }
    socketGamerOver(data){
        const self = this;

        //если игра завершена, но пришел ход, значит кто то уронил флаг и это обнаружилось как он сделал ход
        if (data.flagged) {
            //отменяем последений ход пользователя для него, если он уронил флаг
            if (typeof u !== "undefined" && u == p1 && data.flagged === "white") {
                var undo = self.game.undo();
                //console.log("white undo");
                //console.log(undo);
            } else if (typeof u !== "undefined" && u == p2 && data.flagged === "black") {
                var undo =  self.game.undo();
               // console.log("black undo");

                //console.log(undo);
            }
           // console.log(self.game.fen());
        }

        clearInterval(self.timer);
        self.setState({
            is_over: data.is_over,
            p1_won: data.p1_won,
            p2_won: data.p2_won,
            reason: data.reason,
            white_time : data.p1_time_left,
            black_time : data.p2_time_left
        }, function () {
            self.setIsOver();
            self.setTime();
        });

        self.cg.set({
            fen: self.game.fen(),
            // viewOnly : 1,
            lastMove : null,
            movable: {
                color: null
            },
            turnColor: null
        });

        //self.defeat_sound = $("#defeat_sound")[0];

        self.$timeleft_black.addClass("hidden");
        self.$timeleft_white.addClass("hidden");

        self.addResult();

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
        if (typeof data !== "undefined") {

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
    }
    playzoneStartGame(data){
        const self = this;
       // console.log(data);

        location.href = "/play/game/" + data.game_id;
    }
    decline_draw(data){
        const self = this;
       // console.log(data);

        $(".pending").parent().addClass("hidden");
        $(".negotiation").parent().addClass("hidden");

    }
    decline_rematch(data){
        const self = this;
       // console.log(data);

        $(".offer_sent").replaceWith(this.rematchBtnCache);
        this.rematchSent = false;
        this.$tourney_text = $(".tourney_text");


    }
    rematch_cancel(data){
        const self = this;
       // console.log(data);
        $("#rematchModal").modal("hide");



    }
    draw_offer(data){
        const self = this;
       // console.log(data);

        $(".draw").parent().removeClass("hidden").attr("disabled", "disabled");
        $(".negotiation").parent().removeClass("hidden");
        $("body").off("click.draw_accept").on("click.draw_accept", ".accept", function () {
            var send_data = {
                data: self.game.fen(),
                id: g,
                action: "eventServer",
                is_over: 1,
                player: (self.state.who_to_move === 'white') ? "p1" : "p2", //кто должен ходить
            };
            send_data.is_over = 1;
            send_data.p1_won = 0.5;
            send_data.p2_won = 0.5;
            send_data.p1_id = p1;
            send_data.p2_id = p2;
            send_data.reason = "draw";
            send_data.tourney_id = self.state.tourney_id;
            self.socket.ws.send(JSON.stringify(send_data));


            let item = {
                action: "message",
                msg: "принял ничью",
                user_id: u,
                name: user_name,
                game_id: g,
                chat_id : self.state.chat_id
            };

            self.socket.ws.send(JSON.stringify(item));

        });

        $("body").off("click.decline_draw").on("click.decline_draw", ".decline", function () {
            self.socket.ws.send(JSON.stringify({
                action : "decline_draw",
                game_id : g
            }));

            let item = {
                msg: "отклонил ничью",
                user_id: u,
                action: "message",
                name: user_name,
                game_id: g,

                chat_id : self.state.chat_id
            };

            self.socket.ws.send(JSON.stringify(item));
        });

    }

    socketSyncRekt(data){
        const self = this;
        //alert();
        console.log("REKT");
        if (self.rekt_count > 1) {
            location.reload();
        }
        self.rekt_count++;
    }

    addMessage(){
        const self = this;
        const $messageInput = $(".message-input-text");
        const mes = $messageInput.val();
        if (mes != "") {
            if (typeof user_name === "undefined") {
                return false;
            }
            let item = {
                msg: mes,
                action: "message",
                user_id: u,
                name: user_name,
                game_id: g,
                chat_id : self.state.chat_id
            };

            self.socket.ws.send(JSON.stringify(item));

            $messageInput.get(0).value = "";
            $messageInput.get(0).focus();
        }
    }

    socketIOConnect(){
        const self = this; let url = "";
        if (typeof u != "undefined") {
            url = 'h=' + u;
        } else {
            url = '';
        }
        //this.socket = io(window.location.origin, {query: url + '&g=' + g});

        this.socket = new WS(function (data) {


            // console.log(data);

            if (data.action === "move") {
                self.cg.set({
                    check: false,
                    state: {
                        check: false,
                    }
                });
                self.socketMove(data);

            } else if (data.action === "cancel_move") {
                self.cancelMove(data);

            }
            else if (data.action === "rating_change") {

                self.socketRatingChange(data);

            }
            else if (data.action === "game_over") {

                self.cg.set({
                    check: false,
                    state: {
                        check: false,
                    }
                });

                self.socketGamerOver(data);



            }
            else if (data.action === "sync_rekt") {

                self.socketSyncRekt(data);

            }
            else if (data.action === "game_aborted") {

                self.socketGameAborted(data);

            }
            else if (data.action === "rematch_offer") {
                if (self.state.isPlayer) {
                    self.socketRematchOffer(data);
                }
            }
            else if (data.action === "playerOnline") {
                self.socketPlayerOnline(data);
            }
            else if (data.action === "game_start") {
                self.playzoneStartGame(data);
            }
            else if (data.action === "draw_offer") {
                if (self.state.isPlayer) {
                    self.draw_offer(data);
                }
            }
            else if (data.action === "decline_draw") {
                if (self.state.isPlayer) {
                    self.decline_draw(data);
                }
            }
            else if (data.action === "decline_rematch") {
                if (self.state.isPlayer) {
                    self.decline_rematch(data);
                }
            }
            else if (data.action === "rematch_cancel") {
                if (self.state.isPlayer) {
                    self.rematch_cancel(data);
                }
            }
            else if (data.action === "message") {
                self.socketAddMessage(data);
            }



        }, "localhost:7000");

        //window.socket.on('eventClient', );

        this.socket.ws.onopen = function () {
            if (self.state.isPlayer === true) {
                let who_online = "white";
                if (self.state.orientation === "black") {
                    who_online = "black";
                }
                self.socket.ws.send(JSON.stringify({action : "playerOnOff", online: who_online, p_id: u, game_id: g}))
            } else {
                self.socket.ws.send(JSON.stringify({action : "playerOnOff", game_id: g}))

            }
        }





    }
    setListeners(){

        const self = this;

        const $body = $("body");

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

                if (self.state.isPlayer) {
                    self.cg.set({
                        fen: self.game.fen(),
                        viewOnly: false
                    });
                }


            }
        });

        if (self.state.isPlayer) {
            $body.on("click", ".resign", function (event) {

                self.resign(this);
            });

            $body.on("click", ".draw", function () {

                self.draw(this);
            });

            $body.on("click", "#accept_rematch", function () {
                $(this).attr("disabled", "disabled");
                self.socket.ws.send(JSON.stringify({
                    "action": "rematch_accepted",
                    "user_id": u,
                    "current_color": (u == p1) ? "white" : "black",
                    "user_name": (u == p1) ? p1_name : p2_name,
                    "enemy_name": (u == p2) ? p1_name : p2_name,
                    "amount": self.state.amount,
                    "time_inc": parseInt(self.state.time_inc) / 1000,
                    "enemy_id": (u == p1) ? p2 : p1,
                }));
            });
            $body.on("click", "#decline_rematch", function () {
                self.socket.ws.send(JSON.stringify({
                    action: "decline_rematch",
                    game_id: g
                }));
                let item = {
                    action: "message",
                    msg: "отклонил реванш",
                    user_id: u,
                    name: user_name,
                    game_id: g,

                    chat_id: self.state.chat_id
                };

                self.socket.ws.send(JSON.stringify(item));
            });
        }

        $("#copy_pgn").on("click", function () {
            $("#pgn_copy").val(self.game.pgn());
            $("#pgnModal").modal("show");
            return false;
        });
        $("#download_pgn_form").on("submit", function () {
            self.downloadPgn();
            return false;
        });
        $(".sendMessage").on("click", function () {
            self.addMessage();
            return false;
        });
        $("#mobile_buttons").on("click", function () {
            $("#mobile-btns").toggleClass("hidden");

            $('html, body').animate({
                scrollTop: $("#lichess_ground").offset().top
            });

            $(".mobile-btn").off("click").on("click", function () {
                if ($(this).hasClass("forward")) {
                    self.goForward();
                }
                if ($(this).hasClass("back")) {
                    self.goBack();
                }
                return false;
            });

            return false;
        });


        $(".message-input-text").on("keydown", function (e) {
            if(e.keyCode == 13 && e.shiftKey == false) {
                self.addMessage();
                e.preventDefault();
            }
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


function getMaterialDiff(data) {
    var counts = {
        king: 0,
        queen: 0,
        rook: 0,
        bishop: 0,
        knight: 0,
        pawn: 0
    };
    for (var k in data.pieces) {
        var p = data.pieces[k];
        counts[p.role] += ((p.color === 'white') ? 1 : -1);
    }
    var diff = {
        white: {},
        black: {}
    };
    for (var role in counts) {
        var c = counts[role];
        if (c > 0) diff.white[role] = c;
        else if (c < 0) diff.black[role] = -c;
    }
    return diff;
}


var pieceScores = {
    pawn: 1,
    knight: 3,
    bishop: 3,
    rook: 5,
    queen: 9,
    king: 0
};

function getScore(data) {
    var score = 0;
    for (var k in data.pieces) {
        score += pieceScores[data.pieces[k].role] * (data.pieces[k].color === 'white' ? 1 : -1);
    }
    return score;
}

$(function () {
    window.party = new App();
});
