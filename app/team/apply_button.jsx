import React from 'react';
import {render} from 'react-dom';
import ChooseTeam from "./choose_team.jsx";


class ApplyButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            is_in : is_in,
            user_id : u,
            status: _Waiting,
            teams: [],
            request_sent : false,
            tournament : tournament,

        };
       // this.save = this.save.bind(this);

        this.applyToTeamInTournament = this.applyToTeamInTournament.bind(this);
        this.discardToTeamInTournament = this.discardToTeamInTournament.bind(this);
        this.chooseTeam = this.chooseTeam.bind(this);
    }

    componentDidMount(){
        const self = this;


        $("body").on("click", ".choose-team", function () {
            console.log(this);
            const team_id = $(this).attr("data-id");
            self.applyToTeamInTournament(team_id);
            return false;
        });

        // console.log(this.state.is_in);
    }

    chooseTeam(){
        const self = this;
        $("#chooseTeamModal").modal("show");

        $.ajax({
            url: "/teams/chooseTeam",
            method: "post",
            timeout : 3000,
            beforeSend : function () {
                self.setState({
                    request_sent : true,
                });
            },
            data : {
                tournament_id : this.state.tournament.id,
            },
            statusCode: {
                404: function() {
                    alert( "page not found" );
                }
            }
        }).done(function (data) {

            if (data.status === "ok") {
                if (data.teams.length > 0) {
                    self.state.teams = data.teams;
                }
            }

        }).fail(function ( jqXHR, textStatus ) {


        }).always(function () {
            self.setState({
                request_sent : false
            });

        });

    }


    applyToTeamInTournament(team_id){
        const that = this;

        $.ajax({
            url: "/teams/applyToTeamInTournament",
            method: "post",
            timeout : 3000,
            beforeSend : function () {
                that.setState({
                    request_sent : true,
                });
            },
            data : {
                tournament_id : this.state.tournament.id,
                team_id : team_id
            },
            statusCode: {
                404: function() {
                    alert( "page not found" );
                }
            }
        }).done(function (data) {

            //location.reload();

            /*if (data.participants || data.teams) {
                that.setState({
                    participants : data.participants || that.state.participants,
                    teams : data.teams || that.state.teams,
                    status : "Участник удален",
                    alert_status: "success"
                });
                that.state.timeout = setTimeout(function () {
                    that.setDefaultState();
                }, 2000);
            }*/

        }).fail(function ( jqXHR, textStatus ) {
            // alert( "Request failed: " + textStatus );
            /*var error = "";
            for (var obj in jqXHR.responseJSON.errors) {
                error = jqXHR.responseJSON.errors[obj].msg;
            }

            that.setState({
                status : error,
                alert_status: "danger"
            });

            that.state.timeout = setTimeout(function () {
                that.setDefaultState();
            }, 2000);*/



        }).always(function () {
                that.setState({
                    request_sent : false
                });

        });
    }

    discardToTeamInTournament(event){
        var that = this;
        if (event) event.preventDefault();
        //clearTimeout(that.state.timeout);
       /* that.setState({
            status : _RequestSent,
        });*/

        $.ajax({
            url: "/tournament/applyToTeamInTournament",
            method: "post",
            timeout : 3000,
            beforeSend : function () {
               /* that.setState({
                    request_sent : true,
                });*/
            },
            data : {
                user_id : this.state.user_id,
                tournament_id : this.state.tournament.id,
                tournament_type : this.state.tournament.type
            },
            statusCode: {
                404: function() {
                    alert( "page not found" );
                }
            }
        }).done(function (data) {

            location.reload();

            /*if (data.participants || data.teams) {
                that.setState({
                    participants : data.participants || that.state.participants,
                    teams : data.teams || that.state.teams,
                    status : _ParticipantAdded,
                    alert_status: "success"
                });
                that.state.timeout = setTimeout(function () {
                    that.setDefaultState();
                }, 2000);
            }*/

        }).fail(function ( jqXHR, textStatus ) {
           // alert( "Request failed: " + textStatus );
            var error = "";
            for (var obj in jqXHR.responseJSON.errors) {
                error = jqXHR.responseJSON.errors[obj].msg;
            }
            alert(error);
           /* that.setState({
                status : error,
                alert_status: "danger"
            });

            that.state.timeout = setTimeout(function () {
                that.setDefaultState();
            }, 2000);*/



        }).always(function () {
            /*that.setState({
                request_sent : false
            });*/
        });
    }




    render() {

        return (
            <span>

                {(this.state.is_in == false) ? <span className="btn btn-lg btn-success float-right"  onClick={this.chooseTeam} >Подать заявку</span> :
                    <span onClick={this.removeParticipant} className="btn btn-lg btn-danger float-right" >Отозвать заявку</span>}
                <ChooseTeam teams={this.state.teams}/>

            </span>



        );

    }
}
$(function () {
    render(
        <ApplyButton/>
        , document.getElementById('get_in_team'));
})




