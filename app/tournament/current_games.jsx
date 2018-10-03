import React from 'react';
import {render} from 'react-dom';


class CurrentGames extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            current_games: [],
            pairing: pairing,
            request_sent: false,
            participants: participants,
            tournament_id: tournament_id,
        }
    }
    componentDidMount(){
        var self = this;

        $.ajax({
            url: "/tournament/" + this.state.tournament_id + "/get_active",
            method: "get",
            timeout : 3000,
            beforeSend : function () {
                self.setState({
                    request_sent : true,
                });
            },
            statusCode: {
                404: function() {
                    alert( "page not found" );
                }
            }
        }).done(function (data) {
            if (data.status == "ok") {
                self.setState({
                    current_games : JSON.parse(data.current_games)
                })
            }
        }).fail(function ( jqXHR, textStatus ) {
            alert( "Request failed: " + textStatus );
        }).always(function () {
            self.setState({
                request_sent : false
            });
        });

    }

    render() {

        var w5 = {
            width : "5%"
        };
        var w12 = {
            width : "12%"
        };
        var w30 = {
            width : "36.5%"
        };
        var disabled = {
            disabled : "disabled"
        };
        return (
            <div className="position-relative">
                {(this.state.request_sent == true) ? <div>Loading...</div> : <div>{this.state.pairing.map((item, index) => (
                        <div key={index}>
                            {(this.state.current_games[item.id]) ?
                                <div>
                                    <Link tournament_id={this.state.tournament_id} p2_name={item.p2_name} p1_name={item.p1_name} id={item.id}/>
                                </div> : null}
                        </div>
                    ))}</div>
                }





            </div>

        );

    }
}



class Link extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            id: this.props.id,
            p1_name: this.props.p1_name,
            p2_name: this.props.p2_name,
            tournament_id: this.props.tournament_id,
        }
    }
    componentDidMount(){
        var that = this;
    }


    render() {
        var href =  "/tournament/" + this.state.tournament_id + "/game/" + this.state.id;

        return (
            <a href={href}>{this.state.p1_name} - {this.state.p2_name}</a>
        );

    }
}

render(
    <CurrentGames/>
    , document.getElementById('current_games'));
