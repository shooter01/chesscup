import React from 'react';
import {render} from 'react-dom';
import ResultsTable from "./ResultsTable.jsx";
import Tours from "./Tours.jsx";


class TeamsTables extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tournament: tournament,
            results_table : this.props.results_table || [],
            participants_boards : this.props.participants_boards || {},
            participants : this.props.participants || [],
            participants_array : this.props.participants_array || [],
        };
    }
    componentDidMount(){
        const self = this;
    }
    changeOrder(event){
        const self = this;
    }

    selectTeam(event){
        const self = this;



    }



    componentWillReceiveProps(nextProps){


       if(nextProps.value !== this.props.results_table){
            this.setState({
                results_table:nextProps.results_table,

            });
       }


       if(nextProps.value !== this.props.participants_array){
            this.setState({
                participants_array:nextProps.participants_array,

            });
       }
       if(nextProps.value !== this.props.participants){
            this.setState({
                participants:nextProps.participants,

            });
       }
       if(nextProps.value !== this.props.participants_boards){
            this.setState({
                participants_boards:nextProps.participants_boards,

            });
       }

    }
    render() {
        const self = this;

        console.log(participants_array);
        var tifOptions = Object.keys(this.state.participants_boards).map(function(key, index) {
            return <div key={key}>
                <h5 className="mt-2">Доска № {index + 1}</h5>
                <table className="table table-bordered table-hover table-sm">
                    <thead className="thead-light">
                    <tr>
                        <th></th>
                        <th>Имя</th>
                        <th>Очки</th>
                        <th>Бх</th>
                        <th>SB</th>
                        <th>Rate</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {console.log(this)}

                    {self.state.participants_boards[key].map((item, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td><a target="_blank" href="/users/stat/74">{item.name}</a></td>
                            <td>{item.scores}</td>
                            <td>{item.bh}</td>
                            <td>{item.berger}</td>
                            <td>{item.tournaments_rating}</td>
                            <td>
                                <a href="" data-id="74" className="participant fa fa-eye"></a>
                                <a target="_blank" href="/users/stat/74" className="fa fa-chart-line"></a>
                            </td>
                        </tr>
                    ))}

                    </tbody>
                </table>
            </div>
        });

        return (
            <div className="position-relative mt-2">

                <Tours tournament={this.state.tournament} />


                <ul className="nav nav-tabs" id="teams_tables_nav" role="tablist">
                    <li className="nav-item">
                        <a className="nav-link active" data-toggle="tab" href="#teams_participants" role="tab" aria-controls="home" aria-selected="true">Команды</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" data-toggle="tab" href="#every_board" role="tab" aria-controls="profile" aria-selected="false">По доскам</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" data-toggle="tab" href="#individial" role="tab" aria-controls="contact" aria-selected="false">Все участники</a>
                    </li>
                </ul>
                <div className="tab-content" id="myTabContent">
                    <div className="tab-pane fade show active" id="teams_participants" role="tabpanel" aria-labelledby="home-tab">


                        <table className="table table-bordered table-hover table-sm">
                            <thead className="thead-light">
                            <tr>
                                <th></th>
                                <th>Имя</th>
                                <th className="text-center">Очки</th>
                                <th className="text-center">Командные очки</th>
                                <th className="text-center">Бх</th>
                                <th className="text-center">SB</th>
                            </tr>
                            </thead>
                            <tbody>

                                {this.state.results_table.map((item, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{item.team_name}</td>
                                            <td className="text-center">{item.scores}</td>
                                            <td className="text-center">{item.team_scores}</td>
                                            <td className="text-center">{item.bh}</td>
                                            <td className="text-center">{item.berger}</td>
                                        </tr>
                                ))}

                            </tbody>
                        </table>




                    </div>
                    <div className="tab-pane fade" id="every_board" role="tabpanel" aria-labelledby="profile-tab">

                        <div>{tifOptions}</div>

                    </div>
                    <div className="tab-pane fade" id="individial" role="tabpanel" aria-labelledby="contact-tab">

                        <ResultsTable participants={this.state.participants_array} tournament={this.state.tournament}/>

                    </div>
                </div>

            </div>

        );

    }
}

export default TeamsTables;

/*
render(
    <TeamsTables/>
    , document.getElementById('team_tables'));
*/
