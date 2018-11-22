import React from 'react';
import {render} from 'react-dom';

if ($("[id='tournament1']").length > 0) {
    window.s_coundtown0 = new Audio("data:audio/wav;base64," + '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');

    window.s_coundtown1 = new Audio("data:audio/wav;base64," + "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");
    window.s_coundtown2 = new Audio("data:audio/wav;base64," + "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");

    window.s_coundtown3 = new Audio("data:audio/wav;base64," + "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");


    s_coundtown0.volume = 0.5;
    s_coundtown1.volume = 0.5;
    s_coundtown2.volume = 0.5;
    s_coundtown3.volume = 0.5;
}




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

        function playTournamentStart(seconds) {
            setTimeout(function () {
                if (a >= 0 && $("[id='tournament1']").length > 0){
                    window["s_coundtown" + seconds].play();
                }
            }, 1000)
        }

        if (minutes == 0 && seconds < 4 && seconds >= 0) {
            playTournamentStart(seconds);
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