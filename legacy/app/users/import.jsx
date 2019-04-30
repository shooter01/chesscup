import React from 'react';
import {render} from 'react-dom';


class ImportList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            users: [],
            request_sent : false,
        };
    }




    componentDidMount(){
        var that = this;
        $(document).ready(function(){
            var fileuploader = new Html5Upload({
                input: "#myfile",
                upload_url : "/users/import",
                statusContainer: "#container",
                callbacks: {
                    before_send: function(xhr, fd, file){
                        fd.append("test", "testdata");
                    },
                    success: function (response, xhr, responseText) {
                        response.data.shift()
                        that.setState({
                            users : response.data
                        });
                    },
                    error: function (response, xhr, responseText) {
                        alert(response.responseText);
                        $("#myfile").replaceWith($("#myfile").val('').clone(true));
                        fileuploader.fileList = [];
                        $("#container").empty();
                    },
                }});
            fileuploader.setHandler();


            $("body").off("click.save").on("click.save", '.save',function () {
                var self = this;
                if ($(this).hasClass("disabled") ||  !$("#admin_id").val() || !$("#city_id").val()) {
                    alert("Заполните все поля");
                    return false;
                }
                $('#errored').modal({backdrop: 'static', keyboard: false})
                $("#errored").modal('show');
                var task_id = $(this).attr("data-id");
                $.post('/users/import/save', {
                    users : JSON.stringify(that.state.users),
                    teacher_id : $("#admin_id").val(),
                    city_id : $("#city_id").val(),
                }).done(function (data){
                    if (data.status === "ok") {
                        alert("Таблица успешно импортирована");
                        //$(self).attr("disabled", "disabled").addClass("disabled").html("Добавлено");
                    } else {
                        alert(data.msg);
                    }
                }).always(function () {
                    $("#errored").modal('hide');
                });

                return false;
            })
        });
    }

    render() {
        var that = this;
        return (
            <div>

                {(this.state.users.length > 0) ?
                    <div>
                    <div className="alert alert-info">Проверьте корректность данных и соответствие столбцов. Если все корректно сохраните таблицу, если нет - измените xlsx файл.</div>
                        <span className="btn btn-success float-right save">Сохранить</span>
                    </div>
                    : null}

                <table className="table table-responsive">
                    <thead>
                    <tr>
                        <th>
                            Фамилия
                        </th>
                        <th>
                            Имя
                        </th>
                        <th>
                            Пол
                        </th>
                        <th>
                            Родитель
                        </th>
                        <th>
                            Телефон
                        </th>
                        <th>
                            Email
                        </th>
                        <th>
                            Район проживания
                        </th>
                        <th>
                            Школа
                        </th>
                        <th>
                            Дата рождения
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {this.state.users.map((item, index) => (
                        <tr key={index}>
                            <td>{item[0]}</td>
                            <td>{item[1]}</td>
                            <td>{item[2]}</td>
                            <td>{item[3]}</td>
                            <td>{item[4]}</td>
                            <td>{item[5]}</td>
                            <td>{item[6]}</td>
                            <td>{item[7]}</td>
                            <td>{item[8]}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>

            </div>

        );

    }
}

render(
    <ImportList/>
    , document.getElementById('table'));
