import React from 'react';
import {render} from 'react-dom';
import TournamentStatus from "./TournamentStatus.jsx";
import TeamsTables from "./teams_tables.jsx";
import Participants from "./participant.jsx";
import WS from "../ws";
import Tours from "./Tours.jsx";


class Pairing extends React.Component {
    constructor(props) {
        super(props);
        this._isMounted = false;

        this.state = {
            pairs: pairs,
            tournament_id: tournament_id,
            tournament: tournament,
            current_tour: current_tour,
            teams_scores: teams_scores,
            tournaments_teams: tournaments_teams,
            team_tour_points: team_tour_points,
            user_pairs: [],
            team_boards: Array.apply(null, {length: parseInt(team_boards)}).map(Function.call, Number),
            user_id: [],
            results_table: results_table,
            participants_boards: participants_boards,
            participants: participants,
            participants_array: participants_array,
            owner: window.owner,
            type: type,
            save_url: (type != "null" && type == 20) ? "/tournament/save_teams_result" : "/tournament/save_result",
        }
        this.saveResult = this.saveResult.bind(this);
        this.getActualData = this.getActualData.bind(this);
        this.handleWSData = this.handleWSData.bind(this);
        this.getActualData = this.getActualData.bind(this);
        this.updateTournament = this.updateTournament.bind(this);
        this.getActualData = this.getActualData.bind(this);
        this.socketAddMessage = this.socketAddMessage.bind(this);
    }


    socketAddMessage(data){
        const self = this;

        $(".messages").append('<div class="mt-1 mt-2"><b>' + data.data.name + '</b>&nbsp;&nbsp;' + data.data.msg + '</div>');

        this.scrollToBottomMessages()
        console.log(data);
    }
    scrollToBottomMessages(){
        var objDiv = document.querySelector("#messages");
        if (objDiv) {
            objDiv.scrollTop = objDiv.scrollHeight;
        }
    }

