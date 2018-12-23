import React from 'react';
import {render} from 'react-dom';
import ParticipantsListTable from "./ParticipantsListTable.jsx";
import ApplyButton from "../team/apply_button.jsx";
import WS from "../ws";

class TeamsList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            teams: this.props.teams,
            tournament: this.props.tournament,
            current_team: null, //текущая выбранная команда
            apliers: [], //все заявки во все команды
            team_apliers: [],//заявки в конкретную команду
            in_team: null, //в команде ли пользователь
            is_team_owner: null, //владелец ли команды
        };
        this.selectTeam = this.selectTeam.bind(this);
        this.removeTeam = this.removeTeam.bind(this);
        this.removeParticipant = this.removeParticipant.bind(this);
        this.changeOrder = this.changeOrder.bind(this);
        this.setApplies = this.setApplies.bind(this);
        this.approvePlayer = this.approvePlayer.bind(this);
        this.declinePlayer = this.declinePlayer.bind(this);
        this.setOnlineTeamOwner = this.setOnlineTeamOwner.bind(this);
        this.filterApplies = this.filterApplies.bind(this);
        this.setCurrentTeam = this.setCurrentTeam.bind(this);
        this.showMyApplies = this.showMyApplies.bind(this);
        this.handleWSData = this.handleWSData.bind(this);
        this.getActualData = this.getActualData.bind(this);
        this.updateTournament = this.updateTournament.bind(this);

    }
    componentDidMount(){
        const self = this;


     /*   $("body").on("click", ".approve_player", function () {
            const user_id = $(this).attr("data-id");
            self.approvePlayer(user_id);
        });
        $("body").on("click", ".decline_player", function () {
            const user_id = $(this).attr("data-user-id");
            const team_id = $(this).attr("data-team-id");
            self.declinePlayer(user_id, team_id);
        });
*/


        self.socket = new WS(function (data) {
            self.handleWSData(data);
        }, "localhost:7000");




    }


    handleWSData(data){

        if (data.action === "get_apply") {
            $(document).trigger("get_apply");
        } else if (data.action === "participant") {
            //$(document).trigger("participant");

            this.setState({
                teams : data.teams
            });

        } else if (data.action === "tournament_event") {
            $(document).trigger("tournament_event");

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
                    pairs: JSON.parse(data.pairing) || [],
                    tournament: data.tournament || {},
                    participants: data.participants.length ? data.participants : self.state.participants,
                });
            }
        });
    }
    approvePlayer(event){
        const self = this;

        var $target = $(event.target);
        var id = $target.data("id");

        if (id) {
            this.props.addParticipant(event);
        }
    }
    declinePlayer(event){
        const self = this;

        var $target = $(event.target);
        //var apply_id = $target.data("apply_id");
        console.log(event.target);
       // if (team_id && user_id) {
            $.ajax({
                url: "/teams/api/decline_player",
                method: "post",
                timeout : 3000,
                beforeSend : function () {
                    self.setState({
                        request_sent : true,
                    });
                },
                data : {
                    tournament_id : this.state.tournament.id,
                    user_id : $target.attr("data-user-id"),
                    team_id : $target.attr("data-team-id"),
                },
                statusCode: {
                    404: function() {
                        alert( "page not found" );
                    }
                }
            }).done(function (data) {



            }).fail(function ( jqXHR, textStatus ) {


            }).always(function () {
                self.setState({
                    request_sent : false
                });

            });
       // }
    }
    setOnlineTeamOwner(team_id){
        const self = this;

        //если владелец команды в онайлн турнире, то даем понять это родительскому классу, информация нужна для фиксации id команды
        //при одобрении игроков
        if (team_id) {
            this.props.setOnlineTeamOwner(team_id);
            this.setState({
                is_team_owner : true
            });
        }
    }
    changeOrder(event){
        const self = this;
        this.props.changeOrder(event);
    }
    setCurrentTeam(team_id){
        const self = this;
        this.setState({
            current_team : team_id
        });
    }
    //устанавливает все заявки
    setApplies(applies){
        const self = this;
        this.setState({
            apliers : applies
        },function () {
            //если команда выбрана
            if (this.state.current_team) {
                self.filterApplies(this.state.current_team);
                //если команда не выбрана, то человек не в команде и показываем заявки
            } else if (typeof u != "undefined" && u != null) {
                this.showMyApplies(u);
            }
        });
    }
    //устанавливает заявки текущей выбранной команды
    setTeamApplies(applies){
        const self = this;
        this.setState({
            team_apliers : applies
        });
    }
    //показать заявки пользователя
    showMyApplies(user_id){
        const self = this;
        let user_applies = [];

        for (let i = 0; i < this.state.apliers.length; i++) {
            let obj = this.state.apliers[i];
            if (obj.user_id == user_id) {
                user_applies.push(obj);
            }
        }


        this.setState({
            team_apliers : user_applies,
            current_team : null
        });
    }

    selectTeam(event){
        var that = this;

        var $target = $(event.target);
        var id = $target.data("id");

        if (id) {
          //  $(".team-title").removeClass("bg-primary text-white").addClass("bg-light text-dark");
            this.props.setTeam(id);
            that.filterApplies(id);
            that.setCurrentTeam(id);
         //   $target.addClass("bg-primary text-white").removeClass("bg-light text-dark");
         //   $target.find("[type='radio']").prop("checked", true);
        } else {
          //  $target.parent().click();
        }
    }


    filterApplies(team_id){
        const self = this;
        let apliers = [];
        for (let i = 0; i < this.state.apliers.length; i++) {
            let obj = this.state.apliers[i];
            if (obj.team_id == team_id) {
                apliers.push(obj);
            }
        }
        self.setTeamApplies(apliers);
    }

    removeParticipant(event){
        event.preventDefault();
        var that = this;

        var $target = $(event.target);
        var id = $target.data("id");

        if (id) {
            this.props.removeParticipant(event);
        }

    }
    removeTeam(event){
        var that = this;
        event.preventDefault();
        event.stopPropagation();

        if (confirm("Вы уверены?")){
            var $target = $(event.target);
            var id = $target.data("id");
            this.props.removeTeam(id);
        }
    }

    componentWillReceiveProps(nextProps){
      //  if(nextProps.value !== this.props.pairs){
            this.setState({
                teams:nextProps.teams,
            });
       // }
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

        var selected = {
            style : "participant"
        };

        var selectedTeam = {
            style : ""
        };
        var cname = "customRadio";

        return (
            <div className={this.state.tournament.is_online === 1 ? "position-relative mt-0 row" : "position-relative mt-5 row"}>


                <div className={this.state.tournament.is_online === 1 ? "col-sm-8" : "col-sm-12"}>
                {Object.keys(this.state.teams).map((item, index) => (
                    <div className="mt-1" key={index}>
                        <div className={(this.props.current_team != null && (this.props.current_team == this.state.teams[item].team_id) ? "p-1 mb-2 d-flex justify-content-between team-title participant selected bg-primary text-white" : "p-1 mb-2 bg-light text-dark d-flex justify-content-between team-title participant ")} data-id={item} onClick={this.selectTeam}>
                            <div>
                               <b>{this.state.teams[item].team_id} {this.state.teams[item].name} </b>
                            </div>
                            {this.state.tournament.is_online !== 1 ?
                            <span>
                                {(this.props.current_team == this.state.teams[item].team_id ? null : <span data-id={item} onClick={this.selectTeam} className="select-team-btn mr-3">{_ChooseTeam}</span>)}

                                <a href="" className="fa fa-trash trash-team text-dark mr-1 mt-1"  data-id={item} title="Удаление команды" onClick={this.removeTeam} ></a>
                            </span>
                                : <span data-id={item} onClick={this.selectTeam} className="select-team-btn mr-3">Показать заявки</span> }
                        </div>

                        {(typeof this.state.teams[item].users !== "undefined" && this.state.teams[item].users.length > 0) ?
                            <table className={(typeof u !== "undefined" && this.state.teams[item].applier_id == u && this.state.tournament.is_online === 1) ? "table table-hover borderless table-sm table-success" :
                                "table table-hover borderless table-sm"} key={index}>
                                <thead>
                                <tr>
                                    <th>Доска</th>
                                    <th>Имя</th>
                                    <th></th>
                                    <th></th>
                                </tr>
                                </thead>
                                <tbody>
                                {this.state.teams[item].users.map((user, index1) => (
                                    <tr key={index1} className={(typeof u != "undefined" && u != "null" && user.user_id == u) ? "bg-success" : null} data-id={this.state.teams[item].team_id} data-user-id={user.user_id}>
                                        <th scope="row">{index1 + 1}</th>
                                        <td>{user.name} {user.user_id} Доска : {user.team_board}</td>
                                        <td>
                                            {typeof u !== "undefined" && typeof this.state.teams[item] != "undefined" && this.state.teams[item].applier_id == u ?
                                            <div>
                                                <span className="far fa-caret-square-up caret" data-action="up" data-team-id={this.state.teams[item].team_id} onClick={this.changeOrder} data-board={user.team_board} data-user-id={user.user_id}></span>
                                                <span className="far fa-caret-square-down caret ml-1" data-action="down" onClick={this.changeOrder} data-team-id={this.state.teams[item].team_id} data-board={user.team_board} data-user-id={user.user_id}></span>
                                                <a href="" className="fa fa-trash float-right" data-id={user.user_id} data-team-id={this.state.teams[item].team_id} title="Удаление участника" onClick={this.removeParticipant} data-team_id={this.state.teams[item].team_id}></a>
                                            </div>
                                                : <span>
                                                    {typeof u !== "undefined" && user.user_id == u ?
                                                        <span className="badge badge-danger float-right" data-id={user.user_id} data-team-id={this.state.teams[item].team_id} title="Удаление участника" onClick={this.removeParticipant} data-team_id={this.state.teams[item].team_id}>Покинуть</span> : null}
                                                </span>
                                            }
                                        </td>
                                        <td></td>
                                    </tr>))}
                                </tbody>
                            </table>
                         : null }

                    </div>

                ))}

                </div>


                {this.state.tournament.is_online === 1 ?

                    <div className="col-sm-4">
                        <ApplyButton setApplies={this.setApplies} showMyApplies={this.showMyApplies} setCurrentTeam={this.setCurrentTeam} setOnlineTeamOwner={this.setOnlineTeamOwner}/>

                        <table className="table table-sm">
                            <thead className="thead-dark">
                            <tr>
                                {(this.state.in_team || this.state.current_team || this.state.is_team_owner) ?
                                    <th scope="col">Заявки {(this.state.current_team) ?
                                        <span>в {this.state.teams[this.state.current_team].name}</span> : null}</th> :
                                    <th scope="col">Мои заявки</th>}
                            </tr>
                            </thead>
                            <tbody>
                            {this.state.team_apliers.length > 0 && this.state.team_apliers.map((user, index1) => (
                                <tr key={index1}>
                                    <td className="d-flex justify-content-between">
                                        <span>{user.name} (<b>{user.team_name}</b>)</span>


                                        <span>
                                            {(typeof u !== "undefined" &&  typeof this.state.teams[user.team_id] != "undefined" && this.state.teams[user.team_id].applier_id == u) ?

                                                <i className="fa fa-check btn btn-success btn-sm approve_player"
                                                   onClick={this.approvePlayer} data-rating={user.tournaments_rating} data-id={user.user_id} aria-hidden="true"></i>
                                                : null}

                                            {((typeof u !== "undefined" &&  typeof this.state.teams[user.team_id] != "undefined" && this.state.teams[user.team_id].applier_id == u && this.state.current_team == user.team_id) || (typeof u != "undefined" && u != null && u == user.user_id)) ?
                                                <i onClick={this.declinePlayer} data-apply_id={user._id} className="fa fa-times btn btn-danger btn-sm decline_player" data-user-id={user.user_id} data-team-id={user.team_id}  aria-hidden="true"></i>
                                                : null}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                    </div>

                    : null}


            </div>

        );

    }
}

export default TeamsList;

