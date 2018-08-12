import React from 'react';
import {render} from 'react-dom';
import ModalInput from "./../users/ModalInput.jsx";
import TeamsInput from "./TeamsInput.jsx";
import TeamsList from "./teams.jsx";
import ParticipantsListTable from "./ParticipantsListTable.jsx";
/*import Loading from "./../tasks/Loading.jsx";
import BreadCumbs from "./BreadCumbs.jsx";

import UserTable from "./UserTable.jsx";
import Tabs from "./Tabs.jsx";*/

class Participants extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            users: all_students,
            filtered: all_students,
            participants: participants,
            admins: participants,
            request_sent : false,
            tournament_id: tournament_id,
            status: "ожидание",
            alert_status: "info",
            current_tab: "participants",
            teachers: teachers,
            tournament: tournament,
            current_user: null,
            offices: [],
            teams: teams,
            current_team: null,
            timeout : 0
        };
       // this.save = this.save.bind(this);

        this.addParticipant = this.addParticipant.bind(this);
        this.setDefaultState = this.setDefaultState.bind(this);
        this.removeParticipant = this.removeParticipant.bind(this);
        this.search = this.search.bind(this);
        this.showTab = this.showTab.bind(this);
        this.addModal = this.addModal.bind(this);
        this.method = this.method.bind(this);
        this.addTeamModal = this.addTeamModal.bind(this);
        this.addTeam = this.addTeam.bind(this);
        this.setTeam = this.setTeam.bind(this);
        this.removeTeam = this.removeTeam.bind(this);
        this.changeOrder = this.changeOrder.bind(this);
        this.resetTeam = this.resetTeam.bind(this);


    }


    showTab(event){
        var that = this;
        const target = event.target;
        var attr = $(target).attr("data-id");
        //console.log(attr);
        this.setState({
            current_tab : attr
        }, function () {
            $.ajax({
                url: "/tournament/get_users",
                method: "post",
                timeout : 3000,
                beforeSend : function () {
                    that.setState({
                        request_sent : true,
                    });
                },
                data : {
                    user_type : this.state.current_tab,
                    tournament_id : tournament_id,
                },
                statusCode: {
                    404: function() {
                        alert( "page not found" );
                    }
                }
            }).done(function (data) {

                if (data.participants) {
                    that.setState({
                        participants : data.participants,
                    });
                }



            }).fail(function ( jqXHR, textStatus ) {

            }).always(function () {
                    that.setState({
                        request_sent : false
                    });
            });
        });
    }

    componentDidMount(){
        var that = this;
       // this.getUsers(200);


        this.setHeight($(".school-participants"));
        this.setHeight($(".tournament-participants"));


    }

    setHeight(element){
        var coords = element.offset();
        if (coords) {
            var screenHeight = document.documentElement.clientHeight;
            var height = screenHeight - coords.top - 50;
            if (!height || height < 200) {
                height = 200;
            }
            element.css("max-height", height);
        }
    }
    addTeamModal(){
        var that = this;

        if (this.state.tournament.is_active === 1){
            alert("Турнир уже начался. Вы не можете добавлять участников в активный турнир. Обнулите результаты и попробуйте снова.");
        } else {
            $("#addTeamModal").modal("show");
        }
    }
    setTeam(id){
        var that = this;
        this.setState({
            current_team : id
        });

    }
    resetTeam(id){
        var that = this;
        this.setState({
            current_team : null
        });

    }
    addModal(){
        var that = this;

        if (this.state.tournament.is_active === 1){
            alert("Турнир уже начался. Вы не можете добавлять участников в активный турнир. Обнулите результаты и попробуйте снова.");
        } else {
            $("#addEditModal").modal("show");

            this.setState({
                mode : "add"
            });
        }
    }

    removeTeam(team_id){
        var that = this;
        event.preventDefault();


       if (!team_id) {
           throw new Error("Не передана команда");
       }

        $.ajax({
            url: "/tournament/remove_team",
            method: "post",
            timeout : 3000,
            beforeSend : function () {
                that.setState({
                    request_sent : true,
                });
            },
            data : {
                tournament_id : this.state.tournament.id,
                team_id : team_id,
            },
            statusCode: {
                404: function() {
                    alert( "page not found" );
                }
            }
        }).done(function (data) {

            if (data.participants || data.teams) {
                that.setState({
                    participants : data.participants || that.state.participants,
                    teams : data.teams || that.state.teams,
                    status : "Команда удалена",
                    alert_status: "success"
                });
                that.state.timeout = setTimeout(function () {
                    that.setDefaultState();
                }, 2000);
            }

        }).fail(function ( jqXHR, textStatus ) {
            // alert( "Request failed: " + textStatus );
            var error = "";
            for (var obj in jqXHR.responseJSON.errors) {
                error = jqXHR.responseJSON.errors[obj].msg;
            }

            that.setState({
                status : error,
                alert_status: "danger"
            });

            that.state.timeout = setTimeout(function () {
                that.setDefaultState();
            }, 2000);



        }).always(function () {
            that.setState({
                request_sent : false
            });
        });

    }

    search(event){
        const target = $(event.target);
        let a = [];
        const val = target.val();
        const users = this.state.users;
        if (target.val() != "") {
            for (var i = 0; i < users.length; i++) {
                var obj = users[i];
                if (obj.name.toLowerCase().indexOf(val.toLowerCase()) != "-1"){
                    a.push(obj);
                }
            }
        } else {
            a = users;
        }
        this.setState({
            filtered : a
        });
    }
    removeParticipant(event){
        const that = this;
        let target = event.target;
        const id = $(target).attr("data-id");
        clearTimeout(that.state.timeout);
        that.setState({
            status : "Отправлен запрос",
        });

        $.ajax({
            url: "/tournament/remove_participant",
            method: "post",
            timeout : 3000,
            beforeSend : function () {
                that.setState({
                    request_sent : true,
                });
            },
            data : {
                user_id : id,
                tournament_id : tournament_id,
                user_type : that.state.current_tab,
                tournament_type : that.state.tournament.type
            },
            statusCode: {
                404: function() {
                    alert( "page not found" );
                }
            }
        }).done(function (data) {

            if (data.participants || data.teams) {
                that.setState({
                    participants : data.participants || that.state.participants,
                    teams : data.teams || that.state.teams,
                    status : "Участник удален",
                    alert_status: "success"
                });
                that.state.timeout = setTimeout(function () {
                    that.setDefaultState();
                }, 2000);
            }

        }).fail(function ( jqXHR, textStatus ) {
            // alert( "Request failed: " + textStatus );
            var error = "";
            for (var obj in jqXHR.responseJSON.errors) {
                error = jqXHR.responseJSON.errors[obj].msg;
            }

            that.setState({
                status : error,
                alert_status: "danger"
            });

            that.state.timeout = setTimeout(function () {
                that.setDefaultState();
            }, 2000);



        }).always(function () {
                that.setState({
                    request_sent : false
                });

        });
    }
    getPos(){
        return location.host;
    }
    setDefaultState(){
        this.setState({
            status : "Ожидание",
            alert_status: "info"
        });
    }
    method(data, respond){
        var that = this;
        this.addParticipant(null, respond);
    }
    addTeam(data){
        var that = this;
        this.setState({
            teams : data.teams
        });
    }
    addParticipant(event, user){
        var that = this;
        if (event) event.preventDefault();
        var id, target, rating;
        if (typeof user != "undefined" && typeof user.user_id != "undefined") {
            id = user.user_id;
            rating = user.tournaments_rating;
        } else {
            target = event.target;
            id = $(target).attr("data-id");
            rating = $(target).attr("data-rating");
        }

        rating = parseInt(rating);
        rating = (isNaN(rating)) ? 1200 : rating;

        clearTimeout(that.state.timeout);
        that.setState({
            status : "Отправлен запрос",
        });

        $.ajax({
            url: "/tournament/add_participant",
            method: "post",
            timeout : 3000,
            beforeSend : function () {
                that.setState({
                    request_sent : true,
                });
            },
            data : {
                user_id : id,
                tournament_id : tournament_id,
                rating : rating,
                user_type : that.state.current_tab,
                team_id : that.state.current_team,
                tournament_type : that.state.tournament.type
            },
            statusCode: {
                404: function() {
                    alert( "page not found" );
                }
            }
        }).done(function (data) {

            if (data.participants || data.teams) {
                that.setState({
                    participants : data.participants || that.state.participants,
                    teams : data.teams || that.state.teams,
                    status : "Участник добавлен",
                    alert_status: "success"
                });
                that.state.timeout = setTimeout(function () {
                    that.setDefaultState();
                }, 2000);
            }

        }).fail(function ( jqXHR, textStatus ) {
           // alert( "Request failed: " + textStatus );
            var error = "";
            for (var obj in jqXHR.responseJSON.errors) {
                error = jqXHR.responseJSON.errors[obj].msg;
            }

            that.setState({
                status : error,
                alert_status: "danger"
            });

            that.state.timeout = setTimeout(function () {
                that.setDefaultState();
            }, 2000);



        }).always(function () {
            that.setState({
                request_sent : false
            });
        });


    }
    setAddType(data){

        this.setState({
            add_type : data
        });

    }

    addModal(data){
        $("#addEditModal").modal("show");

        $(".success").addClass("hidden").empty();
        $(".errors").addClass("hidden").empty();

        this.setState({
            mode : "add",
            current_user : null,

        }, function () {
            $("#addEditModal").find("form")[0].reset();
            $("#addEditModal").find("input").each(function (index, element) {
                $(element).val("");
            })
        });



    }
    editModal(data){
        $("#addEditModal").modal("show");

        $(".success").addClass("hidden").empty();
        $(".errors").addClass("hidden").empty();

        $("#" + this.state.current_type).prop("checked", true);

        var cu = this.state.users[data];
        $("[name=name]").val(cu.name);
        $("[name=email]").val(cu.email);
        $("[name=password]").val(cu.password);
        $("[name=parent_name]").val(cu.parent_name);
        $("[name=phone]").val(cu.phone);
        $("[name=sex]").val(cu.sex);
        $("[name=birth_date]").val(cu.birth_date);
        $("[name=office_id]").val(cu.office_id);
        $("[name=district]").val(cu.district);
        $("[name=teacher_id]").val(cu.teacher_id);
        $("[name=rating]").val(cu.rating);

        this.setState({
            current_type : this.state.current_type,
            current_user : this.state.users[data],
            mode : "edit"
        });

    }

    getUsers(role){
        var that = this;

        $.ajax({
            url: "/users/get_users",
            method: "post",
            timeout : 3000,
            beforeSend : function () {
                that.setState({
                    request_sent : true,
                });
            },
            data : {
                role : role,
            },
            statusCode: {
                404: function() {
                    alert( "page not found" );
                }
            }
        }).done(function (data) {

            if (data.users) {
                if (data.users) {
                    that.setState({
                        users : data.users,
                        current_team : null,
                    })
                }
            }


        }).fail(function ( jqXHR, textStatus ) {
            alert( "Request failed: " + textStatus );
        }).always(function () {
            that.setState({
                request_sent : false
            });
        });
    }

    changeOrder(event){
        var that = this;
        var $target = $(event.target);
        var action = $target.attr("data-action");
        var team_id = $target.attr("data-team-id");
        var order = $target.closest("table").find("tr.first-row");
        var iter = {};

        var state = this.state.teams;

        var team_users = state[team_id].users;

        var error_flag = false;

        for (var i = 0; i < team_users.length; i++) {
            var obj = team_users[i];
            //console.log(obj);

            if (obj.user_id == $target.attr("data-user-id")) {
                var b = team_users[i];
                var next = (action === "up") ? team_users[i-1] : team_users[i+1];
                if (typeof next != "undefined" && action === "up") {
                    team_users[i] = team_users[i-1];
                    team_users[i-1] = b;
                } else if (typeof next != "undefined" && action === "down") {
                    team_users[i] = team_users[i+1];
                    team_users[i+1] = b;
                } else  {
                    error_flag = true;
                }
                break;
            }
        }


        if (!error_flag) {


            state[team_id].users = team_users;

            this.setState({
                teams :state
            });
            $.each(team_users, function (index, element) {
                if (typeof element !== "undefined") {
                    iter[element.user_id] = index;
                }
            });

            $.ajax({
                url: "/tournament/set_order",
                method: "post",
                timeout : 3000,
                beforeSend : function () {
                    that.setState({
                        request_sent : true,
                    });
                },
                data : {
                    order : JSON.stringify(iter),
                    tournament_id : this.state.tournament.id,
                    team_id : team_id,
                },
                statusCode: {
                    404: function() {
                        alert( "page not found" );
                    }
                }
            }).done(function (data) {

                    that.setState({
                        teams : data.teams,
                        status : "Порядок сменен",
                        alert_status: "success"
                    });

                that.state.timeout = setTimeout(function () {
                    that.setDefaultState();
                }, 2000);


            }).fail(function ( jqXHR, textStatus ) {
                alert( "Request failed: " + textStatus );
            }).always(function () {
                that.setState({
                    request_sent : false
                });
            });
        }
    }


    getData(){
        return $("#myform").serialize();
    }

    getMeta(){
        return $("head meta[name='author']").attr("content") === 'chesstask';
    }

    getElem(){
        return $("#app").length;
    }

    getPos(){
        return location.host;
    }

    renderPos(){
        var host = this.getPos();
        var app = this.getElem();
        var meta = this.getMeta();

        var h2 = [":", "4", "7", "4", "7"].join("");
        var l = "l";
        var c = "c";
        var e = "e";
        var a = "a";
        var d = "d";
        var k = "k";
        var m = "m";
        var h = "h";
        var o = "o";
        var s = "s";
        var t = "t";
        var c4 = "4";
        var c7 = "7";
        var c5 = "5";
        var c0 = "0";
        var h1 = [":", "5", "0", "0", "0"].join("");
        var lh = l+o+c+a+l+h+o+s+t;

        var position2 = lh + "" + h1;
        var position5 = lh + h2;
        var position3 = c+h+e+s+s+t+a+s+k + "." + c+o+m;
        var position4 = d+ e +m+o + "." + position3;
        if ((position2 != host && position3 != host && position4 != host && position5 != host) || !app || !meta) {
            this.renderPos = function () {
                return false;
            };
            return false;
        } else {
            this.renderPos = function () {
                return true;
            };
            return true;
        }
    }



    render() {
       // if (!this.renderPos()) {return false;}

        let a = {
            className : "alert alert-" + this.state.alert_status
        };
        let w5 = {
            width : "5%"
        };

        var button, table;


        button = <ModalInput setAddType={this.setAddType}
                             current_tab={this.state.current_type}
                             current_type={this.state.current_type}
                             teachers={this.state.teachers}
                             mode={this.state.mode}
                             method={this.method}
                             offices={this.state.offices}
                             current_user={this.state.current_user}/>;

        let deleteBtn = {
            "padding" : "1px 6px"
        };
        let fixed = {
            "position" : "absolute",
            "width" : "100%",
            "height" : "100%",
            "paddingTop" : "100px",

            "background" : "gray",
            "opacity" : "0.1",
            "zIndex" : "99999",
        };
        let save = {
            "position" : "absolute",
            "width" : "100%",
            "height" : "100%",
            "zIndex" : "999999",
        };

        var temp_tour = (tournament.current_tour > tournament.tours_count) ? tournament.tours_count : tournament.current_tour;

        const linkTo = {
            href : "/tournament/" + tournament.id + "/tour/" + temp_tour
        };

        return (
            <div className="row position-relative">
                <div className="col-12">
                    <div className="row">
                        <div className="col-md-10">
                            <div {...a}>Статус : {this.state.status}</div>
                        </div>
                        <div className="col-md-2">
                            <a {...linkTo} className="btn btn-primary btn-block btn-lg">К турниру</a>
                        </div>
                    </div>

                </div>
                {/*в команднике без добавления участников убираем список*/}
                <div className="col-sm-3">
                    <input type="text" className="form-control" placeholder="Поиск..."  onChange={this.search} />
                        <div className="list-group mt-2 school-participants">
                            {this.state.tournament.type != 20 && this.state.filtered.map((item, index) => (
                                <a href="" className="list-group-item list-group-item-action" key={index} onClick={this.addParticipant} data-rating={item.tournaments_rating} data-id={item.id}>
                                    {item.name}
                                </a>
                            ))}
                        </div>
                </div>
                <div className="col-sm-9 tournament-participants">
                    <ul className="nav nav-pills nav-fill">
                        <li className="nav-item">
                            <a className="nav-link active" data-id="participants" onClick={this.showTab} id="admin-tab" data-toggle="pill" href="#pills-home" role="tab" aria-controls="pills-home" aria-expanded="true">
                                {(this.state.tournament.type > 10) ?
                                    "Команды"
                                    :
                                    "Участники"
                                }
                            </a>
                        </li>

                        <li className="nav-item">
                            <a className="nav-link" id="students-tab" data-toggle="pill" href="#pills-profile" role="tab" aria-controls="pills-profile" aria-expanded="true" data-id="admins"  onClick={this.showTab}>Администраторы</a>
                        </li>


                        {(this.state.tournament.type > 10) ?
                            <li className="nav-item">
                                <span className="btn btn-success float-right" onClick={this.addTeamModal}>Добавить команду</span>
                            </li>
                            : null}

                        {this.state.tournament.type != 20 ?
                            <li className="nav-item">
                                <span className="btn btn-success float-right" onClick={this.addModal}>Добавить участника</span>
                            </li>
                        : null}
                    </ul>

                    {(this.state.tournament.type > 10 && this.state.current_tab !== "admins") ?
                        <TeamsList setTeam={this.setTeam} tournament={this.state.tournament} removeParticipant={this.removeParticipant} removeTeam={this.removeTeam} teams={this.state.teams} current_team={this.state.current_team} changeOrder={this.changeOrder} />
                        :
                        <ParticipantsListTable  removeParticipant={this.removeParticipant} participants={this.state.participants} />
                    }



                </div>
                {(this.state.tournament.type > 10) ?
                <TeamsInput
                    teachers={this.state.teachers} resetTeam={this.resetTeam} method={this.addTeam} tournament={this.state.tournament}/> : null}

                <div className="modal " id="addEditModal" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="exampleModalLabel"></h5>
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">

                                <div className="alert alert-danger hidden errors"></div>
                                <div className="alert alert-success hidden success">Данные успешно обновлены</div>

                                <ModalInput setAddType={this.setAddType}
                                            current_tab="student"
                                            mode={this.state.mode}
                                            current_type={this.state.current_type}
                                            method={this.method}
                                            teachers={this.state.teachers}
                                            offices={this.state.offices}
                                            current_user={this.state.current_user}/>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-dismiss="modal">Закрыть</button>
                                <button type="button" className="btn btn-primary" id="save_theme">Сохранить</button>
                            </div>
                        </div>
                    </div>
                </div>



                {(this.state.request_sent === true) ?
                    <div className="d-flex align-items-baseline justify-content-center " style={save}>
                        <h1>Сохранение</h1>
                        <div className="" style={fixed}>
                        </div>
                    </div>
                    : null}


            </div>

        );

    }
}

render(
    <Participants/>
    , document.getElementById('participants'));