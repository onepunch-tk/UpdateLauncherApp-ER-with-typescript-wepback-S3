import React from 'react';
import {Loading} from "../components/loading";
//css
import './styles/home-view.css';
import {ProgressBar} from "../components/progress-bar";

export const HomeViews = () => {
    return (
        <div className="home-view">
            <Loading/>
            <ProgressBar />
        </div>
    );
};
