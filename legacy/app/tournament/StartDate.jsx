import React from 'react';
import {render} from 'react-dom';



class StartDate extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            tournament : (typeof tournament != "undefined") ? tournament : null,
            times : [1, 2, 3, 5, 10, 15, 20, 30, 45, 60],
            start_type : (typeof tournament != "undefined") ? tournament.start_type : "interval",
        };
        this.setType = this.setType.bind(this);
    }

    componentDidMount(){

        var self = this;

            $(function () {
                $('#basicExample .time').timepicker({
                    'showDuration': true,
                    'timeFormat': 'H:i'
                });

                var d = new Date(); d.setMinutes(d.getMinutes() + 30);
                if (typeof tournament != "undefined")  {
                    $('#basicExample .time').timepicker('setTime', tournament.accurate_time_start);
                } else {
                    $('#basicExample .time').timepicker('setTime', d);

                }


                $('#accurate_date_start').datepicker({
                    'dateFormat': 'dd-mm-yy',
                    'autoclose': true,
                    minDate: 0
                });

                $('#wait_minutes').val("15");

                if (typeof tournament != "undefined")  {
                    $('#accurate_date_start').datepicker("setDate", tournament.accurate_date_start);
                } else {
                    $('#accurate_date_start').datepicker("setDate", new Date());

                }


                if (self.state.start_type == "accurate") {
                    $('[data-type="accurate"]').tab('show'); // Select tab by name
                }
            });





    }


    setType(event){
        const target = event.target;
        var attr = $(target).attr("data-type");

        this.setState({
            start_type : attr
        });
       // console.log(attr);
        return true;
    }

    render() {
        return (

            <div>
                <div className="row">
                    <div className="col-sm-12 mt-3">

                        <ul className="nav nav-pills mb-3" id="pills-tab" role="tablist">
                            <li className="nav-item">
                                <a className="nav-link active" onClick={this.setType} data-type="interval" id="pills-home-tab" data-toggle="pill" href="#pills-home" role="tab" aria-controls="pills-home" aria-selected="true">
                                    Interval</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" onClick={this.setType}
                                   data-type="accurate" id="pills-profile-tab" data-toggle="pill" href="#pills-profile" role="tab" aria-controls="pills-profile" aria-selected="false">Custom start date</a>
                            </li>
                            
                        </ul>
                        <div className="tab-content" id="pills-tabContent">
                            <div className="tab-pane fade show active" id="pills-home" role="tabpanel" aria-labelledby="pills-home-tab">
                                <label htmlFor="wait_minutes">Time before tournament starts: </label>
                                <select name="wait_minutes" id="wait_minutes" className="form-control">

                                    {this.state.times.map((item, index) => (

                                        (parseInt(item) < 2) ? <option key={index} value={item}>{item} minute</option>  : <option key={index} value={item}>{item} minutes</option>

                                    ))}
                                </select>

                                <input type="hidden" id="start_type" name="start_type" value={this.state.start_type}/>

                            </div>
                            <div className="tab-pane fade" id="pills-profile" role="tabpanel" aria-labelledby="pills-profile-tab">
                                <div className="row">
                                    <div className="col-sm-12 ">
                                        <p id="basicExample">
                                            <label htmlFor="accurate_date_start">Дата старта: </label>

                                            <input type="text" id="accurate_date_start"  className="date start form-control" />
                                            <label htmlFor="accurate_time_start" className="mt-3">Точное время старта (МСК): </label>

                                            <input type="text" id="accurate_time_start"  className="time start form-control" />

                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                        </div>
                        

    </div>
</div>



            </div>

                );
    }
}

render(
    <StartDate/>
    , document.getElementById('startDate'));
