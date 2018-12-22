import React from 'react';
import {render} from 'react-dom';


class ApplyTeam extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            in_team : false,
            user_id : u,
            teams : null,
            status: _Waiting,
            appliers: {},
            request_sent : false,
            tournament : tournament,

        };
        this.chooseTeam = this.chooseTeam.bind(this);
        this.applyTeam = this.applyTeam.bind(this);
        this.declineTeam = this.declineTeam.bind(this);

    }

    componentDidMount(){
        const self = this;

        //что происходит при выборе команды в модальном окне
        $("body").on("click", ".apply-team", function () {
            self.applyTeam($(this).attr("data-id"), $(this).attr("data-name"));
            return false;
        });

    }



    chooseTeam(){
        const self = this;

        if (typeof u != "undefined" && u != null) {

            $("#applyTeamModal").modal("show");

            $.ajax({
                url: "/teams/api/get_teams/" + u,
                method: "get",
                dataType : "json",
                timeout : 3000,
                beforeSend : function () {
                    self.setState({
                        request_sent : true,
                    });
                },
                statusCode: {
                    404: function() {
                        alert( "page not found" );
                    }
                }
            }).done(function (data) {

                if (data.status === "ok") {
                    //if (data.teams.length > 0) {
                        self.state.teams = data.teams;
                    //}
                }

            }).fail(function ( jqXHR, textStatus ) {


            }).always(function () {
                self.setState({
                    request_sent : false
                });

            });

        } else {
            $("#applyTeamModal").modal("show");
            $("#applyTeamModal").find(".modal-body").html('<a href="/signup">Зарегистрируйтесь</a> или <a href="/login">войдите в аккаунт</a> для участия в турнире');
        }
    }

    declineTeam(event){
        const target = event.target;
        const team_id = $(target).attr("data-id");
        this.props.removeTeam(team_id);
    }

    applyTeam(team_id, team_name){
        const self = this;

        if (typeof u != "undefined" && u != null) {

            $("#applyTeamModal").modal("show");

            $.ajax({
                url: "/teams/api/apply_team",
                method: "post",
                timeout : 3000,
                beforeSend : function () {
                    self.setState({
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

                if (data.status === "ok") {

                    location.reload();

                    //if (data.teams.length > 0) {
                    //    self.state.teams = data.teams;
                    //}
                }

            }).fail(function ( jqXHR, textStatus ) {
                var error = "";
                for (var obj in jqXHR.responseJSON.errors) {
                    error = jqXHR.responseJSON.errors[obj].msg;
                }
                alert(error);

            }).always(function () {
                self.setState({
                    request_sent : false
                });

            });


        } else {
            $("#applyTeamModal").modal("show");
            $("#applyTeamModal").find(".modal-body").html('<a href="/signup">Зарегистрируйтесь</a> или <a href="/login">войдите в аккаунт</a> для участия в турнире');
        }
    }

    render() {

        return (
            <span>
                <span className="btn btn-block mt-0 btn-success hidden" id="apply-team-btn"  onClick={this.chooseTeam}>Заявить команду</span>
                <span className="btn btn-block mt-0 btn-danger  hidden"  onClick={this.declineTeam} data-id="" id="decline-team-btn">Убрать команду</span>
                <span className="btn btn-block mt-0 btn-danger  hidden"  onClick={this.leaveTeam} id="leave-team-btn" >Покинуть команду</span>
                <div className="modal" id="applyTeamModal" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="exampleModalLabel">Выбор команды</h5>
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">

                                {this.state.request_sent ? "Ожидайте..." : <div>
                                        {this.state.teams != null ?
                                            <div>
                                                {this.state.teams.length > 0 ?
                                                    <div className="list-group">

                                                        {

                                                            this.state.teams.map((item, index) => (
                                                                <a href="#" key={index} data-name={item.name} className="list-group-item list-group-item-action apply-team" data-id={item.id}>{item.name}</a>
                                                            ))

                                                        }
                                                    </div> : <div>Команды не найдены. <a href='/teams/create'>Создайте</a> команду для участия в турнире.</div>  }
                                            </div>
                                        : "Загрузка..." }
                                    </div>}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            </span>
        );

    }
}
export default ApplyTeam;


/*
$(function () {
    render(
        <ApplyTeam/>
        , document.getElementById('apply_team'));
});
*/





