import React from 'react';
import {render} from 'react-dom';


class UserResults extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pairs: this.props.user_pairs,
            user_id: this.props.user_id,
        }
    }
    componentDidMount(){
        var that = this;
    }

    componentWillReceiveProps(nextProps){


      //  if(nextProps.value !== this.props.pairs){
            this.setState({
                pairs:nextProps.user_pairs,
                user_id:nextProps.user_id,
            });
       // }


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

        var selected = {
            style : "participant"
        };

        return (
            <div className="position-relative">
                <table className="table table-hover table-bordered table-sm">
                    <thead className="thead-dark">
                    <tr>
                        <th  scope="col" className="text-center" style={w5}><span className="d-none d-sm-block">{_Tour}</span></th>
                        <th  scope="col" className="text-center"  style={w30}>{_Name}</th>
                        <th  scope="col" className="text-center" style={w5}><span className="d-none d-sm-block">{_Points}</span></th>
                        <th  scope="col" className="text-center" style={w12}><span className="d-none d-sm-block">{_Result}</span></th>
                        <th  scope="col" className="text-center" style={w5}><span className="d-none d-sm-block">{_Points}</span></th>
                        <th  scope="col" className="text-center" style={w30}>{_Name}</th>
                    </tr>
                    </thead>

                    <tbody>
                    {this.state.pairs.map((item, index) => (
                        <tr key={index}>
                            <td className="text-center">{item.tour}</td>
                            <td data-id={item.p1_id}  className={this.state.user_id == item.p1_id ? "participant bg-success" : ""}>{item.p1_name} <span className="badge badge-dark">{item.p1_rating_for_history}</span>  {(item.rating_change_p1 > 0) ? <span className="badge badge-success">+{item.rating_change_p1}</span> : <span className="badge badge-danger">{item.rating_change_p1}</span>}</td>
                            <td className="text-center"><span className="d-none d-sm-block">{item.p1_scores}</span></td>
                            <td className="text-center">

                                <div>{item.p1_won} - {item.p2_won}</div>

                                <span className="badge"></span></td>
                            <td className="text-center"><span className="d-none d-sm-block">{item.p2_scores}</span></td>
                            <td data-id={item.p2_id}  className={this.state.user_id == item.p2_id ? "participant bg-success" : ""}>{item.p2_name}  <span className="badge badge-dark">{item.p2_rating_for_history}</span> {(item.rating_change_p2 > 0) ? <span className="badge badge-success">+{item.rating_change_p2}</span> : <span className="badge badge-danger">{item.rating_change_p2}</span>}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>

            </div>

        );

    }
}

export default UserResults;
