import React from 'react';
import {render} from 'react-dom';


class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fen: pos,
            moves : [],
            fenArrCursor: 0,
            last_moves : [],
            historyy : [],
            moves_made : 0,
            level : 0,
            start_black : false,
            move_made : false,
            iTimer : 4,
            state : (typeof puzzle_id === "undefined") ? "welcome" : null,
            // state : "over",
            countError : 0,
            puzzle_counter : 0,
            user_today : "--",//лучший результат юзера за сегодня
            user_all : "--",//лучший результат юзера за все время
            longest_streak : 0, //самая длинная серия
            current_streak : 0, //текущая серия
            puzzle_status : null,
            width : "auto",
            restrict : "global",
            correct_puzzle_counter : 0,
            puzzles : [],//массив паззлов
            users : [],//массив паззлов
            computer : false,
            computer_state : "Поставьте мат! Ваш ход!",
            computer_complete_status : "pending",
            engine_level : false,
            efforts_array : [],//массив успешных или неуспешных попыток
            hundred : 0,//десяток паззлов по счету (идет запрос по 10 паззлов)
            correct_i : 0,
            diff : null,
            new_elo : null,
            promotion : "q",
            first_move : null,
            global_error : false,
            checkCounter: 0,
            last_position : '8/8/6b1/8/k7/p7/Kp6/8 b - - 0 1',
            puzzle_current_state : "pending"
        };

        this.request_sent = false;
        this.move = this.move.bind(this);
        this.onPromotion = this.onPromotion.bind(this);
        this.renderPos = this.renderPos.bind(this);
        this.getPos = this.getPos.bind(this);
        this.checker = this.checker.bind(this);
        this.setCorrect = this.setCorrect.bind(this);
        this.makeRandomMove = this.makeRandomMove.bind(this);
        this.checkPuzzlesEnd = this.checkPuzzlesEnd.bind(this);
        this.isOver = this.isOver.bind(this);
        this.reload = this.reload.bind(this);
        this.handlePuzzles = this.handlePuzzles.bind(this);
        this.makeStockfishMove = this.makeStockfishMove.bind(this);
        this.makeAutomaticMoves = this.makeAutomaticMoves.bind(this);
        this.setResultsRange = this.setResultsRange.bind(this);
        this.setPuzzleStatus = this.setPuzzleStatus.bind(this);
        this.setIncorrect = this.setIncorrect.bind(this);

    }
    onPromotion(source, target){
        var promote_to = "q";
        var that = this;
        var  piece_theme = '/images/chesspieces/wikipedia/{piece}.png';
        function getImgSrc(piece) {
            return piece_theme.replace('{piece}', that.game.turn() + piece.toLocaleUpperCase());
        }
        $('.promotion-piece-q').attr('src', getImgSrc('q'));
        $('.promotion-piece-r').attr('src', getImgSrc('r'));
        $('.promotion-piece-n').attr('src', getImgSrc('n'));
        $('.promotion-piece-b').attr('src', getImgSrc('b'));

        var onDialogClose = function() {

            that.setState({
                promotion : promote_to
            }, function () {
                //console.log("aaa");
                this.move(source, target, "promotion");
            });
        };



        var promotion_dialog = $( "#promotion_dialog" ).dialog({
            modal: true,
            height: 46,
            width: 184,
            resizable: false,
            draggable: false,
            close: onDialogClose,
            closeOnEscape: false,
            dialogClass: 'noTitleStuff'
        }).position({
            of: $('.cg-board'),
            my: 'middle middle',
            at: 'middle middle',
        });


        // init promotion piece dialog
        $("#promote-to").selectable({
            stop: function() {
                $( ".ui-selected", this ).each(function() {
                    var selectable = $('#promote-to li');
                    var index = selectable.index(this);
                    if (index > -1) {
                        var promote_to_html = selectable[index].innerHTML;
                        var span = $('<div>' + promote_to_html + '</div>').find('span');
                        promote_to = span[0].innerHTML;
                    }
                    promotion_dialog.dialog('close');
                    $('.ui-selectee').removeClass('ui-selected');
                    //console.log(promote_to);
                    //updateBoard(board);
                });
            }
        });
    }

    checker(isComp){
        var that = this;

        if (this.state.checkCounter >= (this.state.moves[this.state.correct_i].length) ) {
            var a = this.state.moves.splice(this.state.correct_i, 1);

            this.setState({
                moves : [],
                historyy : [],
                correct_i : 0,
                last_moves : [],
                fenArrCursor: --this.state.fenArrCursor,
                checkCounter: 0,
            }, function () {
                //debugger;
                if ((this.state.moves.length) === 0 ) {

                    if (this.state.global_error !== true && typeof puzzle_id === "undefined") {
                        this.setCorrect();
                    } else if (typeof puzzle_id === "undefined") {
                        this.setIncorrect();
                    }


/*                    cg.set({
                        movable : {
                            free : false,
                            dests : []
                        }
                    });*/
                    this.setState({
                        puzzle_current_state: "over",
                        puzzle_counter : ++this.state.puzzle_counter
                    }, function () {
                        //если это не отдельный пазл
                        if (typeof puzzle_id === "undefined") {
                            that.setAnotherPuzzle();
                        }
                    });

                } else {
                    this.game = new Chess(pos);
                    cg.set({fen: that.game.fen(), turnColor:this.state.first_move, movable : { dests : getDests(this.game) }});
                    this.setState({
                        puzzle_current_state: "pending"
                    });

                    if (this.state.first_move === "white"){
                        this.game.header("White", user_name);
                        this.game.header('Black', 'Computer');
                    } else {
                        this.game.header("Black", user_name);
                        this.game.header('White', 'Computer');
                    }


                    $('#solved').modal("show");

                    $('#solved').on('hidden.bs.modal', function (e) {
                        that.repeatMoves();
                    });
                }
                $("#task_header").hide();

            });
        } else {
            if (!isComp) {
                setTimeout(function () {
                    that.makeNextMove();
                }, 250);
            }
        }
    }

    setCorrect(){
        const self = this;
        this.state.efforts_array.push({result : true, id : this.state.puzzles[this.state.puzzle_counter].id, rating : this.state.puzzles[this.state.puzzle_counter].r})
        this.setPuzzleStatus("correct");

        this.setState({
            checkCounter: ++this.state.checkCounter,
            correct_puzzle_counter: ++this.state.correct_puzzle_counter,
            puzzle_current_state : "good",
            current_streak : ++this.state.current_streak,
            longest_streak : (this.state.current_streak > this.state.longest_streak) ? this.state.current_streak : this.state.longest_streak
        }, function () {
            this.request_sent = false;
        });
        self.puzzle_rating(1);
        $("#scorrect")[0].play();
    }
    setIncorrect(){
        const that = this;
        that.game.undo();
        this.state.efforts_array.push({result : false, id : this.state.puzzles[this.state.puzzle_counter].id, rating : this.state.puzzles[this.state.puzzle_counter].r})
        cg.set({fen: that.game.fen(), turnColor:this.state.first_move, movable : { dests : getDests(that.game) }});
        this.setPuzzleStatus("error");

        this.setState({
            puzzle_current_state : "error",
            global_error : true,
            correct_i : 0,
            historyy : [],
            checkCounter : 0,
            current_streak : 0,
            countError : ++this.state.countError
        }, function () {
            //console.log(this.state.efforts_array);

            if (this.state.countError >= 3) {
                that.setOver();

            } else {
                this.setState({
                    puzzle_current_state: "over",
                    puzzle_counter : ++this.state.puzzle_counter
                }, function () {
                    this.request_sent = false;

                    that.setAnotherPuzzle();
                });
            }
        });
        that.puzzle_rating(0);
        $("#swrong")[0].play();
    }

    setResultsRange(event){
        const element = $(event.target);
        const state = element.val();

        this.setState({
            restrict : state
        }, function () {
            this.getResults();
        })
    }



    isOver() {
        var that = this;
        var status = '';
        var bool_status = false;
        var moveColor = 'Белые';
        var s_color = (that.game.turn() === 'b') ? "black" : "white";
        if (that.game.turn() === 'b') {
            moveColor = 'Черные';
        }

        // checkmate?
        if (that.game.in_checkmate() === true) {
            status = 'Игра завершена, ' + moveColor + ' получили мат.';
            //последний ход был белых, текущий черных и они получили мат

            if (s_color !== this.state.first_move) {
                this.setState({
                    computer_complete_status: "success"
                });
                that.puzzle_rating(1);
            } else {
                this.setState({
                    computer_complete_status: "fail"
                });
                that.puzzle_rating(0);
            }
            bool_status = true;
        }

        // draw?
        else if (that.game.in_draw() === true) {
            status = 'Игра завершена, ничейная позиция.';
            if (that.game.in_stalemate() === true) {
                status += " Пат."
            }
            if (that.game.in_threefold_repetition() === true) {
                status += " Троекратное повтороение позиции."
            }
            this.setState({
                computer_complete_status: "fail"
            });

            bool_status = true;
        }

        // game still on
        else {
            status = moveColor + ' ходят.';

            // check?
            if (that.game.in_check() === true) {
                status += ', ' + moveColor + ' получили шах.';
            }
        }

        this.setState({
            computer_state : status
        });

        return bool_status;

    };
    reload() {
        location.reload();
    };
    setPuzzleStatus(status) {
        const self = this;
        this.setState({
            puzzle_status : status
        });
        setTimeout(function () {
            self.setState({
                puzzle_status : null
            });
        }, 500);
    };
    makeStockfishMove() {
        var that = this;
        var possibleMoves = that.game.moves();

        // game over
        if (possibleMoves.length === 0) {
            return;
        }

        $.ajax({
            url : "/stockfish",
            method : "post",
            data : {
                fen : that.game.fen(),
                history : that.game.pgn(),
                moves_length : that.game.history().length,
                puzzle_id : puzzle_id,
                task_id : task_id,
            },
            timeout : 3000
        }).done(function (data) {
            if (data.status === "ok") {
                var a = data.result.bestmove.split("");
                var move = that.game.move({
                    from: a[0] + a[1],
                    to: a[2] + a[3],
                    promotion: a[4] || 'q' // NOTE: always promote to a queen htmlFor example simplicity
                });

                if (move !== null) {
                    cg.set({fen: that.game.fen(), turnColor:that.state.first_move, movable : { dests : getDests(that.game) }});
                    that.isOver();
                    if (move.captured) {
                        that.capture_sound.play();
                    } else {
                        that.move_sound.play();
                    }
                }
            }

        }).fail(function () {
            alert("Ошибка коннекта с сервером. Попробуйте позже.");
        });

        // console.log(this.game.ascii());

    };
    makeRandomMove() {
        var that = this;
        var possibleMoves = that.game.moves();

        // game over
        if (possibleMoves.length === 0) {
            return;
        }

        var randomIndex = Math.floor(Math.random() * possibleMoves.length);
        var move = that.game.move(possibleMoves[randomIndex]);
        if (move.captured) {
            this.capture_sound.play();
        } else {
            this.move_sound.play();
        }
        cg.set({fen: that.game.fen(), turnColor:this.state.first_move, movable : { dests : getDests(that.game) }});
        this.isOver();
        // console.log(this.game.ascii());

    };

    repeatMoves(){
        var that = this;
        var last = this.state.fenArrCursor - 1;
        var last_moves = this.state.last_moves[this.state.checkCounter];
       // console.log(last_moves);
        var current_moves = this.state.moves[this.state.correct_i][this.state.checkCounter];
      //  console.log(current_moves);

        cg.set({
            fen: that.game.fen(),
            animation : {
                duration : 1000
            },
            movable : {
                color : undefined
            },
            events : {
                move : function () {

                },
                change : function () {

                    setTimeout(function () {
                        that.repeatMoves();
                    }, 200);

                }
            }
        });

        setTimeout(function () {

                var l_moves = last_moves;
                var c_moves = current_moves;
                var l_arr = l_moves.split("-");
                if (c_moves) {
                    var c_arr = c_moves.split("-");

                }
             //   console.log(that.state);
             //   console.log(c_arr);
                if (c_moves && l_arr[1] == c_arr[1] && c_arr.length == 2 && l_arr.length == 2) {

                    that.state.historyy.push(that.state.moves[that.state.correct_i][that.state.checkCounter]);

                    that.setState({
                        checkCounter: ++that.state.checkCounter,
                    }, function () {
                        setTimeout(function () {
                            var move = that.game.move({
                                from: c_arr[0],
                                to: c_arr[1],
                                promotion: 'q' // NOTE: always promote to a queen htmlFor example simplicity
                            });

                            cg.move(c_arr[0], c_arr[1]);
                        }, 200);
                    });




                } else {
                    var fm = (that.game.turn() === 'w') ? "white" : "black";
                    if (that.state.first_move === fm) {
                        cg.set({
                            fen: that.game.fen(),
                            turnColor: that.state.first_move,
                            animation : {
                                duration : 200
                            },
                            events: {
                                move: that.move,
                                change : function () {}
                            },
                            movable : {
                                dests : getDests(that.game),
                                color : that.state.first_move
                            }});


                        $('#continue').show();


                        setTimeout(function () {
                            $('#continue').hide("explode");
                        }, 1500);


                    } else {
                        cg.set({
                            fen: that.game.fen(),
                            turnColor: fm,
                            events: {
                                move: that.move,
                                change : function () {}
                            },
                            movable : {
                                dests : getDests(that.game),
                                color : fm
                            }});
                        that.makeNextMove();

                    }

                }

           // console.log(last_moves);
        }, 500);


    }

    makeNextMove(correct_i){
        var that = this;
        //если были показаны ходы и нажата клавиша показать решение повторно
        if (typeof this.state.moves[this.state.correct_i] === "undefined" && typeof this.autoMovesTimer != "undefined") {
           // console.log(this.state.moves);
           // console.log(this.state.initialMoves);
            that.setState({
                checkCounter: 0,
            }, function () {
                clearInterval(this.autoMovesTimer);
                that.wait_automove_flag = false;
                //console.log(that.wait_automove_flag);
            });


            return false;
        }
        var arr = this.state.moves[this.state.correct_i][this.state.checkCounter].split("-");

        this.state.historyy.push(this.state.moves[this.state.correct_i][this.state.checkCounter]);
       // console.log(this.state.historyy);
        var move = that.game.move({
            from: arr[0],
            to: arr[1],
            promotion: 'q' // NOTE: always promote to a queen htmlFor example simplicity
        });
        if (move.captured) {
            this.capture_sound.play();
        } else {
            this.move_sound.play();
        }
        cg.set({
            fen: that.game.fen(),
            turnColor:this.state.first_move,
            movable : {
                dests : getDests(that.game),
                color : this.state.first_move
            }});
        //console.log(game.ascii());
        this.setState({
            checkCounter: ++this.state.checkCounter,

        }, function () {
            this.checker(true);
        });
    }

    move(source, target, promotion){
        var that = this;
        if (this.state.state === "over") {
            return false;
        }
        var prom = this.state.promotion;
        var piece = that.game.get(source).type;

        // see if the move is legal
        var move = that.game.move({
            from: source,
            to: target,
            promotion: prom
        });

        // illegal move
        if (move === null) {
            that.game.undo();
            //window.cg.set({fen : game.fen()});
            return false;
        }

        if (move.captured) {
            this.capture_sound.play();
        } else {
            this.move_sound.play();
        }

        this.setState({
            move_made : true
        });
        //console.log(game.fen());
        //console.log(game.ascii());

        var source_rank = source.substring(2,1);
        var target_rank = target.substring(2,1);
        //  var piece = game.get(source).type;

        if (promotion !== "promotion" && piece === 'p' &&
            ((source_rank === '7' && target_rank === '8') || (source_rank === '2' && target_rank === '1'))) {
            //promoting = true;
            that.game.undo();
            this.onPromotion(source, target);
            return false;
        }

        if (computer == 1) {
            if (!this.isOver()) {
                if (engine_level != "stockfish") {
                    this.makeRandomMove();

                } else {
                    this.makeStockfishMove();
                }
            }
            return false;
        }


            var move_coorect = false;
            var t = true;

            var correct_i = this.state.correct_i;
            var promotion_found = false;


            function compareHistory(history, current_arr) {
                var is_exact = true;
               // console.log(arguments);

                for (var i = 0; i < history.length; i++) {
                    if (history[i] === current_arr[i]) {
                        is_exact = true;
                    } else {
                        is_exact = false;
                        break;
                    }
                }
                return is_exact;
            }

            var count_correct = 0;
            var move_for_history = "";
            for (var i = 0; i < this.state.moves.length; i++) {
                var obj = this.state.moves[i];
                var cur_move = obj[this.state.checkCounter];
                var is_history = compareHistory(this.state.historyy, obj);
                if (cur_move && !promotion_found) {
                    var v = cur_move.split("-");
                //    console.log("is_history", is_history);
                //    console.log("is_history", this.state.historyy);

                    if ((source + "-" + target) == (v[0] + "-" + v[1]) && promotion !== "promotion" && is_history) {
                        move_coorect = true;
                        count_correct++;
                        correct_i = i;
                        move_for_history = cur_move;

                    }
                    else if (promotion === "promotion" && typeof v[3] !== "undefined" && !promotion_found) {
                        t = false;
                   //     console.log(v[3]);

                        if (v[3] === this.state.promotion){
                            move_for_history = cur_move;

                            t = true;
                            move_coorect = true;
                            count_correct++;
                            correct_i = i;
                            promotion_found = true;
                            break;

                        }
                    }
                }

            }


            this.setState({
                correct_i : correct_i
            }, function () {

               // console.log("correct_i", correct_i);
                //console.log("this.state.moves", this.state.moves);
              //  console.log("this.state", this.state);
               // debugger;
                if (typeof this.state.moves[this.state.correct_i] !== "undefined"
                    && move_coorect  && t) {
                    //var status = (is_last_move) ? "over" : "good";


                    this.setState({
                        checkCounter: ++this.state.checkCounter,
                        puzzle_current_state : "good",
                    }, function () {
                        this.state.historyy.push(move_for_history);
                        this.checker(false);
                    });

                } else {
                    this.setIncorrect();
                }
            });

    }

    getMeta(){
        return $("head meta[name='author']").attr("content") === 'chesscup';
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


    puzzle_rating(result){
        const self = this;


        $.ajax({
            url : '/puzzles/save',
            dataType : "json",
            method : "post",
            data : {
                p_id : self.state.puzzles[self.state.puzzle_counter].id,
                r : result, //если удачно решил - отправляем 1
                hash : self.hash, //если удачно решил - отправляем 1
            },
            timeout : 3000,
            success : function () {

            },
            error : function ( jqXHR, textStatus ) {
                var error = "";
                for (var obj in jqXHR.responseJSON.errors) {
                    error = jqXHR.responseJSON.errors[obj].msg;
                }
                alert(error);

            },
        });
    }

    getPuzzles(hundred){
        $.ajax({
            url : '/puzzles/get',
            dataType : "json",
            method : "post",
            data : {
                h : hundred,
                hash : this.hash,
                level : ++this.state.level,
            },
            timeout : 3000,
            success : this.handlePuzzles,
            error : function ( jqXHR, textStatus ) {
                var error = "";
                for (var obj in jqXHR.responseJSON.errors) {
                    error = jqXHR.responseJSON.errors[obj].msg;
                }
                alert(error);

            },
        });
    }
    getPuzzle(puzzle_id){
        const self = this;
        $.ajax({
            url : '/puzzles/api/get_puzzle/' + puzzle_id,
            dataType : "json",
            method : "post",
            data : {
                p_id : puzzle_id
            },
            timeout : 3000,
            success : function (data) {
                const temp = JSON.parse(data.p);
                for (var i = 0; i < temp.length; i++) {
                    var obj = temp[i];
                    self.state.puzzles.push(obj);
                }
               // console.log(JSON.parse(temp[0].moves));
                var a = Object.assign([], JSON.parse(temp[0].moves));
                self.setState({
                    fen : temp[0].fen,
                    initialMoves : a,
                    moves : JSON.parse(temp[0].moves)
                });
                self.setAnotherPuzzle();
            },
            error : function ( jqXHR, textStatus ) {
                var error = "";
                for (var obj in jqXHR.responseJSON.errors) {
                    error = jqXHR.responseJSON.errors[obj].msg;
                }
                alert(error);

            },
        });
    }

    handlePuzzles(data){

        if (data.status == "ok") {
            let temp = JSON.parse(data.p);

            temp = shuffle(temp);

            for (var i = 0; i < temp.length; i++) {
                var obj = temp[i];
                this.state.puzzles.push(obj);
            }

            //this.state.puzzles = this.state.puzzles.sort(compare2);
            this.hash = data.hash; //id записи в монго

            this.setAnotherPuzzle();
        } else {
            alert(data.msg);
        }

    }


    setAnotherPuzzle(){
        const self = this;
        const fen = this.state.puzzles[this.state.puzzle_counter].fen;
        const moves = JSON.parse(this.state.puzzles[this.state.puzzle_counter].moves);

        self.game.load(fen);
        var fm = (self.game.turn() === 'w') ? "white" : "black";
      //  console.log(moves);
       // console.log(this.state.initialMoves);
        this.setState({
            moves : moves,
            first_move : fm,
            global_error : false,
            correct_i : 0,
            historyy : [],
            checkCounter : 0,
            move_made : false
        }, function () {
          //  console.log(self.state.puzzles[self.state.puzzle_counter].id);
            //console.log(this.state.historyy);
            window.cg = Chessground(document.getElementById('dirty'),{
                fen : fen,
                turnColor : fm,
                orientation : fm,
                viewOnly : (typeof puzzle_id === "undefined") ? false : true,

                movable : {
                    showDests : true,
                    free : false,
                    dests : getDests(self.game),
                    color: fm,
                },
                events: {
                    move: self.move
                }
            });
        });

        //проверяем конец паззлов
        this.checkPuzzlesEnd();
    }

    checkPuzzlesEnd(){
        //если число кратно 5, то идем за новой порцией треков
        if (this.state.puzzle_counter%5 === 0 && this.state.puzzle_counter%10 != 0 && this.request_sent != true) {
            this.request_sent = true;
            this.getPuzzles(++this.state.hundred);
        }
    }

    componentDidMount(){
        var self =  this;

        this.game = new Chess(pos);

        var fm = (this.game.turn() === 'w') ? "white" : "black";

        if (fm === "white" && this.state.start_black == 1) {
            fm = "black";
        }


        var width = $("#wrpr").width();
        $("#dirty").width(width);
        $("#dirty").height(width);

        //$(".countdown").width(width);




        if (typeof user_id === "undefined") {
            $(".card").width(width/1.5);
            if (document.documentElement.clientWidth < 1100) {
                $("#reg_button").html("Регистрация");
                $("#login_button").html("Вход");
                $(".center-card").height(width).width(width);
            }
        } else {

            if (document.documentElement.clientWidth < 1100) {
                $(".card").width(width/1.1);
                $(".center-card").height(width).width(width);
            } else {
                $(".center-card").height(width).width(width);
                $(".card").width(width/1.7);
            }

        }



        this.setState({
            width : width
        });

        var valid = self.game.moves();
        var p = [];
        for (var i = 0; i < valid.length; i++) {
            var obj = valid[i];
            p.push(obj.slice(-2));
        }


        $(function () {
            self.move_sound = $("#move_sound")[0];
            self.capture_sound = $("#capture_sound")[0];
        });



        if (typeof puzzle_id === "undefined") {
            //this.getPuzzles(this.state.hundred);
            window.cg = Chessground(document.getElementById('dirty'),{
                turnColor : "white",
                orientation : "white",
                movable : {
                    free : false,
                }
            });
        } else {
            this.getPuzzle(puzzle_id);
            $("#show_solution").on("click", function () {
                self.makeAutomaticMoves();
            });
        }



        $("body").on("click", ".start-btn", function () {
            self.hash = undefined;

            self.setState({
                state : "started",
                countError : 0,
                efforts_array : [],
                puzzles : [],
                level : 0,
                longest_streak : 0,
                current_streak : 0,
                hundred : 0,
                puzzle_counter : 0,
                correct_puzzle_counter : 0,
            }, function () {

                if (document.documentElement.clientWidth < 1100) {
                    $(".card").width(this.state.width/1.1);
                    $(".center-card").height(width).width(width);
                } else {
                    $(".center-card").height(width).width(width);
                    $(".card").width(width/1.7);
                }

                //$(".center-card").height(width).width(width);
              //  $(".card").width(width/1.5);

                self.getPuzzles(this.state.hundred);
                self.setInitialTimer();

            });

        });

        if ($("#scorrect").length){
            $("#scorrect").get(0).volume = 0.3;
            $("#swrong").get(0).volume = 0.3;
        }

        self.getResults();


    }

    start(){
        this.timer({
            timeleft : 300000,
            element : "#timer",
        });
    }
    getResults(){
        const self = this;
        $.ajax({
            url : '/puzzles/get_results',
            dataType : "json",
            method : "post",
            data : {
                restrict : this.state.restrict,
            },
            timeout : 3000,
            success : function (data) {
                self.setState({
                    users : data.users
                });

                if (typeof data.user != "undefined" && typeof data.user.user_today != "undefined" && typeof data.user.user_today[0] != "undefined") {
                    self.setState({
                        user_today : data.user.user_today[0].result,
                    });
                }
                if (typeof data.user != "undefined" && typeof data.user.user_all != "undefined" && typeof data.user.user_all[0] != "undefined") {
                    self.setState({
                        user_all : data.user.user_all[0].result,
                    });
                }
            },
            error : function ( jqXHR, textStatus ) {
                var error = "";
                for (var obj in jqXHR.responseJSON.errors) {
                    error = jqXHR.responseJSON.errors[obj].msg;
                }
                alert(error);

            },
        });
    }

    makeAutomaticMoves(){
        const self = this;
        if (self.wait_automove_flag === true) {
            alert("Ожидайте завершения ходов");
            return false;
        }

        self.wait_automove_flag = true;
        $("#show_solution").attr("disabled", "disabled");
       // console.log(self.state);
        var flag = false;
        if (self.state.puzzle_counter > 0) {
            flag = true;
        }
        var moves = (self.state.initialMoves) ? Object.assign([], self.state.initialMoves) : self.state.moves;


        self.setState({
            checkCounter: 0,
            puzzle_counter: 0,
            moves : moves

        }, function () {
            clearInterval(self.autoMovesTimer);
            if (flag) {
                self.setAnotherPuzzle();
            }

            //self.makeNextMove();
            self.autoMovesTimer = setInterval(function () {
                self.makeNextMove();
            }, 1000);
        });
    }


    timer(opts) {
        this.timeleft = parseInt(opts.timeleft)/1000;
        this.element = $(opts.element);

        if (this.timeleft > 0) {
            this.element.removeClass("hidden");
            this.setTimer();
            this.tick();
        } else {
            this.element.remove();
        }

    }


    setInitialTimer() {
        var self = this;
        this.iTimer = 3;
        self.initialTick();
        this.initialTimer = setInterval(function () {
       //     console.log(self.iTimer);
            self.iTimer--;
            if (self.iTimer > 0) {

                self.initialTick();
            } else {
                $("#start_timer").html("Go!");
                $("#start")[0].play();





                clearInterval(self.initialTimer);

                setTimeout(function () {
                    $("#start_timer").fadeOut();
                    self.start();
                    self.setState({
                        state : "main"
                    });
                }, 500)

            }
        }, 600);
    }
    initialTick(){
        $("#start_timer").html(this.iTimer);
        $("#stick")[0].play();

    }

    setTimer() {
        var self = this;
        clearInterval(this.interval);
        this.interval = setInterval(function () {
            self.timeleft = --self.timeleft;

            if (self.timeleft > 0) {
                self.tick();
            } else {
                self.timeleft = 0;
                self.tick();
                //self.element.remove();
                clearInterval(self.interval);
                self.setOver();
            }
        }, 1000);
    }

    setOver(){
        //$('#errored').modal({backdrop: 'static', keyboard: false})
        //$("#errored").modal('show');
        clearInterval(this.interval);
        cg.set({
            movable : {
                free : false,
                dests : []
            }
        });
        this.setState({
            state : "over",
            historyy : [],
        }, function () {
            //

            if (document.documentElement.clientWidth < 1100) {
                $(".card").width(this.state.width/1.1);
                $(".center-card").height(this.state.width).width(this.state.width);
            } else {
                $(".center-card").height(this.state.width).width(this.state.width);
                $(".card").width(this.state.width/1.7);
            }

            setTimeout(function () {
                $(".over-modal").addClass("in");
            }, 10);
            //this.saveResult();
            //$(".over-modal").addClass("in");
        });
        this.getResults();

    }
    saveResult(){
        const self = this;
        $.ajax({
            url : '/puzzles/save_result',
            dataType : "json",
            method : "post",
            data : {
                result : self.state.correct_puzzle_counter,
            },
            timeout : 3000,
            success : function () {

            },
            error : function ( jqXHR, textStatus ) {
                var error = "";
                for (var obj in jqXHR.responseJSON.errors) {
                    error = jqXHR.responseJSON.errors[obj].msg;
                }
                alert(error);

            },
        });
    }

    tick () {
        var secondsInAMinute = 60;
        var secondsInAnHour  = 60 * secondsInAMinute;
        var secondsInADay    = 24 * secondsInAnHour;

        // дни
        var days = Math.floor(this.timeleft / secondsInADay);

        // часы
        var hourSeconds = this.timeleft % secondsInADay;
        var hours = Math.floor(hourSeconds / secondsInAnHour);

        // минуты
        var minuteSeconds = hourSeconds % secondsInAnHour;
        var minutes = Math.floor(minuteSeconds / secondsInAMinute);

        // оставшиеся секунды
        var remainingSeconds = minuteSeconds % secondsInAMinute;
        var seconds = Math.ceil(remainingSeconds);

        seconds = (seconds < 10) ? "0" + seconds : seconds;
        this.element.html(minutes + ":" + seconds);
    };

    render() {
        var href = "/" + role_route + "/" + task_id + "/puzzle/" + next;
        var nextNullHref = "/" + role_route + "/" + task_id;
        if (!this.renderPos()) {return false;}
        return (
            <div className="col-lg-12">
                <div className="row">
                    <div className="col-md-6 col-sm-12">
                        <div id="testpng">
                        {(this.state.puzzle_current_state !== "over" && this.state.fenArrCursor > 0) ?
                            <h6 className="badge badge-danger dsp-block">Найдите {this.state.fenArrCursor + 1} вариант решения</h6>
                        : null }


                            {this.state.state === "started" ?
                                <div className="d-flex center-card justify-content-center align-items-center">
                                    <span className="score font-weight-bold" id="start_timer"></span>
                                </div>
                                : null}


                           {/* {(this.state.puzzle_status) ?
                                (this.state.puzzle_status === 'correct') ?
                                    <div className="correct-quick">
                                        <div className="img-circle big-icon green d-flex justify-content-center align-items-center">
                                            <i className="fa fa-check text-white status-icon"></i>
                                        </div>
                                    </div> : <div className="correct-quick">
                                        <div className="img-circle big-icon green d-flex justify-content-center align-items-center">
                                            <i className="fas fa-times text-white status-icon"></i>
                                        </div>
                                    </div> : null}*/}



                            {this.state.state === "welcome" ?
                                <div className=" d-flex center-card justify-content-center align-items-center">
                                    <div className="card">
                                        <div className="card-body p-0">
                                            <h3 className="card-title text-center pl-3 pl-3 mt-3 font-weight-bold">ЗАДАЧИ</h3>
                                            <div className="card-text text-center pl-3 pl-3">
                                                <img src="/images/puzzle.png" className="img-puzzle mt-2 mb-2" alt=""/>
                                                <div className="mt-2 mb-2 font-weight-bold text-success">Штурм</div>
                                            </div>
                                            <div className="bg-light w-100 p-4 text-center">
                                                Решите столько задач, сколько сможете, за 5 минут! С каждой задачей сложность возрастает. Три ошибки, и испытание закончено.
                                            </div>
                                        </div>
                                        <div className="text-center p-3">
                                            {typeof user_id === "undefined" ? <div>
                                                    <div className="mb-2">
                                                        <a href="/login" className="btn btn-block btn-success btn-lg">
                                                            <small id="login_button">Есть аккаунт? Вход</small>
                                                        </a>
                                                    </div>

                                                    <div>
                                                        <a href="/signup" className="btn btn-block btn-primary btn-lg">
                                                            <small id="reg_button">Зарегистрируйтесь, чтобы начать</small>
                                                        </a>
                                                    </div>
                                                </div> : <button className="btn btn-block btn-primary btn-lg start-btn">Начать</button>}

                                        </div>
                                    </div>
                                </div>

                                : null}


                            {this.state.state === "over" ?
                                <div className="d-flex center-card justify-content-center align-items-center over-modal">
                                    <div className="card">
                                        <div className="card-body p-0">
                                            <h3 className="card-title text-center pl-3 pl-3 pt-3 pb-3 font-weight-bold bg-success text-white">Неплохо!</h3>
                                            <div className="card-text text-center pl-3 pl-3 ">
                                                <span className="font-weight-bold">Ваш результат</span>
                                                <h1 className="font-weight-bold">
                                                    <div>{this.state.correct_puzzle_counter}</div>
                                                </h1>
                                            </div>

                                            <div className="row mt-4 mb-4">
                                                <span className="col-6 text-center">
                                                    <h6 className="mb-0"><i className="fas fa-calendar-day text-secondary"></i></h6>
                                                    <h6 className="mb-0"><small>СЕГОДНЯ</small></h6>
                                                    <h3 className="mb-0 font-weight-bold">{this.state.user_today}</h3>
                                                </span>

                                                <span className="col-6 text-center">
                                                    <h6 className="mb-0"><i className="fas fa-sync-alt text-secondary"></i></h6>
                                                    <h6 className="mb-0"><small>ВСЁ ВРЕМЯ</small></h6>
                                                    <h3 className="mb-0 font-weight-bold">{this.state.user_all}</h3>
                                                </span>
                                            </div>

                                            <div className="mt-5 mb-3">
                                                <div className="pl-4 pr-4 d-flex justify-content-between h-100 justify-content-center align-items-center mt-4">

                                                    <span><i className="fas fa-fire mr-2 text-secondary"></i><span className="text-secondary">Самая длинная серия</span></span>

                                                    <span>{this.state.longest_streak}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-center pl-4 pr-4 pt-3 pb-3  mb-3">
                                            <button className="btn btn-block btn-success btn-lg start-btn ">Сыграть снова</button>
                                        </div>
                                    </div>
                                </div>

                                : null}


                        <div className="brown cburnett is2d">
                            <div id="dirty" className="cg-board-wrap"></div>

                                <div className="d-none d-md-block">
                                    {(this.state.first_move === "white") ?
                                        <div className="bg-light text-white text-center p-2 font-weight-bold mb-2">
                                            <h3 className="m-0"><i className="fas fa-square text-white mr-1"></i> </h3>
                                        </div> :
                                        (this.state.first_move === "black") ?
                                            <div className="bg-dark text-white text-center p-2 font-weight-bold mb-2">
                                                <h3 className="m-0"><i className="fas fa-square text-black-50 mr-1"></i> </h3>
                                            </div> :
                                           null  }

                                </div>

                        </div>
                            {(this.state.new_elo !== null && this.state.puzzle_current_state === "over") ?
                                <div className="cover-center d-flex justify-content-center">
                                    <div className="cover"></div>

                                    <div className="align-self-center rating-center">
                                            <div className="alert alert-success">
                                                <div>Ваш новый рейтинг: {this.state.new_elo}</div>
                                                <div>Изменение: {this.state.diff}</div>
                                            </div>
                                    </div>
                                </div>
                                : null}

                        </div>
                </div>

                <div className="col-md-4 col-sm-12 ml-md-4">

                    {/*если это паззл раш, а не отдельный пазл*/}
                    {typeof puzzle_id === "undefined" ?

                        <div>

                            <div>
                                {(this.state.move_made === false && (this.state.state === "main" || this.state.state === "started")) ?
                                    <div>
                                        {(this.state.puzzle_status) ?
                                            (this.state.puzzle_status === 'correct') ?
                                            <div className="bg-success text-white text-center p-2 font-weight-bold mb-2">
                                                <h3 className="m-0"><i className="fas fa-check"></i>&nbsp;Правильно!</h3>
                                            </div> : <div className="bg-danger text-white text-center p-2 font-weight-bold mb-2">
                                                    <h3 className="m-0"><i className="fas fa-times"></i>&nbsp;Ошибка!</h3>
                                                </div>
                                            :
                                            <div>
                                                {(this.state.first_move === "white") ?
                                                    <div className="bg-light text-white text-center p-2 font-weight-bold mb-2">
                                                        <h3 className="m-0"><i className="fas fa-square text-white mr-1"></i> <span className="font-weight-bold text-dark">Ход белых</span></h3>
                                                    </div> :
                                                    (this.state.first_move === "black") ?
                                                        <div className="bg-dark text-white text-center p-2 font-weight-bold mb-2">
                                                            <h3 className="m-0"><i className="fas fa-square text-black-50 mr-1"></i> <span className="font-weight-bold text-white">Ход чёрных</span></h3>
                                                        </div> :
                                                        <div className="bg-success text-white text-center p-2 font-weight-bold mb-2">
                                                            <h3 className="m-0"><i className="fas fa-puzzle-piece mr-1"></i> <span className="font-weight-bold">Puzzle Rush</span></h3>
                                                        </div>  }

                                            </div>
                                        }
                                    </div>
                                    :
                                    <div className="bg-success text-white text-center p-2 font-weight-bold mb-2">
                                        <h3 className="mb-0"><i className="fas fa-puzzle-piece mr-1"></i>
                                            <span className="font-weight-bold">Puzzle Rush</span>
                                        </h3>
                                    </div>
                                }
                            </div>


                        <div>
                            {(typeof username != "undefined") ?
                                <div className="row d-flex justify-content-between h-100 justify-content-center align-items-center mt-4">

                                    <span className={this.state.state === "welcome" ? "col-4" : "col-3"}>
                                        <img src="/images/user.png" alt="..." className="rounded mx-auto" />
                                    </span>

                                    {this.state.state === "welcome" ? <span className="col-4 text-center">
                                        <h6 className="mb-0"><i className="fas fa-calendar-day text-secondary"></i></h6>
                                        <small className="mb-0">СЕГОДНЯ</small>
                                        <h3 className="mb-0 font-weight-bold">{this.state.user_today}</h3>
                                    </span> : <span className="col-5">
                                        <a href={"/users/" + user_id} target="_blank" className="text-nowrap"><small>{username}</small></a>
                                        <h1 className="font-weight-bold mb-0">{this.state.correct_puzzle_counter}</h1>
                                    </span>}






                                    {this.state.state === "welcome" ? <span className="col-4 text-center">
                                            <h6 className="mb-0"><i className="fas fa-sync-alt text-secondary"></i></h6>
                                            <small className="mb-0">ВСЁ ВРЕМЯ</small>
                                            <h3 className="mb-0 font-weight-bold">{this.state.user_all}</h3>
                                        </span> : <span className="col-4">
                                        <h1 id="timer" className="text-secondary text-right"></h1>
                                    </span>}

                                </div>
                                : null}
                            {/*<div className="streak-indicator-component sidebar-finish-streaks">
                                <div className="streak-indicator-streak streak-indicator-incorrect streak-indicator-link">
                                    <div className="icon-font-component streak-indicator-icon"><span className="icon-font-chess square-x"></span></div>

                                <small>101</small>
                            </div>
                                <div className="streak-indicator-streak streak-indicator-incorrect streak-indicator-link">
                                    <div className="icon-font-component streak-indicator-icon"><i className="fas fa-times-circle text-danger checkbox m-1"></i>
                                    </div>

                                161
                            </div>
                                <div className="streak-indicator-streak streak-indicator-incorrect streak-indicator-link">
                                        <div className="icon-font-component streak-indicator-icon"><span className="icon-font-chess square-x"></span></div>

                                    224
                                </div>
                            </div>*/}

                            {this.state.state !== "welcome" ?

                            <div className="col-12 streak-indicator-component sidebar-finish-streaks mt-3">
                                { this.state.efforts_array.map((item, index) => (
                                    <span key={index}>
                                        {item.result === true ?
                                            <a  href={"/puzzles/" + item.id} className="streak-indicator-streak streak-indicator-incorrect streak-indicator-link text-center"  target="_blank">
                                                <i className="icon-font-component streak-indicator-icon fas fa-check-square text-success checkbox m-1 "></i>
                                                <small className="icon-font-component streak-indicator-icon text-success font-weight-bold">{item.rating}</small>
                                            </a>
                                            :
                                            <a  href={"/puzzles/" + item.id} className="streak-indicator-streak streak-indicator-incorrect streak-indicator-link text-center"  target="_blank">
                                                <i className="icon-font-component streak-indicator-icon fas fa-times-circle text-danger checkbox m-1 "></i>
                                                <small className="icon-font-component streak-indicator-icon text-danger font-weight-bold">{item.rating}</small>
                                            </a>}
                                    </span>
                                ))}
                            </div> : null}
                        </div>
                            {this.state.state !== "welcome" ?


                                <div className="row mt-5">
                                    {this.state.state === "over" ? <div className="col-12 mb-2 text-secondary font-weight-bold text-center">
                                            <span className="btn btn-light start-btn"><i className="fas fa-redo-alt text-secondary font-weight-bold mr-1"></i>Сыграть снова  </span>
                                        </div> : null}

                                    {this.state.state === "main" ? <div className="col-12 mb-2 text-secondary font-weight-bold text-center">
                                            <span className="btn btn-light" onClick={this.setIncorrect}>Пропустить</span>
                                        </div> : null}

                                </div>
                                : null }
                                {/*<div className="row mt-2">

                                    <div className="col-12">
                                        <h5 className="text-secondary font-weight-bold text-center"><i className="fa fa-medal text-secondary font-weight-bold"></i> Global</h5>
                                    </div>
                                </div>*/}


                            <div className="row mt-2">
                                <div className="col-12">
                                    <div className="d-flex justify-content-between justify-content-center align-items-center">
                                        <span>Таблица лидеров</span>
                                        <span>
                                            <select className="form-control form-control-sm" onChange={this.setResultsRange}>
                                              <option value="all">Все</option>
                                              <option value="daily">За день</option>
                                            </select>
                                        </span>
                                    </div>
                                    <hr className="mt-2 mb-2"/>
                                    <div className="table-wrapper">
                                        <table className="table table-sm table-hover">
                                            <tbody>
                                                {this.state.users.map((item, index) => (
                                                    <tr key={index} >
                                                        <td className="w-10 text-center font-weight-bold">#{index + 1}</td>
                                                        <td className="w-15 pl-1 text-center">
                                                            <img className="rounded mx-auto max" src={item.user_image} alt=""/>
                                                        </td>
                                                        <td className="w-65 font-weight-bold"><a target="_blank" href={"/users/" + item.user_id}> {item.user_name}</a>
                                                            &nbsp;
                                                            {item.country ? <span className="country"><img className="flag" src={"/images/flags/" + item.country + ".png"} /></span> : null}

                                                        </td>
                                                        <td className="w-10 text-center font-weight-bold">{item.result}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                    </div>
                        :
                        <div>
                            {/*если это отдельный пазл*/}
                            <div className="btn btn-block btn-info btn-lg" id="show_solution">Показать решение</div>
                            {/*<div className="btn btn-block btn-light btn-sm mt-5">Запрос на проверку</div>*/}
                        </div>}
                </div>
            </div>
                <div className="modal" id="errored" tabIndex="-1" role="dialog"  aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header panel-warning">
                                <h5 className="modal-title" id="exampleModalLabel">Вы совершили слишком много ошибок!</h5>

                            </div>
                            <div className="modal-body">
                                {(next != null) ?
                                    <div>
                                        <a href={href} className="mb-3" >
                                            Следующая задача
                                        </a>
                                    </div>
                                : null}
                                {(next == null || role == 1) ?
                                    <div>
                                        <a href={nextNullHref} className="mb-3">
                                            Выбор задачи
                                        </a>
                                    </div>
                                : null}


                                {(this.state.new_elo !== null) ?
                                    <div className="mt-3">
                                        <div className="alert alert-danger">
                                            <div>Ваш новый рейтинг: {this.state.new_elo}</div>
                                            <div>Изменение: {this.state.diff}</div>
                                        </div>
                                    </div>
                                    : null}


                            </div>
                        </div>
                    </div>
                </div>

            </div>
        );
    }
}
$(function () {
    render(
        <App/>
        , document.getElementById('tsk'));
})


function getDests(game) {
    var dests = {};
    game.SQUARES.forEach(function (s) {
        var ms = game.moves({ square: s, verbose: true });
        if (ms.length)
            dests[s] = ms.map(function (m) { return m.to; });
    });
    return dests;
}


function shuffle(array) {
    var tmp, current, top = array.length;

    if (top) while (--top) {
        current = Math.floor(Math.random() * (top + 1));
        tmp = array[current];
        array[current] = array[top];
        array[top] = tmp;
    }

    return array;
}



function compare2(a, b) {
    if (a.id < b.id)
        return -1;
    if (a.id > b.id)
        return 1;
    return 1;
}

