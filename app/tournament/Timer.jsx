import React from 'react';
import {render} from 'react-dom';



class Timer extends React.Component {
    constructor(props) {
        super(props);
        this._isMounted = false;

        this.state = {
            timeleft: timeleft / 1000,

        };
        // this.save = this.save.bind(this);

        this.tick = this.tick.bind(this);
        this.setTimer = this.setTimer.bind(this);
    }

    componentDidMount(){
        var that = this;
        this._isMounted = true;

        this.setTimer();
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    setTimer(){

        var self = this;
        this.interval = setInterval(function () {
            if (self._isMounted) {
                self.setState({
                    timeleft : --self.state.timeleft
                }, function () {
                    if (self.state.timeleft > 0) {
                        self.tick();
                    } else {

                        self.setState({
                            timeleft: 0
                        });
                        clearInterval(self.interval);
                    }
                });
            } else {
                clearInterval(this.interval)
            }

        }, 1000);

    }



    tick(){
        //console.log(this.state.timeleft);


        const secondsInAMinute = 60;
        const secondsInAnHour  = 60 * secondsInAMinute;
        const secondsInADay    = 24 * secondsInAnHour;

        // дни
        const days = Math.floor(this.state.timeleft / secondsInADay);

        // часы
        const hourSeconds = this.state.timeleft % secondsInADay;
        const hours = Math.floor(hourSeconds / secondsInAnHour);

        // минуты
        const minuteSeconds = hourSeconds % secondsInAnHour;
        const minutes = Math.floor(minuteSeconds / secondsInAMinute);

        // оставшиеся секунды
        const remainingSeconds = minuteSeconds % secondsInAMinute;
        const seconds = Math.ceil(remainingSeconds);



       // var minutes = Math.floor((this.state.timeleft) / 60);
       // var secs = Math.floor((this.state.timeleft) % 60 % 60);


        var a = 4;

        function playTournamentStart(secs) {
            setTimeout(function () {
                if (a >= 0 && $("[id^='tournament']").length > 0){
                    $("#tournament" + secs).get(0).play();
                }
            }, 1000)
        }



        if (minutes == 0 && secs < 4 && secs >= 0) {
            playTournamentStart(secs);
        }



        this.setState({
            days_left : days,
            hours_left : hours,
            minutes_left : minutes,
            secs_left : (seconds < 10) ? "0" + seconds : seconds,
        });

    }

    render() {
        return (
            <span>
                {this._isMounted ? <span>
                                        {this.state.timeleft > 0 ? <span>
                                                {(this.state.days_left) ? this.state.days_left + "d " : null}
                                                {(this.state.hours_left) ? this.state.hours_left + "h " : null}
                                                {(this.state.secs_left) ? this.state.minutes_left + ":" + this.state.secs_left + " " : null}
                                                </span> : <span>0:00</span>}

                    </span> : null}
            </span>
        );
    }
}



if (document.getElementById("timer") != null) {0
    render(
        <Timer/>
        , document.getElementById('timer'));
}


export default Timer;