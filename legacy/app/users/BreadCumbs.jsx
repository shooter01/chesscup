import React from 'react';
import {render} from 'react-dom';

class BreadCumbs extends React.Component {

    render() {
        return (
            <div className="mt-3">
                <div className="row">
                    <div className="col-lg-12 d-none d-lg-block">
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb">
                                <li className="breadcrumb-item"><a href="/">Home</a></li>
                                <li className="breadcrumb-item"><a href="/spr">Справочники</a></li>
                                <li className="breadcrumb-item active" aria-current="page">Пользователи</li>
                            </ol>
                        </nav>
                    </div>
                </div>
            </div>
        );
    }
}

export default BreadCumbs;