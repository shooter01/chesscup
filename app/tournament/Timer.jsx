import React from 'react';
import {render} from 'react-dom';



class Timer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            timeleft: timeleft / 1000,

        };
        // this.save = this.save.bind(this);

        this.tick = this.tick.bind(this);
        this.setTimer = this.setTimer.bind(this);
    }




    componentDidMount(){
        var that = this;
        this.setTimer();
    }

    setTimer(){

        var self = this;
        this.interval = setInterval(function () {
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
        }, 1000);

    }



    tick(){
        console.log(this.state.timeleft);
        var minutes = Math.floor((this.state.timeleft) / 60);
        var secs = Math.floor((this.state.timeleft) % 60 % 60);

        this.setState({
            minutes_left : minutes,
            secs_left : secs,
        });

    }

    render() {
        return (
            <span>
                {this.state.timeleft > 0 ? <span>{this.state.minutes_left}:{this.state.secs_left}</span> : <span>0:00</span>}
            </span>
        );
    }
}

export default Timer;