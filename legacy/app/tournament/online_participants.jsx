import React from 'react';
import {render} from 'react-dom';
import ParticipantsListTable from "./ParticipantsListTable.jsx";
/*import Loading from "./../tasks/Loading.jsx";
import BreadCumbs from "./BreadCumbs.jsx";

import UserTable from "./UserTable.jsx";
*/
import Timer from "./Timer.jsx";

class Participants extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            participants: participants,
            tournament: tournament,
            timeleft: timeleft / 1000,

        };
       // this.save = this.save.bind(this);

        this.addParticipant = this.addParticipant.bind(this);
        this.removeParticipant = this.removeParticipant.bind(this);
    }


    componentDidMount(){
        var that = this;
    }

    removeParticipant(event){
        const that = this;
        let target = event.target;
        const id = $(target).attr("data-id");
        clearTimeout(that.state.timeout);
        that.setState({
            status : "Отправлен запрос",
        });

        $.ajax({
            url: "/tournament/remove_participant",
            method: "post",
            timeout : 3000,
            beforeSend : function () {
                that.setState({
                    request_sent : true,
                });
            },
            data : {
                user_id : id,
                tournament_id : tournament_id,
                user_type : that.state.current_tab,
                tournament_type : that.state.tournament.type
            },
            statusCode: {
                404: function() {
                    alert( "page not found" );
                }
            }
        }).done(function (data) {

            if (data.participants || data.teams) {
                that.setState({
                    participants : data.participants || that.state.participants,
                    teams : data.teams || that.state.teams,
                    status : "Участник удален",
                    alert_status: "success"
                });
                that.state.timeout = setTimeout(function () {
                    that.setDefaultState();
                }, 2000);
            }

        }).fail(function ( jqXHR, textStatus ) {
            // alert( "Request failed: " + textStatus );
            var error = "";
            for (var obj in jqXHR.responseJSON.errors) {
                error = jqXHR.responseJSON.errors[obj].msg;
            }

            that.setState({
                status : error,
                alert_status: "danger"
            });

            that.state.timeout = setTimeout(function () {
                that.setDefaultState();
            }, 2000);



        }).always(function () {
                that.setState({
                    request_sent : false
                });

        });
    }

    addParticipant(event, user){
        var that = this;
        if (event) event.preventDefault();
        var id, target, rating;
        if (typeof user != "undefined" && typeof user.user_id != "undefined") {
            id = user.user_id;
            rating = user.tournaments_rating;
        } else {
            target = event.target;
            id = $(target).attr("data-id");
            rating = $(target).attr("data-rating");
        }

        rating = parseInt(rating);
        rating = (isNaN(rating)) ? 1200 : rating;

        clearTimeout(that.state.timeout);
        that.setState({
            status : _RequestSent,
        });

        $.ajax({
            url: "/tournament/add_participant",
            method: "post",
            timeout : 3000,
            beforeSend : function () {
                that.setState({
                    request_sent : true,
                });
            },
            data : {
                user_id : id,
                tournament_id : tournament_id,
                rating : rating,
                user_type : that.state.current_tab,
                team_id : that.state.current_team,
                tournament_type : that.state.tournament.type
            },
            statusCode: {
                404: function() {
                    alert( "page not found" );
                }
            }
        }).done(function (data) {

            if (data.participants || data.teams) {
                that.setState({
                    participants : data.participants || that.state.participants,
                    teams : data.teams || that.state.teams,
                    status : _ParticipantAdded,
                    alert_status: "success"
                });
                that.state.timeout = setTimeout(function () {
                    that.setDefaultState();
                }, 2000);
            }

        }).fail(function ( jqXHR, textStatus ) {
           // alert( "Request failed: " + textStatus );
            var error = "";
            for (var obj in jqXHR.responseJSON.errors) {
                error = jqXHR.responseJSON.errors[obj].msg;
            }

            that.setState({
                status : error,
                alert_status: "danger"
            });

            that.state.timeout = setTimeout(function () {
                that.setDefaultState();
            }, 2000);



        }).always(function () {
            that.setState({
                request_sent : false
            });
        });
    }


    render() {

        return (
            <div>
                <ParticipantsListTable  removeParticipant={this.removeParticipant} participants={this.state.participants} />
            </div>



        );

    }
}




render(
    <Participants/>
    , document.getElementById('participants'));
render(
    <Timer/>
    , document.getElementById('timer'));
