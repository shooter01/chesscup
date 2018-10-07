import React from 'react';
import {render} from 'react-dom';


class GetInButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            is_in : is_in,
            user_id : u,
            status: _Waiting,
            request_sent : false,
            tournament : tournament,

        };
       // this.save = this.save.bind(this);

        this.addParticipant = this.addParticipant.bind(this);
        this.removeParticipant = this.removeParticipant.bind(this);
    }

    componentDidMount(){
        var that = this;
        console.log(this.state.is_in);
    }


    removeParticipant(event){
        const that = this;
        let target = event.target;


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
                user_id : this.state.user_id,
                tournament_id : this.state.tournament.id,
                user_type : "student",
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

    addParticipant(event){
        var that = this;
        if (event) event.preventDefault();
        //clearTimeout(that.state.timeout);
       /* that.setState({
            status : _RequestSent,
        });*/

        $.ajax({
            url: "/tournament/add_participant",
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
                //rating : rating,
                user_type : "student",
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
            /*that.setState({
                request_sent : false
            });*/
        });
    }




    render() {

        return (
            <span>

                {(this.state.is_in == false) ? <span className="btn btn-lg btn-success float-right"  onClick={this.addParticipant} >Участвовать</span> :
                <span onClick={this.removeParticipant} className="btn btn-lg btn-danger float-right" >Покинуть</span>}



                </span>



        );

    }
}

render(
    <GetInButton/>
    , document.getElementById('get_in'));
