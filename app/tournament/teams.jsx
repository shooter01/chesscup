import React from 'react';
import {render} from 'react-dom';
import ParticipantsListTable from "./ParticipantsListTable.jsx";


class TeamsList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            teams: this.props.teams,
            tournament: this.props.tournament,
        }
        this.selectTeam = this.selectTeam.bind(this);
        this.removeTeam = this.removeTeam.bind(this);
        this.removeParticipant = this.removeParticipant.bind(this);
        this.changeOrder = this.changeOrder.bind(this);

    }
    componentDidMount(){
        var that = this;
    }
    changeOrder(event){
        var that = this;
        this.props.changeOrder(event);
    }

    selectTeam(event){
        var that = this;

        var $target = $(event.target);
        var id = $target.data("id");

        if (id) {
          //  $(".team-title").removeClass("bg-primary text-white").addClass("bg-light text-dark");
            this.props.setTeam(id);

         //   $target.addClass("bg-primary text-white").removeClass("bg-light text-dark");
         //   $target.find("[type='radio']").prop("checked", true);
        } else {
          //  $target.parent().click();
        }

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
//console.log(this.state.teams);
        return (
            <div className="position-relative mt-5">
                {Object.keys(this.state.teams).map((item, index) => (
                    <div className="mt-1" key={index}>
                        <div className={(this.props.current_team == this.state.teams[item].team_id ? "p-1 mb-2 d-flex justify-content-between team-title participant selected bg-primary text-white" : "p-1 mb-2 bg-light text-dark d-flex justify-content-between team-title participant ")} data-id={item} onClick={this.selectTeam}>
                            <div>
                               <b>{this.state.teams[item].name} </b>
                            </div>
                            <span>
                                {(this.props.current_team == this.state.teams[item].team_id ? null : <span data-id={item} onClick={this.selectTeam} className="select-team-btn mr-3">Выбрать команду</span>)}

                                <a href="" className="fa fa-trash trash-team text-dark mr-1 mt-1" data-id={item} title="Удаление команды" onClick={this.removeTeam} ></a>
                            </span>
                        </div>

                        {(this.state.teams[item].users.length > 0) ?
                            <table className="table table-hover borderless table-sm" key={index}>
                                <thead>
                                <tr>
                                    <th>Доска</th>
                                    <th>Имя</th>
                                    <th></th>
                                    <th></th>
                                </tr>
                                </thead>
                                <tbody>{this.state.teams[item].users.map((user, index1) => (
                                    <tr key={index1} className="first-row" data-id={this.state.teams[item].team_id} data-user-id={user.user_id}>
                                        <th scope="row">{index1 + 1}</th>
                                        <td>{user.name} {user.user_id} Доска : {user.team_board}</td>
                                        <td>
                                            <span className="far fa-caret-square-up caret" data-action="up" data-team-id={this.state.teams[item].team_id} onClick={this.changeOrder} data-board={user.team_board} data-user-id={user.user_id}></span>
                                            <span className="far fa-caret-square-down caret ml-1" data-action="down" onClick={this.changeOrder} data-team-id={this.state.teams[item].team_id} data-board={user.team_board} data-user-id={user.user_id}></span>
                                        </td>
                                        <td><a href="" className="fa fa-trash float-right" data-id={user.user_id} title="Удаление участника" onClick={this.removeParticipant} ></a></td>
                                    </tr>))}
                                </tbody>
                            </table>
                         : null }

                    </div>
                ))}

            </div>

        );

    }
}

export default TeamsList;
