import React from 'react';
import {render} from 'react-dom';

class ResultsTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            participants : this.props.participants || [],
        }

    }

    componentWillReceiveProps(nextProps){
        console.log(nextProps);

        if(nextProps.value !== this.state.participants){
            this.setState({participants:nextProps.participants});
        }

    }


    render() {

        console.log(this.state.participants);

        return (
            <div className="table-responsive">
                <h5 className="mt-5 ">Текущее положение</h5>
            <table className="table table-hover table-bordered table-sm">
                <thead className="thead-light">
                    <tr>
                        <th>
                            Имя
                        </th>
                        <th>
                            Points
                        </th>
                    </tr>
                </thead>
                <tbody>
                {this.state.participants.map((item, index) => (
                    <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.scores}</td>
                    </tr>
                ))}
                </tbody>

            </table>
            </div>
        );
    }
}


export default ResultsTable;