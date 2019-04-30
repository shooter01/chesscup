import React from 'react';
import {render} from 'react-dom';
import TeamsList from "../tournament/teams.jsx";

class MyTeam extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            teams: tournaments_teams,
            tournament: tournament,

        };
    }
    render() {
        return (
            <div>
                <hr/>
                <TeamsList tournament={this.state.tournament} removeParticipant={this.removeParticipant} removeTeam={this.removeTeam} teams={this.state.teams} changeOrder={this.changeOrder} />
            </div>
        );
    }
}

$(function () {
    render(
        <MyTeam/>
        , document.getElementById('myteam'));
})

