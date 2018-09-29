import React from 'react';
import {render} from 'react-dom';


class Link extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            id: this.props.id,
            tournament_id: this.props.tournament_id,
        }
    }
    componentDidMount(){
        var that = this;
    }


    render() {
        var href =  "/tournament/" + this.state.tournament_id + "/game/" + this.state.id;

        return (
            <a href={href}>Link {this.state.id}</a>
        );

    }
}

export default Link;
