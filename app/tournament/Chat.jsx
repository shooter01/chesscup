import React from 'react';
import {render} from 'react-dom';
import ReactDOM from 'react-dom';


class Chat extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tournament : tournament,
            messages : []
        };

        this.getChat = this.getChat.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.addMessage = this.addMessage.bind(this);
        this.scrollToBottom = this.scrollToBottom.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.checkLength = this.checkLength.bind(this);
    }

    handleKeyPress(e) {
        if(e.keyCode == 13 && e.shiftKey == false) {
            this.sendMessage(); // <--- all the form values are in a prop
            e.preventDefault();
        }
    }

    componentDidMount() {
        var self = this;

        this.socket = io(window.location.origin, {query: 'chat=' + tournament.id});

        this.socket.on('message', function (data) {
            data = JSON.parse(data);
            console.log(data);
            self.addMessage(data);
        });

        this.scrollToBottom();
        this.getChat();

    }

    addMessage(data){
        var temp = this.state.messages;
        temp.push(data);
        this.setState({
            messages : temp
        }, function () {
            this.scrollToBottom();
        });
        console.log(temp);
    }

    getChat() {
        var self = this;
        $.getJSON("/tournament/" + this.state.tournament.id + "/messages", function (data) {
            if (data.status == "ok") {
                try {
                    data = JSON.parse(data.messages);
                    var temp = [];
                    console.log(data);

                    for (var i = 0; i < data.length; i++) {
                        var obj = JSON.parse(data[i].msg);
                        temp.push(obj);
                    }

                    self.setState({
                        messages : temp
                    }, function () {
                        this.scrollToBottom();
                    });

                    console.log(temp);
                } catch(e) {
                    console.log(e.message);
                }
            }

        })
    }

    scrollToBottom(){
        //scroll to bottom
        var objDiv = document.querySelector("#messages");
        if (objDiv) {
            objDiv.scrollTop = objDiv.scrollHeight;
        }
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

            this.socket.emit('message', JSON.stringify(item));

            textDOM.value = "";
            textDOM.focus();
        }
    }

    checkLength(e) {
        let textDOM = ReactDOM.findDOMNode(this.refs.text);
        let mes = $.trim(textDOM.value);
        if(mes.length > 295) {
            textDOM.value = mes.substr(0,295);
        }
    }



    render () {

        return (
            <div className="">
                <div>
                    <div className="messages p-1" id="messages">
                        {this.state.messages.map((item, index) => (
                            <div key={index} className="mt-1 mt-2"><b>{item.name}</b>&nbsp;&nbsp;{item.msg}</div>
                        ))}
                    </div>
                    <div className="input-group posAbsolute">
                        <input onKeyDown={this.handleKeyPress} onInput={this.checkLength} onPaste={this.checkLength} type="text" className="form-control" ref="text" placeholder="Message..."  aria-label="Recipient's username" aria-describedby="basic-addon2" />
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
