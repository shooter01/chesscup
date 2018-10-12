import React from 'react';
import {render} from 'react-dom';

function TourLink(props) {
    var tour_id = parseInt(props.tour_id);
    console.log(tour_id);
    var href = "/tournament/" + props.tournament_id + "/tour/" + (tour_id + 1);
    return <a className="btn btn-primary ml-1" href={href}>{tour_id + 1}</a>
}

export default TourLink;