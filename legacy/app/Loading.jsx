import React from 'react';

class Loading extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        var spanStyle = {
            width: 100 + "%"
        };
        return (

            <div>
                <h3>Сохраняется....</h3>
                <div className="progress">
                    <div className="progress-bar progress-bar-striped progress-bar-animated"
                         role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100" style={spanStyle}></div>
                </div>

            </div>
        );
    }

}

export default Loading;