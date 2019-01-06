import React from 'react';
import {render} from 'react-dom';


const TITLES = {
  "1" : "CM",
  "2" : "NM",
  "3" : "FM",
  "4" : "IM",
  "5" : "GM",
  "10" : "WCM",
  "20" : "WNM",
  "30" : "WFM",
  "40" : "WIM",
  "50" : "WGM",
};

class ResultsTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            participants : this.props.participants || [],
            tournament : this.props.tournament,
        }

    }

    componentWillReceiveProps(nextProps){
        if(nextProps.value !== this.state.participants){
            this.setState({participants:nextProps.participants});
        }
        if(nextProps.value !== this.state.tournament){
            this.setState({tournament:nextProps.tournament});
        }
    }


    render() {
        var width = {
            width : 7 + "%"
        }
        return (
            <div className="table-responsive">

            <table className="table  table-hover table-bordered table-sm">
                <thead className="thead-light">
                    <tr>
                        <th>

                        </th>
                        <th>
                            Имя
                        </th>
                        <th className="text-center">
                            Очки
                        </th>
                        <th className="text-center">
                            Бухг.
                        </th>
                        <th className="text-center">
                            Бергер
                        </th>
                        {this.state.tournament.league_id && this.state.tournament.season_id ?
                        <th className="text-center">
                            Очки лиги
                        </th> : null
                        }
                        <th>

                        </th>
                    </tr>
                </thead>
                <tbody>
                {this.state.participants.map((item, index) => (
                    <tr key={index}>
                        <td>{index + 1}</td>
                        <td> {item.title ? <span className="badge badge-danger">{TITLES[item.title]}</span>  : null} <a
                            href={"/users/" + item.user_id} target="_blank">{item.name}</a>   <span className="badge badge-light">{item.tournaments_rating}</span> {item.is_active === 0 ? <span className="badge badge-danger">bye</span> : null}</td>
                        <td className="text-center">{item.scores}</td>
                        <td className="text-center">{item.bh}</td>
                        <td className="text-center">{item.berger}</td>
                        {this.state.tournament.league_id && this.state.tournament.season_id ?
                            <td className="text-center text-success">{item.league_points ? "+" + item.league_points : null}</td>
                            : null
                        }
                        <td style={width} className="text-center">
                            <a href=""  data-id={item.user_id}  className="participant fa fa-eye"></a>

                            {/*{item.user_id ? <Link id={item.user_id} /> : null}*/}
                        </td>

                    </tr>
                ))}
                </tbody>

            </table>
            </div>
        );
    }
}


function Link(props) {
    var link = "/users/stat/" + props.id;
    return  <a target="_blank" href={link} className="fa fa-chart-line" ></a>;
}


export default ResultsTable;