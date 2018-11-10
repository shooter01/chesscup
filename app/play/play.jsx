import React from 'react';
import {render} from 'react-dom';
import WS from "../ws";

class PlaySockets extends React.Component {
    constructor(props){

        super(props);
        this.state = {
            games : [],
            user_id : typeof u != "undefined" ? u : null,
            challenges : [],
        };

        this.accept = this.accept.bind(this);
        this.remove = this.remove.bind(this);

    }

    componentDidMount(){
        var self = this;
       /* var url;
        if (typeof u != "undefined") {
            url = 'h=' + u;
        } else {
            url = 'h=null';
        }*/
        //this.socket = io(window.location.origin, {query: url + "&lobby=true"});

        this.socket = new WS(function (data) {

            if (data.action === "games_list") {
                const games = JSON.parse(data.games);
                const challenges = JSON.parse(data.challenges);

                self.setState({
                    games : games,
                    challenges : challenges,
                });

            }

            //console.log(challenges);
            //console.log(games);
        }, "localhost:7000");


       /* window.socket.on('games_list', function (data) {
            const games = JSON.parse(data.games);
            const challenges = JSON.parse(data.challenges);

            self.setState({
                games : games,
                challenges : challenges,
            });



        });*/



        //$(function () {
        $("#create_game").on("click", function () {

            self.socket.ws.send(JSON.stringify({
                "action" : "create_game",
                "amount" : $("#amount").val(),
                "user_id" : u,
                "time_inc" : $("#time_inc").val(),
                "user_name" : user_name,
            }));

            $("#exampleModal").modal("hide");
        });


        window.onbeforeunload = function(e) {
            if (typeof u !== "undefined") {
                self.socket.ws.send(JSON.stringify({
                    "action" : "remove_all_challenges",
                    "user_id" : u,
                }));
            }
        };

        // })
    }

    accept(event){
        var $target = $(event.target);
        var attr = $target.data("game_id");

        if (typeof u !== "undefined") {
            this.socket.ws.send(JSON.stringify({
                "action" : "accept_game",
                "user_id": u,
                "game_id": attr,
                "user_name": user_name,

            }));
        }

        // console.log(attr);
    }
    remove(event){
        var attr = $(event.target).data("game_id");

        if (typeof u !== "undefined") {
            this.socket.ws.send(JSON.stringify({
                "action" : "remove",
                "user_id" : u,
                "game_id" : attr,

            }));
        }


        // console.log(attr);
    }


    render () {
        return (
            <div>

                <h2>Вызовы</h2>

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




                        {this.state.challenges.map((item, index) => (

                        <tr key={index}>
                            <th>{item.user_id}</th>
                            <td className="text-center">{item.user_name}</td>
                            <td className="text-center">{item.time_control} + {item.time_inc}</td>
                            <td className="text-center">
                                {this.state.user_id != null ?
                                     (item.owner !=  this.state.user_id) ?
                                         <span className="btn btn-primary btn-sm" data-game_id={item._id} onClick={this.accept}>Принять</span>
                                         :
                                         <span className="btn btn-danger btn-sm" data-game_id={item._id} onClick={this.remove}>Удалить</span>
                                    : null
                                }
                            </td>
                        </tr>
                        ))}

                    </tbody>
                </table>

                <h2>Игры</h2>

                <table className="table table-sm">
                    <thead className="thead-light">
                    <tr>
                        <th scope="col" className="text-center">#</th>
                        <th scope="col" className="text-center"></th>
                        <th scope="col" className="text-center">Контроль</th>
                        <th scope="col" className="text-center"></th>
                    </tr>
                    </thead>
                    <tbody>
                        {this.state.games.map((item, index) => (

                            <tr key={index}>
                                <th>{item.user_id}</th>
                                <td className="text-center">{item.p1_name} vs {item.p2_name}</td>
                                <td className="text-center">{item.amount} + 0</td>
                                <td className="text-center">
                                    <a className="btn btn-primary btn-sm" href={ "/play/game/" + item._id }>Смотреть</a>
                                </td>
                            </tr>
                        ))}

                    </tbody>
                </table>

            </div>

        );
    }

}

$(function () {
    render(
        <PlaySockets/>
        , document.getElementById('games'));
});
