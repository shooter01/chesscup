import React from 'react';
import {render} from 'react-dom';


class PlaySockets extends React.Component {
    constructor(props){

        super(props);
        this.state = {
            list : []
        };

        this.accept = this.accept.bind(this);

    }

    componentDidMount(){
        var self = this;
        var url;
        if (typeof u != "undefined") {
            url = 'h=' + u;
        } else {
            url = 'h=null';
        }
        this.socket = io(window.location.origin, {query: url + "&lobby=true"});

        this.socket.on('games_list', function (data) {
            const list = JSON.parse(data.list);

            self.setState({
                list : list
            });

            console.log(list);

        });
        this.socket.on('start_game', function (data) {
            location.href = "/play/game/" + data.created_id;
            console.log(data);

        });



        //$(function () {
        $("#create_game").on("click", function () {
            self.socket.emit('create_game', JSON.stringify({
                "amount" : $("#amount").val(),
                "user_id" : u,
                "user_name" : user_name,
            }));

        });
        // })
    }

    accept(event){
        var $target = $(event.target);
        var attr = $target.data("game_id");


        this.socket.emit('accept_game', JSON.stringify({
            "user_id" : u,
            "game_id" : attr,
        }));

        console.log(attr);
    }


    render () {
        return (
            <div>

                <table className="table table-sm">
                    <thead className="thead-dark">
                    <tr>
                        <th scope="col" className="text-center">#</th>
                        <th scope="col" className="text-center">Имя</th>
                        <th scope="col" className="text-center">Контроль</th>
                        <th scope="col" className="text-center"></th>
                    </tr>
                    </thead>
                    <tbody>




                        {this.state.list.map((item, index) => (

                        <tr key={index}>
                            <th>{item.user_id}</th>
                            <td className="text-center">{item.user_name}</td>
                            <td className="text-center">{item.time_control} + 0</td>
                            <td className="text-center">
                                <span className="btn btn-primary" data-game_id={item._id} onClick={this.accept}>Принять</span>
                            </td>
                        </tr>
                        ))}

                    </tbody>
                </table>

            </div>

        );
    }

}


render(
    <PlaySockets/>
    , document.getElementById('games'));