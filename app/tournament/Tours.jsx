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
        // console.log(nextProps);
        if(nextProps.tournament !== this.state.tournament){
            this.setState({tournament:nextProps.tournament});
        }

    }

    render() {

        var tours = [];

        if (this.props.tournament.current_tour > 0) {

            if (this.props.tournament.current_tour <= this.props.tournament.tours_count) {
                tours = Array.from(Array(parseInt(this.props.tournament.current_tour)).keys())
            } else {
                tours = Array.from(Array(parseInt(this.props.tournament.current_tour) - 1).keys())
            }

            /*(this.props.tournament.current_tour > 0) ? Array.from(Array(parseInt(this.props.tournament.current_tour) - 1).keys()) : [];*/

        }

        return (

            <div>
                {tours.length > 0 ?
                    <div className="mt-2"> Туры :
                    {tours.map((item, index) => (
                        <TourLink key={index} tournament_id={this.state.tournament.id} tour_id={index} />
                    ))}
                    </div>
                    : null}
            </div>

                );
    }
}

export default Tours;