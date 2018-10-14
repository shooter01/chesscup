import React from 'react';
import {render} from 'react-dom';



class StartDate extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            tournament : (typeof tournament != "undefined") ? tournament : null,
            times : [1, 2, 3, 5, 10, 15, 20, 30, 45, 60],
        };
    }

    componentDidMount(){

        $( function() {
            $('#basicExample .time').timepicker({
                'showDuration': true,
                'timeFormat': 'H:i'
            });
            var d = new Date(); d.setMinutes(d.getMinutes() + 30);
            $('#basicExample .time').timepicker('setTime', d);


            $('#accurate_date_start').datepicker({
                'dateFormat': 'dd-mm-yy',
                'autoclose': true,
                minDate: 0
            }).datepicker("setDate", new Date());;
        });
    }




    render() {


        return (

            <div>

                                {/*<select name="wait_minutes" id="wait_minutes" className="form-control">

                                    {this.state.times.map((item, index) => (

                                        <option key={index} value={item}>{item} minute</option>

                                    ))}
                                </select>*/}

                                        <p id="basicExample">
                                            <label htmlFor="accurate_date_start">Дата старта: </label>

                                            <input autoComplete="off" type="datetime" id="accurate_date_start" className="date start form-control" />
                                            <label htmlFor="accurate_time_start" className="mt-3">Точное время старта (МСК): </label>

                                            <input autoComplete="off" type="text" id="accurate_time_start" className="time start form-control" />

                                        </p>
            </div>

                );
    }
}

render(
    <StartDate/>
    , document.getElementById('startDate'));
