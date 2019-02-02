import React from 'react';
import {render} from 'react-dom';
import Timer from "./Timer.jsx";




class TournamentStatus extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            tournament : this.props.tournament,
        };
    }
    componentWillReceiveProps(nextProps){
        if(nextProps.tournament !== this.state.tournament){
            this.setState({tournament:nextProps.tournament});
        }
    }

    render() {
        return (

            <div className="mt-2">
                {(this.state.tournament.is_closed == 1) ? <h4><div className="badge badge-danger starting">Tournament complete</div></h4> : null}
                {(this.state.tournament.is_canceled == 1) ? <h4><div className="badge badge-info starting">Tournament canceled</div></h4> : null}
                {(!this.state.tournament.is_closed && this.state.tournament.is_active == 1) ? <div>
                        <div className="badge badge-success">Tournament Active</div>
                        <div><div className="badge badge-info">Current tour: {this.state.tournament.current_tour}</div></div>
                    </div> : null}
                {(this.state.tournament.is_online && !this.state.tournament.is_closed && !this.state.tournament.is_active) ? <div className="badge badge-secondary starting">Турнир стартует через : <Timer timeleft={timeleft} /></div> : null}
            </div>

                );
    }
}

export default TournamentStatus;