    addMessage(){
        const self = this;
        var mes = $(".message-input-text").val();
        if (mes != "") {
            if (typeof user_name === "undefined") {
                return false;
            }
            let item = {
                msg: mes,
                action: "message",
                user_id: u,
                name: user_name,
                game_id: "t" + self.state.tournament_id,
                chat_id : self.state.chat_id
            };

            self.socket.ws.send(JSON.stringify(item));

            $(".message-input-text").get(0).value = "";
            $(".message-input-text").get(0).focus();
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

    componentDidMount(){
        var that = this;
        const self = this;

        this._isMounted = true;

        $("#next_tour").on("click", function () {
            $.ajax({
                url: "/tournament/make_draw",
                method: "post",
                timeout : 3000,
                beforeSend : function () {
                    that.setState({
                        request_sent : true,
                    });
                },
                data : {
                    //result : value,
                    tournament_id : that.state.tournament_id
                },
                statusCode: {
                    404: function() {
                        alert( "page not found" );
                    }
                }
            }).done(function (data) {
                if (data.status === "ok") {
                    if (data.updated_tour == null){
                        location.href = "/tournament/" + that.state.tournament_id + "/final";
                    } else {
                        location.href = "/tournament/" + that.state.tournament_id + "/tour/" + data.updated_tour;
                    }
                } else {
                    alert(data.msg);
                }
            }).fail(function ( jqXHR, textStatus ) {
                alert( "Request failed: " + textStatus );
            }).always(function () {
                that.setState({
                    request_sent : false
                });
            });
        });


        $("#delete_all").on("click", function (event) {
            event.preventDefault();
            if (confirm("Вы уверены? Все данные будут удалены.")) {
                $.ajax({
                    url: "/tournament/delete",
                    method: "post",
                    timeout : 3000,
                    beforeSend : function () {
                        that.setState({
                            request_sent : true,
                        });
                    },
                    data : {
                        //result : value,
                        tournament_id : that.state.tournament_id
                    },
                    statusCode: {
                        404: function() {
                            alert( "page not found" );
                        }
                    }
                }).done(function (data) {
                    if (data.status === "ok") {
                        location.reload();
                    } else {
                        alert(data.msg);
                    }
                }).fail(function ( jqXHR, textStatus ) {
                    alert( "Request failed: " + textStatus );
                }).always(function () {
                    that.setState({
                        request_sent : false
                    });
                });
            }
        });


        $(".sendMessage").on("click", function () {
            self.addMessage();

            return false;
        });

        $(".message-input-text").on("keydown", function (e) {
            if(e.keyCode == 13 && e.shiftKey == false) {
                self.addMessage();
                e.preventDefault();
            }
        });



        that.socket = new WS(function (data) {
            that.handleWSData(data);
        }, "localhost:7000");

        /*$(document).on("tournament_event", function () {
            that.updateTournament();
        });*/


        // this.getUsers(200);
    }

    handleWSData(data){
        const self = this;
        if (data.action === "get_apply") {
            $(document).trigger("get_apply");
        } else if (data.action === "participant") {
            //$(document).trigger("participant");

            this.setState({
                teams : data.teams
            });

        } else if (data.action === "tournament_event") {
            self.updateTournament();

        } else if (data.action === "message") {
            this.socketAddMessage(data);
        }
        console.log(data);

    }

    updateTournament() {
        this.getActualData();
    }
    getActualData(){
        var self = this;
        $.getJSON('/tournament/' + this.state.tournament.id + '/get_info').done(function (data) {
            if (self._isMounted) {
                self.setState({
                    pairs: JSON.parse(data.pairs) || [],
                    results_table: JSON.parse(data.results_table) || [],
                    tournament: data.tournament || {},
                    participants_boards: JSON.parse(data.participants_boards) || [],
                    participants: JSON.parse(data.participants) || {},
                    participants_array: JSON.parse(data.participants_array) || [],
                    tournaments_teams: JSON.parse(data.tournaments_teams) || [],
                });
            }
        });
    }
    saveResult(event){

        var that = this;
        var $target = $(event.target);
        var value = event.target.value;

        var val = JSON.parse(value);
        $.ajax({
            url: this.state.save_url,
            method: "post",
            timeout : 3000,
            beforeSend : function () {
                that.setState({
                    request_sent : true,
                });
            },
            data : {
                result : value,
                tournament_id : this.state.tournament_id
            },
            statusCode: {
                404: function() {
                    alert( "page not found" );
                }
            }
        }).done(function (data) {
            var $badge = $target.closest("td").find(".badge");

            if (data.status === "ok") {
                $badge.removeClass("hidden").addClass("badge-success").html("сохранено");
            } else {
                $badge.removeClass("hidden").addClass("badge-danger").html("ошибка сохранения");
            }

            var state = that.state.pairs;
            var tour_points = that.state.team_tour_points;

            for (var y = 0; y < state.length; y++) {
                var obj1 = state[y];
                if (typeof obj1.users != "undefined") {
                    for (var i = 0; i < obj1.users[0].length; i++) {
                        var obj = obj1.users[0][i];
                        if (obj.p1_id === val.p1_id && obj.p2_id === val.p2_id) {
                            obj.rating_change_p1 = data.rating_change_p1;
                            obj.rating_change_p2 = data.rating_change_p2;
                        }
                    }
                }
            }

            for (var obj2 in data.teams_points) {
                tour_points[obj2] = data.teams_points[obj2];
            }


            that.setState({
                pairs: state,
                team_tour_points: tour_points,
            });

            setTimeout(function () {
                $badge.addClass("hidden").removeClass("badge-success badge-error").html("");
            }, 1000);

        }).fail(function ( jqXHR, textStatus ) {
            alert( "Request failed: " + textStatus );
        }).always(function () {
            that.setState({
                request_sent : false
            });
        });
       // console.log(event.target.value);
    }


    render() {
//console.log(this.state.pairs);
        var w5 = {
            width : "5%"
        };
        var w12 = {
            width : "12%"
        };
        var w30 = {
            width : "36.5%"
        };
        var disabled = {
            disabled : "disabled"
        };
        return (
            <div className="position-relative">

                <TournamentStatus tournament={this.state.tournament} />


                    {this.state.pairs.map((item, index) => (
                        <div className="mt-2 mb-5" key={index}>



                            {typeof item.users != "undefined" ?


                            <table className="table table-hover table-bordered table-sm mb-0 ">
                                <thead className="thead-light">
                                    <tr>
                                        <th  scope="col" className="text-center pairing-team-thead" style={w5}> </th>
                                        <th  scope="col" className="text-center pairing-team-thead"  style={w30}>{item.team_1_id} {this.state.tournaments_teams[item.team_1_id].name} </th>
                                        <th  scope="col" className="text-center pairing-team-thead" style={w5}>{item.team_1_scores}</th>


                                        {(this.state.type == 20 && (tour_id != "null" && tour_id == current_tour && typeof this.state.owner !== "undefined")) ?

                                        <th  scope="col" className="text-center pairing-team-thead" style={w12}> <select name="" className="custom-select form-control-sm" id="" defaultValue={JSON.stringify({
                                            p1_id:item.team_1_id,
                                            p2_id:item.team_2_id,
                                            p1_won:item.team_1_won,
                                            p2_won:item.team_2_won
                                        })} {...(!item.team_2_id || !item.team_2_id) ? disabled : ""} onChange={this.saveResult}>


                                            <option value={JSON.stringify({
                                                p1_id:item.team_1_id,
                                                p2_id:item.team_2_id,
                                                p1_won:0,
                                                p2_won:0
                                            })}> </option>

                                            {
                                                this.state.team_boards.map((board, index) => (
                                                    <option key={index} value={JSON.stringify({
                                                        p1_id:item.team_1_id,
                                                        p2_id:item.team_2_id,
                                                        p1_won:board,
                                                        p2_won:this.state.team_boards.length - (board)
                                                    })}>{(board)}:{this.state.team_boards.length - (board)}</option>
                                                ))
                                            }

                                            <option key={index} value={JSON.stringify({
                                                p1_id:item.team_1_id,
                                                p2_id:item.team_2_id,
                                                p1_won:this.state.team_boards.length,
                                                p2_won:0
                                            })}>{this.state.team_boards.length}:0</option>

                                            <option value={JSON.stringify({
                                                p1_id:item.team_1_id,
                                                p2_id:item.team_2_id,
                                                p1_won:this.state.team_boards.length/2,
                                                p2_won:this.state.team_boards.length/2
                                            })}>{(this.state.team_boards.length/2)}:{this.state.team_boards.length/2}</option>


                                        </select> <span className="badge"></span></th> :
                                            <th  scope="col" className="text-center pairing-team-thead" style={w12}> {this.state.team_tour_points[item.team_1_id] || 0} : {this.state.team_tour_points[item.team_2_id] || 0} </th>
                                        }


                                        <th  scope="col" className="text-center pairing-team-thead" style={w5}>{item.team_2_scores}</th>
                                        <th  scope="col" className="text-center pairing-team-thead" style={w30}>{item.team_2_id} {(this.state.tournaments_teams[item.team_2_id] ? this.state.tournaments_teams[item.team_2_id].name : null)} </th>
                                    </tr>

                                </thead>


                                <tbody>
                                {item.users[0].map((pair, index)=>(
                                        <tr key={index}>
                                            <td className="text-center">{index + 1}</td>
                                            <td>
                                                {pair.p1_id} {pair.p1_name}
                                            <span className="badge badge-dark">{pair.p1_rating_for_history}</span>
                                                {(pair.rating_change_p1 > 0) ?
                                                    <span className="badge badge-success">+{pair.rating_change_p1}</span> :
                                                    <span className="badge badge-danger">{pair.rating_change_p1}</span>
                                                }
                                                    </td>
                                            <td className="text-center">{pair.p1_scores}</td>
                                            <td className="text-center">
                                                {/*{JSON.stringify(item)}*/}
                                                {(tour_id != "null" && tour_id == current_tour && typeof this.state.owner !== "undefined") ?

                                                    <span>
                                                        <select name="" className="custom-select form-control-sm" id="" defaultValue={JSON.stringify({
                                                            p1_id:pair.p1_id,
                                                            p2_id:pair.p2_id,
                                                            p1_won:pair.p1_won,
                                                            p2_won:pair.p2_won
                                                        })} {...(!pair.p2_id || !pair.p1_id) ? disabled : ""} onChange={this.saveResult}>
                                                            <option value={JSON.stringify({
                                                                p1_id:pair.p1_id,
                                                                p2_id:pair.p2_id,
                                                                p1_won:0,
                                                                p2_won:0
                                                            })}> </option>
                                                            <option value={JSON.stringify({
                                                                p1_id:pair.p1_id,
                                                                p2_id:pair.p2_id,
                                                                p1_won:1,
                                                                p2_won:0
                                                            })}>1:0</option>
                                                            <option value={JSON.stringify({
                                                                p1_id:pair.p1_id,
                                                                p2_id:pair.p2_id,
                                                                p1_won:0,
                                                                p2_won:1
                                                            })}>0:1</option>
                                                            <option value={JSON.stringify({
                                                                p1_id:pair.p1_id,
                                                                p2_id:pair.p2_id,
                                                                p1_won:0.5,
                                                                p2_won:0.5
                                                            })}>½:½</option>
                                                        </select>
                                                        <span className="badge"></span>
                                                    </span>
                                                    : <div>{pair.p1_won} - {pair.p2_won}</div>}
                                            </td>
                                            <td className="text-center">{pair.p2_scores}</td>
                                            <td>{pair.p2_id} {pair.p2_name}
                                                <span className="badge badge-dark">{pair.p2_rating_for_history}</span>
                                                {(pair.rating_change_p2 > 0) ?
                                                    <span className="badge badge-success">+{pair.rating_change_p2}</span> :
                                                    <span className="badge badge-danger">{pair.rating_change_p2}</span>
                                                }

                                            </td>
                                        </tr>

                                ))}


                                    </tbody>
                                </table>
                                : null}
                        </div>
                    ))}

                {!this.state.tournament.is_active && this.state.tournament.is_online ? <Participants tournaments_teams={this.state.tournaments_teams} /> : <Tours tournament={this.state.tournament} />}
                <TeamsTables
                        results_table={this.state.results_table}
                        participants_boards={this.state.participants_boards}
                        participants={this.state.participants}
                        participants_array={this.state.participants_array}

                    />




            </div>

        );

    }
}
$(function () {
    render(
        <Pairing/>
        , document.getElementById('pairing'));
})

