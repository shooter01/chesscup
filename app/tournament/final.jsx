import React from 'react';
import {render} from 'react-dom';
import UserResults from "./table.jsx";
/*import Loading from "./../tasks/Loading.jsx";
import BreadCumbs from "./BreadCumbs.jsx";

import UserTable from "./UserTable.jsx";
import Tabs from "./Tabs.jsx";*/

class Pairing extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tournament_id: tournament_id,
            user_pairs: [],
            user_id: [],
        }
    }
    componentDidMount(){
        var that = this;



        $(".participant").on("click", function (event) {
            event.preventDefault();
            var user_id = $(this).attr("data-id");
            that.setState({
                user_id : user_id
            });
            $.ajax({
                url: "/tournament/get_pairs",
                method: "post",
                timeout : 3000,
                beforeSend : function () {
                    that.setState({
                        request_sent : true,
                    });
                },
                data : {
                    //result : value,
                    tournament_id : that.state.tournament_id,
                    user_id : user_id
                },
                statusCode: {
                    404: function() {
                        alert( "page not found" );
                    }
                }
            }).done(function (data) {
                if (data.status === "ok") {
                    $("#user_results_modal").modal("show");
                    that.setState({
                        user_pairs : data.pairing
                    });
                } else {
                    alert(data.msg);
                }
            }).fail(function ( jqXHR, textStatus ) {
                alert( "Request failed: " + textStatus );
            }).always(function () {
                that.setState({
                    request_sent : false
                });
            });
        });
       // this.getUsers(200);
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


                <div className="modal" id="user_results_modal" tabIndex="-1" role="dialog"  aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg" role="document">
                        <div className="modal-content">

                            <div className="modal-header">
                                <h5 className="modal-title" id="exampleModalLabel"></h5>
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>

                            <div className="modal-body" id="user_results">
                                <UserResults user_id={this.state.user_id} user_pairs={this.state.user_pairs}/>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-dismiss="modal">Закрыть</button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

        );

    }
}

render(
    <Pairing/>
    , document.getElementById('final'));
