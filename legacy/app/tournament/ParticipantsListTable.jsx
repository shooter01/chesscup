import React from 'react';
import {render} from 'react-dom';


class ParticipantsListTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            participants: this.props.participants,
            tournament: this.props.tournament,
        }
        this.removeParticipant = this.removeParticipant.bind(this);

    }
    componentDidMount(){
        var that = this;
    }

    removeParticipant(event){
        event.preventDefault();
        var that = this;

        var $target = $(event.target);
        var id = $target.data("id");

        if (id) {
            this.props.removeParticipant(event);
        }

    }

    componentWillReceiveProps(nextProps){


      //  if(nextProps.value !== this.props.pairs){
            this.setState({
                participants:nextProps.participants,
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

        let deleteBtn = {
            "padding" : "1px 6px"
        };

        return (
            <table className="table mt-3 table-sm table-hover">
               {/* <thead className="thead-dark">
                <tr>
                    <th scope="col" className="text-center" style={w5}></th>
                    <th scope="col" className="text-center">Имя</th>
                    <th scope="col" className="text-center">Email</th>
                    <th scope="col" className="text-center">Управление</th>
                </tr>
                </thead>*/}
                <tbody>

                {

                    this.state.participants.map((item, index) => (
                        <tr key={index}>
                            <td>
                                <small>{index + 1}</small>
                            </td>
                            <td>{item.name} <span className="badge badge-dark">{item.tournaments_rating}</span></td>

                            <td className="text-center">
                                {(!tournament.is_online) ? <span className="btn btn-danger font-weight-bold"
                                                                 data-id={item.id} style={deleteBtn}
                                                                 onClick={this.removeParticipant}>x</span> : null }

                            </td>
                        </tr>
                    ))

                }



                </tbody>
            </table>

        );

    }
}

export default ParticipantsListTable;
