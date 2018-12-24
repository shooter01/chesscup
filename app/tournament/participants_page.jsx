import React from 'react';
import {render} from 'react-dom';
import Participants from "./participant.jsx";


$(function () {
    render(
        <Participants/>
        , document.getElementById('participants'));
});