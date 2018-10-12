import React from 'react';
import {render} from 'react-dom';
import TourLink from "./ToursLink.jsx";



class Tours extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            tournament : this.props.tournament,
        };
    }


    componentWillReceiveProps(nextProps){
        console.log(nextProps);
        if(nextProps.tournament !== this.state.tournament){
            this.setState({tournament:nextProps.tournament});
        }

    }

    render() {
        console.log(this.state.tours);

        var tours = (this.props.tournament.current_tour > 0) ? Array.from(Array(parseInt(this.props.tournament.current_tour) - 1).keys()) : [];
        return (<div className="mt-2"> Туры :
            {tours.map((item, index) => (
                <TourLink key={index} tournament_id={this.state.tournament.id} tour_id={index} />
            ))}
        </div>);
    }
}

export default Tours;