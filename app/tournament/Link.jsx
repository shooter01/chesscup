import React from 'react';
import {render} from 'react-dom';


class Link extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            id: this.props.id,
            p1_id: this.props.p1_id,
            p2_id: this.props.p2_id,
            tournament_id: this.props.tournament_id,
        }
    }
    componentDidMount(){
        var that = this;
    }


    render() {
        console.log(this.props);
        var href =  "/tournament/" + this.state.tournament_id + "/game/" + this.props.id;

        return (
            (this.props.p1_id != null && this.props.p2_id != null) ? <a href={href}>Партия</a> : null

        );

    }
}

export default Link;
