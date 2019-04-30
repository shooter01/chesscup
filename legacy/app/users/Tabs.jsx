import React from 'react';
import {render} from 'react-dom';

class AddUser extends React.Component {
    constructor(props) {
        super(props);
        this.showTab = this.showTab.bind(this);
    }
    showTab(event){
        const target = event.target;
        var attr = $(target).attr("data-id");
        this.props.someMethod(attr);
    }
    render() {
        return (
            <div>
                <ul className="nav nav-pills nav-fill">
                    <li className="nav-item">
                        <a className="nav-link active" data-id="admin" onClick={this.showTab} id="admin-tab" data-toggle="pill" href="#pills-home" role="tab" aria-controls="pills-home" aria-expanded="true">Администраторы</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" id="teacher-tab" data-toggle="pill" href="#pills-profile" role="tab" aria-controls="pills-profile" aria-expanded="true" data-id="teacher"  onClick={this.showTab}>Преподаватели</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" id="students-tab" data-toggle="pill" href="#pills-profile" role="tab" aria-controls="pills-profile" aria-expanded="true" data-id="student"  onClick={this.showTab}>Ученики</a>
                    </li>
                    <li className="nav-item">
                        <span className="btn btn-success float-right" onClick={this.props.addModal}>Добавить</span>
                    </li>
                </ul>

            </div>
        );
    }
}

export default AddUser;