import React from 'react';
import {render} from 'react-dom';
import ParticipantsListTable from "./ParticipantsListTable.jsx";
/*import Loading from "./../tasks/Loading.jsx";
import BreadCumbs from "./BreadCumbs.jsx";

import UserTable from "./UserTable.jsx";
import Tabs from "./Tabs.jsx";*/

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



class Timer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            timeleft: timeleft / 1000,

        };
        // this.save = this.save.bind(this);

        this.tick = this.tick.bind(this);
        this.setTimer = this.setTimer.bind(this);
    }




    componentDidMount(){
        var that = this;
        this.setTimer();
    }

    setTimer(){

        var self = this;
        this.interval = setInterval(function () {
            self.setState({
                timeleft : --self.state.timeleft
            }, function () {
                if (self.state.timeleft > 0) {
                    self.tick();
                } else {

                    self.setState({
                        timeleft: 0
                    });
                    clearInterval(self.interval);
                }
            });
        }, 1000);

    }



    tick(){
        console.log(this.state.timeleft);
        var minutes = Math.floor((this.state.timeleft) / 60);
        var secs = Math.floor((this.state.timeleft) % 60 % 60);

        this.setState({
            minutes_left : minutes,
            secs_left : secs,
        });

    }










    render() {

        return (
            <span>

                {this.state.timeleft > 0 ? <span>{this.state.minutes_left}:{this.state.secs_left}</span> : <span>0:00</span>}



            </span>



        );

    }
}

render(
    <Participants/>
    , document.getElementById('participants'));
render(
    <Timer/>
    , document.getElementById('timer'));
