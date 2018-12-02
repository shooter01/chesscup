import React from 'react';
import {render} from 'react-dom';


class Pairing extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pairs: pairs,
            tournament_id: tournament_id,
            current_tour: current_tour,
            teams_scores: teams_scores,
            tournaments_teams: tournaments_teams,
            team_tour_points: team_tour_points,
            user_pairs: [],
            team_boards: Array.apply(null, {length: parseInt(team_boards)}).map(Function.call, Number),
            user_id: [],
            owner: window.owner,
            type: type,
            save_url: (type != "null" && type == 20) ? "/tournament/save_teams_result" : "/tournament/save_result",
        }
        this.saveResult = this.saveResult.bind(this);

    }
    componentDidMount(){
        var that = this;


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


        // this.getUsers(200);
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

                    {this.state.pairs.map((item, index) => (
                        <div className="mt-5 mb-5" key={index}>

                            {typeof item.users != "undefined" ?


                            <table className="table table-hover table-bordered table-sm mb-0 ">
                                <thead className="thead-light">
                                    <tr>
                                        <td  scope="col" className="text-center pairing-team-thead" style={w5}> </td>
                                        <td  scope="col" className="text-center pairing-team-thead"  style={w30}>{item.team_1_id} {this.state.tournaments_teams[item.team_1_id].name} </td>
                                        <td  scope="col" className="text-center pairing-team-thead" style={w5}>{item.team_1_scores}</td>


                                        {(this.state.type == 20 && (tour_id != "null" && tour_id == current_tour && typeof this.state.owner !== "undefined")) ?

                                        <td  scope="col" className="text-center pairing-team-thead" style={w12}> <select name="" className="custom-select form-control-sm" id="" defaultValue={JSON.stringify({
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


                                        </select> <span className="badge"></span></td> :
                                            <td  scope="col" className="text-center pairing-team-thead" style={w12}> {this.state.team_tour_points[item.team_1_id] || 0} : {this.state.team_tour_points[item.team_2_id] || 0} </td>
                                        }


                                        <td  scope="col" className="text-center pairing-team-thead" style={w5}>{item.team_2_scores}</td>
                                        <td  scope="col" className="text-center pairing-team-thead" style={w30}>{item.team_1_id} {(this.state.tournaments_teams[item.team_2_id] ? this.state.tournaments_teams[item.team_2_id].name : null)} </td>
                                    </tr>

                                </thead>


                                <tbody>
                                {item.users[0].map((pair, index)=>(
                                        <tr key={index}>
                                            <td className="text-center">{pair.board}</td>
                                            <td>
                                                {pair.p1_name}
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
                                                    : <div>{pair.p1_won} - {pair.p2_won}</div>}
                                            </td>
                                            <td className="text-center">{pair.p2_scores}</td>
                                            <td>{pair.p2_name}
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
            </div>


        );

    }
}

render(
    <Pairing/>
    , document.getElementById('pairing'));
