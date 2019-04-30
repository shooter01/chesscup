import React from 'react';
import {render} from 'react-dom';

class UserTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            users : []
        }
        this.editModal = this.editModal.bind(this);
    }

    editModal(event){
        const target = event.target;
        let id = $(target).attr("data-id");
        this.props.editModal(id);
    }

    render() {
        var users = this.props.data || [];

        var width = {
            width : 10 + "%"
        }

        return (
            <div className="table-responsive">
            <table className="table mt-5">
                <thead>
                    <tr>
                        <th>
                            Имя
                        </th>
                        <th>
                            Email
                        </th>
                        <th>
                            Управление
                        </th>
                    </tr>
                </thead>
                <tbody>
                {users.map((item, index) => (
                    <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.email}</td>
                        <td style={width}>

                                <i className="fa fa-edit btn btn-success"  data-id={index} onClick={this.editModal} ></i>
                                {/*<i className="fa fa-trash btn btn-danger"  data-id={index} onClick={this.editModal} ></i>*/}


                        </td>
                    </tr>
                ))}
                </tbody>

            </table>
            </div>
        );
    }
}

export default UserTable;