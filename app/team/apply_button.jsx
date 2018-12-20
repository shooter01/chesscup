import React from 'react';
import {render} from 'react-dom';
import ChooseTeam from "./choose_team.jsx";


class ApplyButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            in_team : false,
            user_id : u,
            status: _Waiting,
            appliers: {},
            teams: [],
            request_sent : false,
            tournament : tournament,

        };
       // this.save = this.save.bind(this);

        this.applyToTeamInTournament = this.applyToTeamInTournament.bind(this);
        this.discardToTeamInTournament = this.discardToTeamInTournament.bind(this);
        this.chooseTeam = this.chooseTeam.bind(this);
        this.isInTeam = this.isInTeam.bind(this);
        this.isTeamOwner = this.isTeamOwner.bind(this);
        this.setApplies = this.setApplies.bind(this);
        this.getApplies = this.getApplies.bind(this);
        this.showMyApplies = this.showMyApplies.bind(this);
    }

    componentDidMount(){
        const self = this;


        //что происходит при выборе команды в модальном окне
        $("body").on("click", ".choose-team", function () {
            self.applyToTeamInTournament($(this).attr("data-id"), $(this).attr("data-name"));
            return false;
        });

        var in_team = self.isInTeam();
        var team_owners = self.isTeamOwner();
        var is_team_owner = !!team_owners[u];

        //если владелец команды, то даем понять это родительскому классу, информация нужна для фиксации id команды
        //при одобрении игроков
        if (is_team_owner) {
            this.props.setOnlineTeamOwner(team_owners[u]);
        }

        this.setState({
            in_team : in_team,
            is_team_owner : is_team_owner,
        });

        if (in_team) {
            this.props.setCurrentTeam(participants[u].team_id);
        } else if (is_team_owner) {
            this.props.setCurrentTeam(team_owners[u]);
        }

        self.getApplies();

        $(document).on("get_apply", function () {
            self.getApplies();
        });

        //если пользователь в числе участников
        /*if (in_team) {
            self.getApplies(participants[u].team_id);
        } else if (typeof u != "undefined" && u != "null") {*/
            /*$.ajax({
                url: "/teams/api/get_ttapplies/" + this.state.tournament.id,
                method: "get",
                dataType : "json",
                timeout : 3000,

                statusCode: {
                    404: function() {
                        alert( "page not found" );
                    }
                }
            }).done(function (data) {

                if (data.status === "ok") {
                    //обнаружены заявки данного персонажа
                    if (data.ttapplies.length > 0) {

                        self.setApplies(data.ttapplies);

                        //self.getApplies(data.ttapplies[0].team_id);
                    }
                }

            }).fail(function ( jqXHR, textStatus ) {}).always(function () { });*/
      //  }


    }


    getApplies(){
        const self = this;

        $.ajax({
            url: "/teams/api/get_ttapplies/" + this.state.tournament.id,
            method: "get",
            dataType : "json",
            timeout : 3000,

            statusCode: {
                404: function() {
                    alert( "page not found" );
                }
            }
        }).done(function (data) {

            if (data.status === "ok") {
                //обнаружены заявки данного персонажа
                //if (data.ttapplies.length > 0) {
                    self.setApplies(data.ttapplies);
               // }
            }

        }).fail(function ( jqXHR, textStatus ) {}).always(function () { });




        /*$.ajax({
            url: "/teams/api/get_ttapplies/" + this.state.tournament.id + "/" + team_id,
            method: "get",
            dataType : "json",
            timeout : 3000,

            statusCode: {
                404: function() {
                    alert( "page not found" );
                }
            }
        }).done(function (data) {

            if (data.status === "ok") {
                if (data.ttapplies.length > 0) {
                    self.setApplies(data.ttapplies);
                }
            }

        }).fail(function ( jqXHR, textStatus ) {}).always(function () { });*/
    }


    get(applies){
        const self = this;
        this.props.setApplies(applies);
    }

    setApplies(applies){
        const self = this;
        this.props.setApplies(applies);
    }

    chooseTeam(){
        const self = this;

        if (typeof u != "undefined" && u != null) {

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

        } else {
            $("#chooseTeamModal").modal("show");
            $("#chooseTeamModal").find(".modal-body").html('<a href="/signup">Зарегистрируйтесь</a> или <a href="/login">войдите в аккаунт</a> для участия в турнире');
        }


    }

    //узнаем в команде ли человек
    isInTeam(){
        const self = this;

        //есть ли пользователь в числе участников
        return !!(participants[u]);

    }
    //узнаем создатель ли
    isTeamOwner(){
        const self = this;
        let appliers = {}
        for (let obj in tournaments_teams) {
            appliers[tournaments_teams[obj].applier_id] = obj;
        }
        return appliers;

    }
    //показать заявки пользователя
    showMyApplies(){
        const self = this;
        if (typeof u != "undefined" && u != null) {
            this.props.showMyApplies(u);
        } else {
            alert("Вы не авторизованы. Войдите сначала в свой аккаунт.");
        }


    }


    applyToTeamInTournament(team_id, team_name){
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
                team_id : team_id,
                team_name : team_name,
            },
            statusCode: {
                404: function() {
                    alert( "page not found" );
                }
            }
        }).done(function (data) {
            $("#chooseTeamModal").modal("hide");

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
            var error = "";
            for (var obj in jqXHR.responseJSON.errors) {
                error = jqXHR.responseJSON.errors[obj].msg;
            }
            alert(error);
            /*that.setState({
                status : error,
                alert_status: "danger"
            });*/

            /*that.state.timeout = setTimeout(function () {
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
            <div>

                {(this.state.is_team_owner == false && !this.state.in_team) ?
                        <div>
                            <span className="btn btn-block btn-sm btn-success mb-2"  onClick={this.chooseTeam} >Подать заявку</span>
                            <span className="btn btn-block btn-sm btn-info mb-2"  onClick={this.showMyApplies} >Мои заявки</span>
                        </div>
                    : null
                }

                <ChooseTeam teams={this.state.teams}/>

            </div>



        );

    }
}


export default ApplyButton;





