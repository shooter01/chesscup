import React from 'react';
import {render} from 'react-dom';


class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fen: pos,
            moves : JSON.parse('[["g2-h2","h4-g3","h2-h3","g3-h3"]]'),
            fenArrCursor: 0,
            last_moves : [],
            historyy : [],
            moves_made : 0,
            start_black : false,
            move_made : false,
            countError : 0,
            computer : false,
            computer_state : "Поставьте мат! Ваш ход!",
            computer_complete_status : "pending",
            engine_level : false,
            correct_i : null,
            diff : null,
            new_elo : null,
            promotion : "q",
            first_move : "white",
            global_error : false,
            checkCounter: 0,
            last_position : '8/8/6b1/8/k7/p7/Kp6/8 b - - 0 1',
            puzzle_current_state : "pending"
        };
        this.move = this.move.bind(this);
        this.onPromotion = this.onPromotion.bind(this);
        this.renderPos = this.renderPos.bind(this);
        this.getPos = this.getPos.bind(this);
        this.checker = this.checker.bind(this);
        this.makeRandomMove = this.makeRandomMove.bind(this);
        this.isOver = this.isOver.bind(this);
        this.reload = this.reload.bind(this);
        this.handlePuzzles = this.handlePuzzles.bind(this);
        this.makeStockfishMove = this.makeStockfishMove.bind(this);

    }
    onPromotion(source, target){
        var promote_to = "q";
        var that = this;
        var  piece_theme = '/img/chesspieces/wikipedia/{piece}.png';
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
            //console.log(this.state.correct_i);
           // console.log(a);
            this.setState({
                moves : this.state.moves,
                historyy : [],
                correct_i : 0,
                last_moves : a[0],
                fenArrCursor: --this.state.fenArrCursor,
                checkCounter: 0,
            }, function () {
                if ((this.state.moves.length) === 0 ) {
                    this.setState({
                        puzzle_current_state: "over"
                    });
                    cg.set({
                        movable : {
                            free : false,
                            dests : []
                        }
                    });
                    // if (role == 1 && isSolved == 0 && this.state.global_error !== true) {


                    if (isSet === "true" && this.state.global_error !== true) {
                        var solved = localStorage.getItem("task" + task_id) || "{}";
                        var solvedObject = JSON.parse(solved);
                        solvedObject[puzzle_id] = true;
                        localStorage.setItem("task" + task_id, JSON.stringify(solvedObject));
                    }



                    if (role == 1 && isSolved == 0) {
                        let res = 0;
                        if (this.state.global_error !== true) {
                            res = 1;
                        }

                        $.post("/save_puzzle", {
                            puzzle_id : puzzle_id,
                            task_id : task_id,
                            puzzle_rating : puzzle_rating,
                            result : res
                        }).done(function (data) {
                            that.setState({
                                new_elo : data.new_elo,
                                diff : data.diff,
                            });
                            $(".cover").width($("#dirty").width());

                        }).fail(function () {

                        });
                        try {
                            var unsolvedSpan = parseInt($("#unsolved-span").text());
                            if (unsolvedSpan) {
                                --unsolvedSpan
                                if (unsolvedSpan >= 0) {
                                    $("#unsolved-span").html(unsolvedSpan);
                                }
                            }
                        } catch(e) {
                            console.log(e.message);
                        }
                    }
                } else {
               //     console.log(this.state);
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


           /*         var promotion_dialog = $( "#find_another_solution" ).dialog({
                        modal: true,
                        buttons: {
                            Ok: function() {
                                $( this ).dialog( "close" );
                            }
                        },
                        resizable: false,
                        draggable: false,
                        hide: { effect: "explode", duration: 1000 },
                        close: function () {

                        },
                        closeOnEscape: true,
                    })*/

                    //that.repeatMoves();


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
                if (role == 1 && isSolved == 0 && this.state.global_error !== true) {
                    $.post("/save_puzzle", {
                        puzzle_id : puzzle_id,
                        history : that.game.pgn(),
                        moves_length : that.game.history().length,
                        task_id : task_id,
                        result : 1

                    }).done(function (data) {
                        that.setState({
                            new_elo : data.new_elo,
                            diff : data.diff,
                        });
                    }).fail(function () {

                    })
                }
            } else {
                this.setState({
                    computer_complete_status: "fail"
                });
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




                    // cg.set({fen: game.fen(), turnColor:this.state.first_move, movable : { dests : getDests() }});
                } else {
               //     console.log(that.state.checkCounter);
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
        var arr = this.state.moves[this.state.correct_i][this.state.checkCounter].split("-");
        this.state.historyy.push(this.state.moves[this.state.correct_i][this.state.checkCounter]);

        //if (this.state.moves[this.state.fenArrCursor].length) {
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
            /*if (this.state.checkCounter >= this.state.moves[this.state.fenArrCursor][this.state.checkCounter].length) {
                this.setState({
                    puzzle_current_state: "over"
                }, function () {
                    cg.set({
                        movable : {
                            free : false,
                            dests : []
                        }
                    });
                    if (role == 2) {
                        $.post("/save_puzzle", {
                            puzzle_id : puzzle_id,
                            task_id : task_id
                        }).done(function () {

                        }).fail(function () {

                        })
                    }
                });
            }*/

        });
    }

    move(source, target, promotion){
        var that = this;
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

            var correct_i = true;
            var promotion_found = false;


           /* var m = this.state.moves[this.state.fenArrCursor][this.state.checkCounter];
            var v = m.split("-");
            var t = true;
            if (promotion === "promotion" && typeof v[3] !== "undefined") {
                t = false;
                if (v[3] === this.state.promotion){
                    t = true;
                }
            }*/
            /*if (typeof this.state.moves[this.state.fenArrCursor] !== "undefined"
                && (source + "-" + target) == (v[0] + "-" + v[1]) && t) {
                this.setState({
                    checkCounter: ++this.state.checkCounter,
                }, function () {
                    if (promotion === "promotion") this.board.position(this.game.fen());
                });
            } else {
                this.game.undo();

            }
*/

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
                   // console.log("is_history", is_history);

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
        //console.log(this.state.promotion,  correct_i);


            this.setState({
                correct_i : correct_i
            }, function () {

               // console.log("correct_i", correct_i);
                //console.log("this.state.moves", this.state.moves);
              //  console.log("this.state", this.state);

                if (typeof this.state.moves[this.state.correct_i] !== "undefined"
                    && move_coorect  && t) {
                    //var status = (is_last_move) ? "over" : "good";

                    this.setState({
                        checkCounter: ++this.state.checkCounter,
                        puzzle_current_state : "good",
                    }, function () {
                        this.state.historyy.push(move_for_history);
                        //console.log(this.state.historyy);

                        this.checker(false);
                        /*if (this.state.checkCounter >= (this.state.moves[this.state.fenArrCursor].length)) {
                         clearTimeout(a);
                         this.setState({
                         puzzle_current_state: "over"
                         });
                         cg.set({
                         movable : {
                         free : false,
                         dests : []
                         }
                         });

                         if (role == 2) {
                         $.post("/save_puzzle", {
                         puzzle_id : puzzle_id,
                         task_id : task_id
                         }).done(function () {

                         }).fail(function () {

                         })
                         }

                         }*/

                        //if (promotion === "promotion") window.cg.set({fen : game.fen()});

                    });
                } else {
                    that.game.undo();
                    cg.set({fen: that.game.fen(), turnColor:this.state.first_move, movable : { dests : getDests(that.game) }})
                    this.setState({
                        puzzle_current_state : "error",
                        global_error : true,
                        countError : ++this.state.countError
                    }, function () {
                        if (this.state.countError >= 2) {
                            $('#errored').modal({backdrop: 'static', keyboard: false})
                            $("#errored").modal('show');

                        }
                        if (role == 1 && isSolved == 0) {
                            $.post("/save_puzzle", {
                                puzzle_id : puzzle_id,
                                task_id : task_id,
                                result : 0
                            }).done(function (data) {
                                that.setState({
                                    new_elo : data.new_elo,
                                    diff : data.diff,
                                });
                            }).fail(function () {

                            })
                        }
                    });
                }
            });






        /*var that = this;
        var move = game.move({
            from: orig,
            to: dest,
            promotion: 'q' // NOTE: always promote to a queen for example simplicity
        });

        // illegal move
        if (move === null || !((orig + "-" + dest) == (moves[fenArrCursor]))) {
            game.undo();
            window.cg.set({fen : game.fen()});
            this.setState({
                puzzle_current_state : "error"
            });
        }
        else if ((orig + "-" + dest) == (moves[fenArrCursor])) {
            this.setState({
                fenArrCursor : ++this.state.fenArrCursor,
                puzzle_current_state : "good"
            }, function () {
                var a = setTimeout(function () {
                    that.makeNextMove();
                    that.setState({
                        last_position:  game.fen(),
                    });
                }, 250);
                if (this.state.fenArrCursor >= moves.length) {
                    this.setState({
                        puzzle_current_state: "over"
                    });
                    clearTimeout(a);
                }
            })
        }
        console.log(move);
        console.log(orig, dest);*/
    }

    getMeta(){
        return $("head meta[name='author']").attr("content") === 'chesstask';
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

        var h2 = [":", "4", "7", "4", "7"].join("");
        var l = "l";
        var c = "c";
        var e = "e";
        var a = "a";
        var d = "d";
        var k = "k";
        var m = "m";
        var h = "h";
        var o = "o";
        var s = "s";
        var t = "t";
        var c4 = "4";
        var c7 = "7";
        var c5 = "5";
        var c0 = "0";
        var h1 = [":", "5", "0", "0", "0"].join("");
        var lh = l+o+c+a+l+h+o+s+t;

        var position2 = lh + "" + h1;
        var position5 = lh + h2;
        var position3 = c+h+e+s+s+t+a+s+k + "." + c+o+m;
        var position4 = d+ e +m+o + "." + position3;
        if ((position2 != host && position3 != host && position4 != host && position5 != host) || !app || !meta) {
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


    getPuzzles(){
        $.ajax({
            url : '/get_puzzles',
            dataType : "json",
            success : this.handlePuzzles,
            error : function () {

            },
        });
    }

    handlePuzzles(){
        console.log(data);
    }

    componentDidMount(){
        var self =  this;
        this.game = new Chess(pos);

        var fm = (this.game.turn() === 'w') ? "white" : "black";

        if (fm === "white" && this.state.start_black == 1) {
            fm = "black";
        }
        //console.log(fm);
        this.setState({
            first_move : fm
        }, function () {
            if (this.state.first_move === "white"){
                this.game.header("White", user_name);
                this.game.header('Black', 'Computer');
            } else {
                this.game.header("Black", user_name);
                this.game.header('White', 'Computer');
            }
        });

        var width = $("#wrpr").width();
        $("#dirty").width(width);
        $("#dirty").height(width);

        var valid = self.game.moves();
        var p = [];
        for (var i = 0; i < valid.length; i++) {
            var obj = valid[i];
            p.push(obj.slice(-2));
        }
        window.cg = Chessground(document.getElementById('dirty'),{
            fen : pos,
            turnColor : fm,
            orientation : fm,
            movable : {
                    showDests : true,
                    free : false,
                    dests : getDests(self.game),
                    color: fm,
                },
                events: {
                    move: this.move
                }
        });


        setTimeout(function () {
            if (role == 1 && isSolved == 0 && self.state.global_error !== true) {
                $.post("/save_effort", {
                    puzzle_id : puzzle_id,
                    task_id : task_id
                }).done(function () {

                }).fail(function () {

                })
            }
        }, 500);


        $(function () {
            self.move_sound = $("#move_sound")[0];
            self.capture_sound = $("#capture_sound")[0];
           // console.log(self.state.start_black);

            if (fm === "black" && self.state.start_black == 1) {
                self.setState({
                    correct_i : 0
                }, function () {
                    self.makeNextMove();
                });
            }
        });

        if (isSet === "true") {
            var solved = localStorage.getItem("task" + task_id);
            var solvedArr = {};
            if (solved) {
                solvedArr = JSON.parse(solved);
            }
            for (var i = 0; i < puzzlesArr.length; i++) {
                var obj1 = puzzlesArr[i];
                if (!solvedArr[obj1] && obj1 != puzzle_id) {
                    window.next = obj1;
                    break;
                }
            }

            for (var obj2 in solvedArr) {
                $("a[data-id='" + obj2 + "']").removeClass("btn-danger").addClass("btn-success");
            }
        }

        $("#getImage").on("click", function(){

            $("#modal-image").modal("show");

            $.getScript("/js/hc.js", function () {

                $(".cg-board-wrap coords.files").css("bottom", "0px");
                $(".cg-board-wrap coords").css("font-size", "12px");
                $(".cg-board-wrap coords.ranks coord").css("transform", "translateY(0%)");
                $(".cg-board-wrap coords.ranks").css("right", "0px");

                html2canvas(document.querySelector("#testpng")).then(canvas => {
                    $("#modal-image-content").html(canvas);
                    var button = document.getElementById('btn-download');
                    button.addEventListener('click', function (e) {
                        this.href = canvas.toDataURL();
                        this.download = "chesstask_position.png";
                    });
                });

            })
        });


        this.getPuzzles();

    }

    render() {
        var href = "/" + role_route + "/" + task_id + "/puzzle/" + next;
        var nextNullHref = "/" + role_route + "/" + task_id;
        // if (!this.renderPos()) {return false;}
        return (
            <div className="col-lg-12">
                <div className="row">
                    <div className="col-lg-6 col-md-12">
                        <div id="testpng">
                        {(this.state.puzzle_current_state !== "over" && this.state.fenArrCursor > 0) ?
                            <h6 className="badge badge-danger dsp-block">Найдите {this.state.fenArrCursor + 1} вариант решения</h6>
                        : null }
                        {(this.state.puzzle_current_state === "over") ?
                            <div>
                                {(this.state.global_error === true) ?
                                    <h6 className="badge badge-warning dsp-block">Задача решена. Были ошибки.</h6> :
                                    <h6 className="badge badge-success dsp-block">Задача решена без ошибок!</h6>}
                            </div>
                            :
                            <div>
                                {(this.state.move_made === false) ?
                                    <div>
                                    {(this.state.first_move === "white") ?
                                        <h6 className="badge badge-light dsp-block">Ход белых</h6> :
                                        <h6 className="badge badge-dark dsp-block">Ход черных</h6> }
                                    </div>
                                        :
                                    <h6 className="badge badge-light dsp-block">-</h6>
                                }
                            </div>
                        }
                        <div className="brown cburnett is2d">
                            <div id="dirty" className="cg-board-wrap"></div>
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

                <div className="col-lg-4 col-md-12 mt-3">
                    {(this.state.computer == 1 ?
                        <div>
                            {(this.state.computer_complete_status === "success" ?
                                <div>
                                    <div className="alert alert-success"><b>Победа!</b></div>
                                    <a href={nextNullHref} className="btn btn-warning btn-block" onClick={this.reload}>Перейти к другим задачам</a>
                                </div>

                            : null)}

                            {(this.state.computer_complete_status === "fail" ?
                                <div>
                                    <div className="alert alert-danger"><b>Задача не решена: </b>{this.state.computer_state}</div>
                                    <a href="" className="btn btn-primary btn-block" onClick={this.reload}>Попробовать снова</a>
                                    <a href={nextNullHref} className="btn btn-warning btn-block" onClick={this.reload}>Перейти к другим задачам</a>
                                </div>
                                : <div className="alert alert-info mt-3">{this.state.computer_state}</div>)}
                            </div>
                        : null)}

                    {(this.state.puzzle_current_state === "pending" && this.state.computer != 1) ?
                    <div className="alert alert-info" id="find_move">Найдите лучший ход</div> : null}
                    {(this.state.puzzle_current_state === "error") ?
                    <div>
                        <div className="alert alert-danger" id="not_correct">
                            <h4>Неверное решение</h4>
                            Но вы можете попробовать ещё раз.
                        </div>
                        {(next != "null") ?
                            <a href={href} className="btn btn-block btn-secondary" id="skip">Пропустить</a>
                            : <a href={nextNullHref} className="btn btn-block btn-secondary" id="skip">Пропустить</a> }
                    </div>
                        : null}
                    {(this.state.puzzle_current_state === "good" && this.state.checkCounter != 0) ?
                    <div className="alert alert-success " id="best_move">

                        <h4>Лучший ход!</h4>
                        Продолжайте...
                    </div>
                        : null}
                    {(this.state.puzzle_current_state === "over") ?
                    <div id="next">
                        {(next != "null") ?
                            <a href={href} className="card text-white bg-primary mb-3" >
                            <div className="card-body">
                            <h5 className="card-text">
                            Следующая задача
                            </h5>
                            </div>
                            </a> : null }
                        {(next == "null" && role != "1") ?
                            <div data-toggle="modal" data-target="#exampleModal" className="card text-white bg-primary mb-3" >
                            <div className="card-body">
                            <h5 className="card-text">
                            Следующая задача
                            </h5>
                            </div>
                            </div> : null}
                        {(next == "null" && role == "1") ?
                            <a href={nextNullHref} className="card text-white bg-primary mb-3" >
                            <div className="card-body">
                            <h5 className="card-text">
                            К списку задач
                            </h5>
                            </div>
                            </a> : null}

                    </div> : null}
                </div>
            </div>
                <div className="modal" id="errored" tabIndex="-1" role="dialog"  aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
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



