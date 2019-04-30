import React from 'react';
import {render} from 'react-dom';

class ModalInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            current_tab : this.props.current_tab,
            current_user : this.props.current_user,
            current_type : this.props.current_type,
            mode : this.props.mode,
        };
        this.handleChange = this.handleChange.bind(this);
        this.saveUser = this.saveUser.bind(this);
        this.method = this.method.bind(this);

    }


    componentDidMount(){
        var self = this;
        $('#tasks_list').on('show.bs.modal', function (e) {
            $(".success").addClass("hidden");
            $(".errors").addClass("hidden");
        });
        $("#save_theme").on("click", function () {
            self.saveUser();
        });


    }
    method(data, respond){
       this.props.method(data, respond);
    }

    saveUser (event)  {
        var self = this;

        var that = this;

        if (this.state.request_sent != true) {

            var data = {

            };

            $(".success").addClass("hidden").empty();
            $(".errors").addClass("hidden").empty();

            const roles = {
                "admin" : "200",
                "student" : "1",
                "teacher" : "100",
            };
            let url = (this.props.mode === "add") ? "/users/save_user" : "/users/update_user";
            //var data = this.getData();
            $.ajax({
                url: url,
                method: "post",
                timeout : 3000,
                beforeSend : function () {
                    that.setState({
                        request_sent : true,
                    });
                },
                data : {
                    email : (this.props.mode === "add" || (this.props.mode === "edit" && that.props.current_user.email != $("[name=email]").val())) ? $("[name=email]").val() : "null",
                    password : $("[name=password]").val(),
                    name : $("[name=name]").val(),
                    user_id : (that.props.mode === "edit") ? that.state.current_user.id : null,

                    phone : $("[name=phone]").val(),
                    role : roles[this.props.current_type] || 1,
                    rating : $("[name=rating]").val(),
                    tournaments_rating : $("[name=tournaments_rating]").val(),
                    sex : $("[name=sex]").val(),
                    parent_name : $("[name=parent_name]").val(),
                    district : $("[name=district]").val(),
                    birth_date : $("[name=birth_date]").val(),
                    teacher_id : $("[name=teacher_id]").val(),
                    office_id : $("[name=office_id]").val(),
                    current_type : this.props.current_type,
                },
                statusCode: {
                    404: function() {
                        alert( "page not found" );
                    }
                }
            }).done(function (data) {
                if (data.status != "ok") {
                    $(".errors").removeClass("hidden");
                    for (var obj in data.errors) {
                        $(".errors").append(data.errors[obj].msg);
                    }
                } else {
                    $("#addEditModal").modal("hide");
                    self.method(that.props.current_type, data);

                }

            }).fail(function ( data, jqXHR, textStatus ) {
                $(".errors").removeClass("hidden");
                if (data) {
                    for (var obj in data.responseJSON.errors) {
                        $(".errors").append(data.responseJSON.errors[obj].msg + "<br/>");

                    }
                } else {
                    alert("Ошибка сохранения");
                }

            }).always(function () {
                that.setState({
                    request_sent : false
                });
            });

        }
    }

    handleChange(event) {
        this.setState({
            current_user: {
                name : event.target.value
            }
        });
    }

    componentWillReceiveProps(nextProps){
        if(nextProps.value !== this.props.current_user){
            this.setState({current_tab:nextProps.current_tab});
        }

        if(nextProps.value !== this.props.current_user){
            this.setState({current_user:nextProps.current_user});
        }


    }

    render() {

        return (

            <div className="input-group mb-3 ">

                <form action="" className="col-lg-12" name="myform" id="myform">

                {(this.state.current_tab != null) ?

                <div className="input-group mb-3">
                    <div className="container-fluid">

                            <div className="row">
                                <label htmlFor="name" className="col-form-label small">{_Name}</label>

                                <input type="text" id="name" className="form-control" placeholder={_Name} name="name" required="required" aria-describedby="basic-addon2" />
                            </div>

                            <div className="row">
                                <label htmlFor="rating" className="col-form-label small">{_Rating}</label>

                                <input type="text"  className="form-control" defaultValue="1200"  placeholder={_Rating}
                                       name="tournaments_rating"  />
                            </div>




                        <hr/>
                            {(this.state.current_tab == "student") ?
                            <div className="row">
                              {/*  <div className="col-6">

                                    <div className="row">
                                        <label htmlFor="email" className="col-form-label small">Email</label>

                                        <input type="text" id="email" className="form-control " placeholder="Email" name="email" aria-describedby="basic-addon2" />
                                    </div>

                                    <div className="row">
                                        <label htmlFor="parent_name" className="col-form-label small">Пароль</label>

                                        <input type="text" id=""  className="form-control " placeholder="Введите пароль" name="password" aria-describedby="basic-addon2" />
                                    </div>




                                    <div className=" row">
                                        <label htmlFor="birth_date" className="col-form-label small">Дата рождения</label>
                                        <input type="text" id="birth_date" className="form-control"  placeholder="Дата рождения"
                                               aria-label="Recipient's username" name="birth_date" aria-describedby="basic-addon2" />
                                    </div>

                                    <div className=" row">
                                        <label htmlFor="district" className="col-form-label small">Район проживания</label>
                                        <input type="text" id="district" className="form-control"  placeholder="Район проживания"
                                               aria-label="Recipient's username" name="district" aria-describedby="basic-addon2" />
                                    </div>
                                </div>*/}
                                <div className="col-5 ml-1">
                                    {/*<div className="row">
                                        <label htmlFor="sex" className="col-form-label small">Пол</label>
                                        <select name="sex" className="custom-select" id="sex">
                                            <option value="1">Мужской</option>
                                            <option value="0">Женский</option>
                                        </select>
                                    </div>

                                    <div className="row">
                                        <label htmlFor="teacher_id" className="col-form-label small">Учитель</label>
                                        <select name="teacher_id" className="custom-select" id="teacher_id">
                                            {this.props.teachers.map((item, index) => (
                                                <option key={item.id} value={item.id}>{item.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="row">
                                        <label htmlFor="parent_name" className="col-form-label small">ФИО родителей</label>
                                        <input type="text"  id="parent_name" className="form-control" placeholder="ФИО родителей"
                                               aria-label="Recipient's username" name="parent_name" aria-describedby="basic-addon2" />
                                    </div>

                                    <div className=" row">
                                        <label htmlFor="phone" className="col-form-label small">Контакты родителей</label>
                                        <input type="text" id="phone" className="form-control"  placeholder="Контакты родителей"
                                               aria-label="Recipient's username" name="phone" aria-describedby="basic-addon2" />
                                    </div>
*/}
                                    {/*<div className="row">
                                        <label htmlFor="office_id" className="col-form-label small">Учреждение</label>
                                        <select name="office_id" className="custom-select" id="office_id">
                                            {this.props.offices.map((item, index) => (
                                                <option key={item.id} value={item.id}>{item.text}</option>
                                            ))}
                                        </select>
                                    </div>*/}


                                    {/*<div className="row">
                                        <label htmlFor="rating" className="col-form-label small">Рейтинг по задачам</label>

                                        <input type="text"  className="form-control" defaultValue="1200" placeholder="Рейтинг"
                                               name="rating"  />
                                    </div>*/}
                                </div>
                            </div>
                                :
                                null
                            }

                    </div>

                </div>
                    : null}
                </form>
            </div>
        );

    }
}

export default ModalInput;