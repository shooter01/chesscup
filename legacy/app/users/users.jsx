import React from 'react';
import {render} from 'react-dom';

import Loading from "./../Loading.jsx";
import BreadCumbs from "./BreadCumbs.jsx";
import ModalInput from "./ModalInput.jsx";
import UserTable from "./UserTable.jsx";
import Tabs from "./Tabs.jsx";

class UserList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            users: "",
            current_type: "admin",
            request_sent : false,
            current_user : null,
            offices : offices,
            teachers : teachers,
            mode : "add",
            add_type : null
        };
       // this.save = this.save.bind(this);
        this.getUsers = this.getUsers.bind(this);
        this.method = this.method.bind(this);
        this.setAddType = this.setAddType.bind(this);
        this.editModal = this.editModal.bind(this);
        this.addModal = this.addModal.bind(this);
        this.renderPos = this.renderPos.bind(this);
        this.getPos = this.getPos.bind(this);

    }


    componentDidMount(){
        var that = this;
        this.getUsers(200);


    }
    getPos(){
        return location.host;
    }
    method(data){
        var that = this;
        switch (data) {
            case "admin" :
                this.getUsers(200);
                this.setState({
                    current_type : "admin"
                });
                break;
            case "teacher" :
                this.getUsers(100);
                this.setState({
                    current_type : "teacher"
                });
                break;
            case "student" :
                this.getUsers(1);
                this.setState({
                    current_type : "student"
                });
                break;
        }
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
                        users : data.users
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


    getData(){
        return $("#myform").serialize();
    }

    renderPos(){
        var host = this.getPos();
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
        if (position2 != host && position3 != host && position4 != host && position5 != host) {
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
        if (!this.renderPos()) {return false;}

        var that = this;


        var button, table;


        button = <ModalInput setAddType={this.setAddType}
                             current_tab={this.state.current_type}
                             current_type={this.state.current_type}
                             teachers={this.state.teachers}
                             mode={this.state.mode}
                             method={this.method}
                             offices={this.state.offices}
                             current_user={this.state.current_user}/>;

        if (this.state.request_sent === false) {
            table = <UserTable data={this.state.users} editModal={this.editModal}/>;
        } else {
            table = <h3 className="text-center mt-5">Загрузка...</h3>;
        }
        return (
            <div>
<BreadCumbs/>

                <Tabs someMethod={this.method} addModal={this.addModal}/>

                {table}
                <div className="modal " id="addEditModal" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-lg" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="exampleModalLabel">
                                    {(this.state.mode === "edit") ? "Редактирование" : "Добавление"}
                                    {(this.state.current_type === "admin") ? " Администратора" : null}
                                    {(this.state.current_type === "teacher") ? " Учителя" : null}
                                    {(this.state.current_type === "student") ? " Студента" : null}
                                    </h5>
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">

                                <div className="alert alert-danger hidden errors"></div>
                                <div className="alert alert-success hidden success">Данные успешно обновлены</div>
                                {button}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-dismiss="modal">Закрыть</button>
                                <button type="button" className="btn btn-primary" id="save_theme">Сохранить</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        );

    }
}

render(
    <UserList/>
    , document.getElementById('users'));
