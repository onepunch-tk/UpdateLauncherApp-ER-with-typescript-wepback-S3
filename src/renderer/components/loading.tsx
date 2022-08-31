import React from 'react';

//css
import './styles/loading.css';

/**
 * loading 컴포넌트 */
export const Loading = () => {
    return (
        <div className="loading-container">
            <div className="loading__circle"></div>
            <div className="loading__text"><p>loading</p></div>
        </div>
    );
};

