import React from 'react';
import {render} from 'react-dom';
import ReactDOM from 'react-dom';


class Chat extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            messages : []
        };

        this.getChat = this.getChat.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.addMessage = this.addMessage.bind(this);
    }

    componentDidMount() {
        var self = this;

        this.socket = io(window.location.origin, {query: 'chat=' + tournament.id});

        this.socket.on('message', function (data) {
            data = JSON.parse(data);
            self.addMessage(data);
        });
    }

    addMessage(data){
        var temp = this.state.messages;
        temp.push(data.msg);
        this.setState({
            messages : temp
        });
    }

    getChat() {

    }

    sendMessage () {
        let textDOM = ReactDOM.findDOMNode(this.refs.text);
        let mes = $.trim(textDOM.value);
        console.log(mes);

        if (mes != "") {
            if (typeof current_user === "undefined") {
                return false;
            }
            let item = {
                msg: mes,
                user_id: u,
                name: current_user
            };
            textDOM.value = "";
            textDOM.focus();
        }
    }



    render () {

        return (
            <div className="">
                <div>
                    <div className="messages"></div>
                    <div className="input-group posAbsolute">
                        <input type="text" className="form-control" ref="text" placeholder="Message..."  aria-label="Recipient's username" aria-describedby="basic-addon2" />
                            <div className="input-group-append">
                                <button className="btn btn-outline-secondary" type="button" onClick={this.sendMessage}>Send</button>
                            </div>
                    </div>
                </div>
            </div>

        );
    }

}







    render(
        <Chat/>
    , document.getElementById('chat'));
