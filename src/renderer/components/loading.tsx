import React from 'react';

//css
import './styles/loading.css';

export const Loading = () => {
    return (
        <div className="loading-container">
            <div className="loading__circle"></div>
            <div className="loading__text"><p>loading</p></div>
        </div>
    );
};

