import React, {useEffect, useState} from 'react';
import {Line as RcProgressBar} from "rc-progress";
import {
    CHECK_VER,
    CHECK_VER_DIFFERENT,
    UPDATE_FILE_NAME,
    UPDATE_FILE_TOTAL_COUNT,
    UPDATE_FILE_UPDATED_COUNT,
    UPDATE_SUCCESS
} from "../../shared/ipc/constants";
import {listenerCallback} from "../../shared/ipc/subscription";

import './styles/progress-bar.css';

export const ProgressBar = () => {

    const [versionState, setVersionState] = useState<IVersionState>(() => {
        const initVersionState: IVersionState = {
            currentVersion: '',
            updateVersion: '',
            isCheckInit: true
        }

        return initVersionState;
    });
    const [updateState, setUpdateState] = useState<IUpdateState>(() => {
        const initUpdateState: IUpdateState = {
            fileName: "",
            percent: "0",
            isUpdateSuccess: false,
            updatedFileCount: 0,
            totalFileCount: 0,
            isNeedUpdate: false
        }

        return initUpdateState;
    });

    useEffect(() => {
        if (versionState.isCheckInit) {
            //@ts-ignore
            main.updateAPI.sendMessage(CHECK_VER);

            //@ts-ignore
            main.updateAPI.listenerOn(CHECK_VER,
                listenerCallback,
                checkVersionStateCallback);
        }

        // if (updateState.totalFileCount === 0) {
        //     //@ts-ignore
        //     main.updateAPI.sendMessage(UPDATE_FILE_TOTAL_COUNT);
        //
        //     //@ts-ignore
        //     main.updateAPI.listenerOnce(UPDATE_FILE_TOTAL_COUNT,
        //         listenerCallback,
        //         updateTotalCountCallback);
        //
        //
        //     return;
        // }
        //
        // if (updateState.isNeedUpdate) {
        //     console.log('updateState.isNeedUpdate');
        //     //@ts-ignore
        //     main.updateAPI.listenerOnce(UPDATE_FILE_NAME,
        //         listenerCallback,
        //         updateFileNameCallback);
        //
        //     if(updateState.percent === '100') {
        //         setUpdateState((prevState) => {
        //             return {...prevState, fileName: 'Start Now!', isNeedUpdate: false};
        //         });
        //     }
        // }

    });


    const updateTotalCountCallback = (ipcParams: IIpcParams) => {
        const {message} = ipcParams;
        setUpdateState((prevState) => {
            return {
                ...prevState,
                totalFileCount: message.totalFileCount,
                percent: ((0 / message.totalFileCount) * 100).toString()
            };
        });

        //@ts-ignore
        main.updateAPI.sendMessage(UPDATE_FILE_NAME);
        //@ts-ignore
        main.updateAPI.listenerOn(UPDATE_FILE_NAME,
            listenerCallback,
            updateFileNameCallback);

        // if (updateState.percent === '100') {
        //     setUpdateState((prevState) => {
        //         return {...prevState, fileName: 'Start Now!', isNeedUpdate: false};
        //     });
        // }
    };

    const updateFileNameCallback = (ipcParams: IIpcParams) => {
        setUpdateState((prevState) => {
            console.log('updateFileNameCallback');
            prevState.updatedFileCount += 1;
            const percentDouble = (prevState.updatedFileCount / prevState.totalFileCount) * 100;
            const percentString = percentDouble === 100 ? percentDouble.toPrecision(3) : percentDouble.toPrecision(4);
            return {
                ...prevState,
                fileName: ipcParams.message.fileName,
                updatedFileCount: prevState.updatedFileCount,
                percent: percentString
            };
        });
    }

    const checkVersionStateCallback = (ipcParams: IIpcParams) => {
        console.log('checkVersionStateCallback');

        const newVersionState: IVersionState = {
            isCheckInit: false,
            currentVersion: ipcParams.message.currentVersion,
            updateVersion: ipcParams.message.updateVersion
        };
        setVersionState((prevState) => {
            return {...prevState, ...newVersionState};
        });

        if (ipcParams.key === CHECK_VER_DIFFERENT) {
            setUpdateState((prevState) => {
                return {...prevState, isNeedUpdate: true};
            });

            //@ts-ignore
            main.updateAPI.sendMessage(UPDATE_FILE_TOTAL_COUNT);

            //@ts-ignore
            main.updateAPI.listenerOnce(UPDATE_FILE_TOTAL_COUNT,
                listenerCallback,
                updateTotalCountCallback);

        } else {
            setUpdateState((prevState) => {
                return {
                    ...prevState, fileName: 'Start Now!',
                    isNeedUpdate: false, percent: '100'
                };
            });
        }
    }

    return (
        <div className="progress-bar-container">
            <div className="progress-bar__version">
                <span>current version: {versionState.currentVersion}</span>
                {updateState.isNeedUpdate && <span>update version: {versionState.updateVersion}</span>}
            </div>
            <div className={"progress-bar__text"}>
                <span>
                    {updateState.fileName}
                </span>
                <span>
                    {updateState.percent}%
                </span>
            </div>
            <RcProgressBar percent={Number.parseFloat(updateState.percent)} strokeWidth={1.5} trailWidth={1.5}/>
        </div>
    );
};

