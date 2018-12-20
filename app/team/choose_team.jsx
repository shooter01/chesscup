import React from 'react';
import {render} from 'react-dom';


class ChooseTeam extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            teams: this.props.teams,
        }
    }

    componentWillReceiveProps(nextProps){


          if(nextProps.value !== this.props.teams){
            this.setState({
                teams:nextProps.teams,
            });
         }


    }

    render() {
        return (
                <div className="modal" id="chooseTeamModal" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                      <div className="modal-dialog" role="document">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel">Выбор команды</h5>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                              <span aria-hidden="true">&times;</span>
                            </button>
                          </div>
                          <div className="modal-body">

                              <div className="list-group">

                              {

                                  this.state.teams.map((item, index) => (
                                      <a href="#" key={index} data-name={item.team_name} className="list-group-item list-group-item-action choose-team" data-id={item.id}>{item.team_name}</a>
                                  ))

                              }
                              </div>
                          </div>
                          <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                          </div>
                        </div>
                      </div>
                    </div>
        );
    }
}


export default ChooseTeam;





