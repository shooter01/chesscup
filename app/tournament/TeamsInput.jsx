import React from 'react';
import {render} from 'react-dom';

class TeamsInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tournament_id : this.props.tournament.id
        };
        this.handleChange = this.handleChange.bind(this);
        this.saveTeam = this.saveTeam.bind(this);
        this.method = this.method.bind(this);
        this.resetTeam = this.resetTeam.bind(this);

    }


    componentDidMount(){
        var self = this;
        $('#tasks_list').on('show.bs.modal', function (e) {
            $(".success").addClass("hidden");
            $(".errors").addClass("hidden");
        });
        $("#save_team").on("click", function () {
            self.saveTeam();
        });


    }

    method(data, respond){
       this.props.method(data, respond);
    }

    resetTeam(){
       this.props.resetTeam();
    }

    saveTeam (event)  {
        var self = this;

        var that = this;

        if (this.state.request_sent != true) {

            var data = {

            };

            $(".success").addClass("hidden").empty();
            $(".errors").addClass("hidden").empty();


            $.ajax({
                url: "/tournament/add_team",
                method: "post",
                timeout : 3000,
                beforeSend : function () {
                    that.setState({
                        request_sent : true,
                    });
                },
                data : {
                    team_name : $("[name=team_name]").val(),
                    teacher_id : $("[name=teacher_id]").val(),
                    tournament_id : this.state.tournament_id,
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
                    $("#addTeamModal").modal("hide");
                    self.method(data);

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
                that.resetTeam();
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

            <div className="modal " id="addTeamModal" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel">Добавление команды</h5>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">

                            <div className="alert alert-danger hidden errors"></div>
                            <div className="alert alert-success hidden success">Данные успешно обновлены</div>

                            <div className="input-group mb-3 ">

                                <form action="" className="col-lg-12" name="myform" id="myform">



                                <div className="input-group mb-3">
                                    <div className="container-fluid">

                                            <div className="row">
                                                <label htmlFor="name" className="col-form-label small">Название команды</label>

                                                <input type="text" id="name" className="form-control" placeholder="Название команды" name="team_name" required="required" aria-describedby="basic-addon2" />
                                            </div>

                                            <div className="row">
                                                <label htmlFor="teacher_id" className="col-form-label small">Тренер</label>
                                                <select name="teacher_id" className="custom-select" id="teacher_id">
                                                    {this.props.teachers.map((item, index) => (
                                                        <option key={item.id} value={item.id}>{item.name}</option>
                                                    ))}
                                                </select>
                                            </div>





                                    </div>

                                </div>

                                </form>
                            </div>


                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-dismiss="modal">Закрыть</button>
                            <button type="button" className="btn btn-primary" id="save_team">Сохранить</button>
                        </div>
                    </div>
                </div>
            </div>
        );

    }
}

export default TeamsInput;