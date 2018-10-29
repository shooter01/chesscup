import React from 'react';
import {render} from 'react-dom';
import UserResults from "./table.jsx";

import Link from "./Link.jsx";
import ResultsTable from "./ResultsTable.jsx";
import Timer from "./Timer.jsx";
import Tours from "./Tours.jsx";






/*import Loading from "./../tasks/Loading.jsx";
import BreadCumbs from "./BreadCumbs.jsx";

import UserTable from "./UserTable.jsx";
*/


class Pairing extends React.Component {

    constructor(props) {

        super(props);

        this._isMounted = false;


        this.state = {
            pairs: (typeof pairs != "undefined") ? pairs : null,
            participants: participants,
            tournament: tournament,
            participants_scores: [],
            scores_object: (typeof scores_object != "undefined") ? scores_object : null,
            tournament_id: tournament.id,
            current_tour: tournament.current_tour,
            user_pairs: [],
            tour_id : (typeof tour_id != "undefined") ? tour_id : tournament.current_tour,
            user_id: [],
            owner: window.owner,
        }
        this.saveResult = this.saveResult.bind(this);
        this.getActualData = this.getActualData.bind(this);
    }
    componentDidMount(){
        var self = this;
        this._isMounted = true;

        $("#next_tour").on("click", function () {
            $.ajax({
                url: "/tournament/make_draw",
                method: "post",
                timeout : 3000,
                beforeSend : function () {
                    self.setState({
                        request_sent : true,
                    });
                },
                data : {
                    //result : value,
                    tournament_id : self.state.tournament_id
                },
                statusCode: {
                    404: function() {
                        alert( "page not found" );
                    }
                }
            }).done(function (data) {
                if (data.status === "ok") {
                    if (data.updated_tour == null){
                        //location.href = "/tournament/" + self.state.tournament_id + "/final";
                    } else {
                       // location.href = "/tournament/" + self.state.tournament_id + "/tour/" + data.updated_tour;
                    }
                } else {
                    alert(data.msg);
                }
            }).fail(function ( jqXHR, textStatus ) {
                alert( "Request failed: " + textStatus );
            }).always(function () {
                self.setState({
                    request_sent : false
                });
            });
        });

        $(".participant").on("click", function (event) {
            event.preventDefault();
            var user_id = $(this).attr("data-id");
            self.setState({
                user_id : user_id
            });
            $.ajax({
                url: "/tournament/get_pairs",
                method: "post",
                timeout : 3000,
                beforeSend : function () {
                    self.setState({
                        request_sent : true,
                    });
                },
                data : {
                    //result : value,
                    tournament_id : self.state.tournament_id,
                    user_id : user_id
                },
                statusCode: {
                    404: function() {
                        alert( "page not found" );
                    }
                }
            }).done(function (data) {
                if (data.status === "ok") {
                     $("#user_results_modal").modal("show");
                    self.setState({
                        user_pairs : data.pairing
                    });
                } else {
                    alert(data.msg);
                }
            }).fail(function ( jqXHR, textStatus ) {
                alert( "Request failed: " + textStatus );
            }).always(function () {
                self.setState({
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
                        self.setState({
                            request_sent : true,
                        });
                    },
                    data : {
                        //result : value,
                        tournament_id : self.state.tournament_id
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

                    var error = "";
                    for (var obj in jqXHR.responseJSON.errors) {
                        error = jqXHR.responseJSON.errors[obj].msg;
                    }

                    alert(error);
                    //alert( "Request failed: " + textStatus );
                }).always(function () {
                    self.setState({
                        request_sent : false
                    });
                });
            }
        });


        $("#delete_tournament").on("click", function (event) {
            event.preventDefault();
            if (confirm("Вы уверены? Все данные будут удалены.")) {
                $.ajax({
                    url: "/tournament/delete_tournament",
                    method: "post",
                    timeout : 3000,
                    beforeSend : function () {
                        self.setState({
                            request_sent : true,
                        });
                    },
                    data : {
                        //result : value,
                        tournament_id : self.state.tournament_id
                    },
                    statusCode: {
                        404: function() {
                            alert( "page not found" );
                        }
                    }
                }).done(function (data) {
                    if (data.status === "ok") {
                        location.href = "/";
                    } else {
                        alert(data.msg);
                    }
                }).fail(function ( jqXHR, textStatus ) {
                    var error = "";
                    for (var obj in jqXHR.responseJSON.errors) {
                        error = jqXHR.responseJSON.errors[obj].msg;
                    }

                    alert(error);
                    //alert( "Request failed: " + textStatus );
                }).always(function () {
                    self.setState({
                        request_sent : false
                    });
                });
            }
        });

        $("#delete_last").on("click", function (event) {
            event.preventDefault();
            if (confirm("Are you sure?")) {
                $.ajax({
                    url: "/tournament/undo_last_tour",
                    method: "post",
                    timeout : 3000,
                    beforeSend : function () {
                        self.setState({
                            request_sent : true,
                        });
                    },
                    data : {
                        //result : value,
                        tournament_id : self.state.tournament_id
                    },
                    statusCode: {
                        404: function() {
                            alert( "page not found" );
                        }
                    }
                }).done(function (data) {
                    if (data.status === "ok") {
                        // console.log(parseInt(self.state.current_tour));
                        location.href = "/tournament/" + self.state.tournament_id + "/tour/" + (parseInt(self.state.current_tour) - 1);
                    } else {
                        alert(data.msg);
                    }
                }).fail(function ( jqXHR, textStatus ) {
                    var error = "";
                    for (var obj in jqXHR.responseJSON.errors) {
                        error = jqXHR.responseJSON.errors[obj].msg;
                    }
                    alert(error);
                    //alert( "Request failed: " + textStatus );
                }).always(function () {
                    self.setState({
                        request_sent : false
                    });
                });
            }
        });



        $(".removeParticipant").on("click",function (event) {
            var user_id = $(this).data("id");
            if (user_id && confirm(_AreYouSure)) {
                $.ajax({
                    url: "/tournament/delete_participant",
                    method: "post",
                    timeout : 3000,
                    beforeSend : function () {
                        self.setState({
                            request_sent : true,
                        });
                    },
                    data : {
                        //result : value,
                        tournament_id : self.state.tournament_id,
                        user_id : user_id,
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
                    self.setState({
                        request_sent : false
                    });
                });
            }

        });


        if (this.state.pairs == null || this.state.pairs.length === 0) {
            this.getActualData();
        }

        if (this.state.tournament.is_online == 1 && typeof tour_choosed === "undefined"){
           //this.socket = io(window.location.origin, {query: 't1=' + this.state.tournament_id});


            window.socket.on('tournament_event', function (data) {
                data = JSON.parse(data);
                // console.log(data);
                self.getActualData();
            });
        }



    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    getActualData(){
        var self = this;


        $.getJSON('/tournament/' + this.state.tournament_id + '/get_info').done(function (data) {
            if (self._isMounted) {

                self.setState({
                    pairs: JSON.parse(data.pairing) || [],
                    tournament: data.tournament || {},
                    participants: data.participants || [],
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
            url: "/tournament/save_result",
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
                $badge.removeClass("hidden").addClass("badge-success").html(_Saved);
            } else {
                $badge.removeClass("hidden").addClass("badge-danger").html(_SaveError);
            }

            var state = that.state.pairs;

            for (var i = 0; i < state.length; i++) {
                var obj = state[i];
                if (obj.p1_id === val.p1_id && obj.p2_id === val.p2_id) {
                    obj.rating_change_p1 = data.rating_change_p1;
                    obj.rating_change_p2 = data.rating_change_p2;
                }
            }

            that.setState({
                pairs: state
            });

            setTimeout(function () {
                $badge.addClass("hidden").removeClass("badge-success badge-error").html("");
            }, 1000);
            /*if (data.users) {
                if (data.users) {
                    that.setState({
                        users : data.users
                    })
                }
            }*/
        }).fail(function ( jqXHR, textStatus ) {
            alert( "Request failed: " + textStatus );
        }).always(function () {
            that.setState({
                request_sent : false
            });
        });
        //console.log(event.target.value);
    }

    renderLink(item) {
        return "/" + this.tournament.id + "/game/" + item.id;
    }

    render() {

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
            <div className="position-relative mt-2">

                <div>
                    {(this.state.tournament.is_closed == 1) ? <div className="badge badge-danger">Турнир завершен</div> : null}
                    {(this.state.tournament.is_closed == 0 && this.state.tournament.is_active == 1) ? <div>
                            <div className="badge badge-success">Турнир активен</div>
                            <div><div className="badge badge-info">Текущий тур: {this.state.tournament.current_tour}</div></div>
                        </div> : null}
                    {(!this.state.tournament.is_closed && !this.state.tournament.is_active) ? <div className="badge badge-secondary">Турнир стартует через : <Timer timeleft={timeleft} /></div> : null}
                </div>

                { (this.state.pairs != null && this.state.pairs.length) ?
                <table className="table table-hover table-bordered table-sm mt-2">
                    <thead className="thead-dark">
                    <tr>
                        <th  scope="col" className="text-center" style={w5}><span className="d-none d-sm-block">{_Board}</span></th>
                        <th  scope="col" className="text-center hidden-lg-down"  style={w30}>{_Name}</th>
                        <th  scope="col" className="text-center" style={w5}><span className="d-none d-sm-block">{_Points}</span></th>
                        <th  scope="col" className="text-center" style={w12}>
                            <span className="d-none d-sm-block">{_Result}</span>
                            <span className="d-sm-none">{_Result}</span>
                        </th>
                        <th  scope="col" className="text-center hidden-lg-down" style={w5}><span className="d-none d-sm-block">{_Points}</span></th>
                        <th  scope="col" className="text-center" style={w30}>{_Name}</th>
                    </tr>
                    </thead>

                    <tbody>
                    {this.state.pairs.map((item, index) => (
                        <tr key={index}>
                            <td className="text-center">{index+1}</td>
                            <td data-id={item.p1_id} className="participant">{item.p1_name} <span className="badge badge-dark">{}{item.is_over ? item.p1_rating_for_history : item.p1_rating}</span> {(item.rating_change_p1 > 0) ? <span className="badge badge-success">+{item.rating_change_p1}</span> : <span className="badge badge-danger">{item.rating_change_p1}</span>} </td>
                            <td className="text-center ">{item.p1_scores}</td>
                            <td className="text-center">
                                <Link tournament_id={this.state.tournament_id} p1_id={item.p1_id} p2_id={item.p2_id} id={item.id}/>

                                {(typeof tour_id != "undefined" && tour_id != "null" && tour_id == current_tour && typeof this.state.owner !== "undefined") ?
                                <select name="" className="custom-select form-control-sm" id="" defaultValue={JSON.stringify({
                                    p1_id:item.p1_id,
                                    p2_id:item.p2_id,
                                    p1_won:item.p1_won,
                                    p2_won:item.p2_won,
                                    game_id : item.id
                                })} {...(!item.p2_id || !item.p1_id) ? disabled : ""} onChange={this.saveResult}>
                                    <option value={JSON.stringify({
                                        p1_id:item.p1_id,
                                        p2_id:item.p2_id,
                                        p1_won:0,
                                        p2_won:0,
                                        game_id : item.id
                                    })}> </option>
                                    <option value={JSON.stringify({
                                        p1_id:item.p1_id,
                                        p2_id:item.p2_id,
                                        p1_won:1,
                                        p2_won:0,
                                        game_id : item.id
                                    })}>1:0</option>
                                    <option value={JSON.stringify({
                                        p1_id:item.p1_id,
                                        p2_id:item.p2_id,
                                        p1_won:0,
                                        p2_won:1,
                                        game_id : item.id
                                    })}>0:1</option>
                                    <option value={JSON.stringify({
                                        p1_id:item.p1_id,
                                        p2_id:item.p2_id,
                                        p1_won:0.5,
                                        p2_won:0.5,
                                        game_id : item.id
                                    })}>½:½</option>
                                </select>
                                : <div>{item.p1_won} - {item.p2_won}</div>}

                                <span className="badge"></span></td>
                            <td className="text-center ">{item.p2_scores}</td>
                            <td data-id={item.p2_id} className="participant">{item.p2_name} <span className="badge badge-dark">{(item.is_over) ? item.p2_rating_for_history : item.p2_rating}</span> {(item.rating_change_p2 > 0) ? <span className="badge badge-success">+{item.rating_change_p2}</span> : <span className="badge badge-danger">{item.rating_change_p2}</span>} </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                    : null}


                {(this.state.tournament.is_online == 1 && typeof (tour_choosed) === "undefined") ? <div>

                        <Tours tournament={this.state.tournament} />
                        {this.state.tournament.is_closed ? <h5 className="mt-2 ">Итоговое положение</h5> : <h5 className="mt-2 ">Текущее положение</h5>}
                        <ResultsTable participants={this.state.participants} tournament={this.state.tournament}/>

                    </div> : null}





                <div className="modal" id="user_results_modal" tabIndex="-1" role="dialog"  aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg" role="document">
                        <div className="modal-content">

                            <div className="modal-header">
                                <h5 className="modal-title" id="exampleModalLabel"></h5>
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>

                            <div className="modal-body" id="user_results">
                                <UserResults user_id={this.state.user_id} user_pairs={this.state.user_pairs}/>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-dismiss="modal">Закрыть</button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

        );

    }
}

render(
    <Pairing/>
    , document.getElementById('pairing'));



