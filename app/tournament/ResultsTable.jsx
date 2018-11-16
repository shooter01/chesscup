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

        if(nextProps.value !== this.state.participants){
            this.setState({participants:nextProps.participants});
        }

    }


    render() {


        var width = {
            width : 7 + "%"
        }

        return (
            <div className="table-responsive">

            <table className="table  table-hover table-bordered table-sm">
                <thead className="thead-light">
                    <tr>
                        <th>

                        </th>
                        <th>
                            Имя
                        </th>
                        <th>
                            Points
                        </th>
                        <th>
                            Buhgolz
                        </th>
                        <th>
                            Berger
                        </th>
                        <th>

                        </th>
                    </tr>
                </thead>
                <tbody>
                {this.state.participants.map((item, index) => (
                    <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{item.user_id} {item.name}  {item.is_active === 0 ? <span className="badge badge-danger">bye</span> : null}</td>
                        <td>{item.scores}</td>
                        <td>{item.bh}</td>
                        <td>{item.berger}</td>
                        <td style={width}>
                            <a href=""  data-id={item.user_id}  className="participant fa fa-eye"></a>
                            &nbsp;
                            {item.user_id ? <Link id={item.user_id} /> : null}
                        </td>

                    </tr>
                ))}
                </tbody>

            </table>
            </div>
        );
    }
}


function Link(props) {
    var link = "/users/stat/" + props.id;
    return  <a target="_blank" href={link} className="fa fa-chart-line" ></a>;
}


export default ResultsTable;