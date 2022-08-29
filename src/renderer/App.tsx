import React from 'react';
import * as ReactDOM from 'react-dom';
import {HomeViews} from "./views/home-views";

function render() {
    ReactDOM.render(
        <>
            <HomeViews/>
        </>
    ,document.getElementById('root'));
}

render();