import React, {useEffect, useState} from 'react';
import {Line as RcProgressBar} from "rc-progress";
import {
    CHECK_VER,
    CHECK_VER_DIFFERENT, RUN_RAINER_APP,
    UPDATE_FILE_NAME,
    UPDATE_FILE_TOTAL_COUNT,
    UPDATE_FILE_UPDATED_COUNT,
    UPDATE_SUCCESS
} from "../../shared/ipc/constants";
import {listenerCallback} from "../../shared/ipc/subscription";

import './styles/progress-bar.css';

export const ProgressBar = () => {

    /**
     * 버젼 스테이트 초기화*/
    const [versionState, setVersionState] = useState<IVersionState>(() => {
        const initVersionState: IVersionState = {
            currentVersion: '',
            updateVersion: '',
            isCheckInit: true
        }

        return initVersionState;
    });
    /**
     * 업데이트 정보 스테이트 초기화*/
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
    /**
     * 화면 렌더링이 전부 끝날때 호출되며, state 변경시 호출된다.*/
    useEffect(() => {
        /**
         * 렌더링 완료후 제일처음 버젼체크를 진행*/
        if (versionState.isCheckInit) {
            /**
             * main ipc에 버젼체크 요청*/
            //@ts-ignore
            main.updateAPI.sendMessage(CHECK_VER);

            /**
             * 버젼 체크 리스너 이벤트 등록
             * listenerCallback: 응답받을 리스너 콜백
             * react 상태 업데이트 콜백*/

            //@ts-ignore
            main.updateAPI.listenerOn(CHECK_VER,
                listenerCallback,
                checkVersionStateCallback);
        }

        /**
         * 다운로드 완료 후 호출*/
        if(updateState.percent === '100' && !updateState.isUpdateSuccess) {
            /**
             * update 정보 스테이트 변경 - 시작 가능 상태로*/
            setUpdateState((prevState)=> {
               return {...prevState, fileName:'Start Now!', isNeedUpdate:false, isUpdateSuccess:true}
            });

            /**
             * 버젼 스테이트 변경 - 업데이트된 버젼으로 적용*/
            setVersionState((prevState)=>{
                return {...prevState, currentVersion:prevState.updateVersion};
            })

            /**
             * main ipc에 브레이너를 시작하라고 요청*/
            //@ts-ignore
            main.updateAPI.sendMessage(RUN_RAINER_APP);
        }
    });

    /**
     * 다운로드할 총 개수 상태 업데이트 콜백*/
    const updateTotalCountCallback = (ipcParams: IIpcParams) => {
        const {message} = ipcParams;
        /**
         * main ipc에서 전달받은 파일 총갯수로 퍼센테이지 업데이트*/
        setUpdateState((prevState) => {
            return {
                ...prevState,
                totalFileCount: message.totalFileCount,
                percent: ((0 / message.totalFileCount) * 100).toString()
            };
        });

        /**
         * main ipc에 다운로드 하라고 요청*/
        //@ts-ignore
        main.updateAPI.sendMessage(UPDATE_FILE_NAME);

        /**main에서 파일을 다운로드하고 쓰기가 완료되면 호출하는 리스너 이벤트*/
        //@ts-ignore
        main.updateAPI.listenerOn(UPDATE_FILE_NAME,
            listenerCallback,
            updateFileNameCallback);
    };

    /**
     * 업데이트 상태 변경 콜백*/
    const updateFileNameCallback = (ipcParams: IIpcParams) => {
        /**
         * 프로그레스바 퍼센테이트 변경 및 다운로드 파일 이름 변경*/
        setUpdateState((prevState) => {
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
    /**
     * 버젼 상태 변경 콜백*/
    const checkVersionStateCallback = (ipcParams: IIpcParams) => {
        console.log('checkVersionStateCallback');

        /**
         * 해당 메서드가 호출됐으면 maind에서 버젼체크가 끝났으므로 isCheckInit을 false로 만들어 버젼체크를 더 진행하지 않는다*/
        const newVersionState: IVersionState = {
            isCheckInit: false,
            currentVersion: ipcParams.message.currentVersion,
            updateVersion: ipcParams.message.updateVersion
        };

        /**
         * 버젼 스테이트 변경*/
        setVersionState((prevState) => {
            return {...prevState, ...newVersionState};
        });

        /**
         * 만약 현재 버젼과 업데이트 버젼이 다르다면, 업데이트 스테이트 변경을 통해 update version ui 활성*/
        if (ipcParams.key === CHECK_VER_DIFFERENT) {
            setUpdateState((prevState) => {
                return {...prevState, isNeedUpdate: true};
            });

            /**파일 총개수룰 요청하면 응답을 받는 리스너 이벤트*/
            //@ts-ignore
            main.updateAPI.listenerOnce(UPDATE_FILE_TOTAL_COUNT,
                listenerCallback,
                updateTotalCountCallback);
            /**
             * 업데이트할 파일의 총갯수를 main ipc에 한번만 요청한다*/
            //@ts-ignore
            main.updateAPI.sendMessage(UPDATE_FILE_TOTAL_COUNT);

        } else {
            /**
             * 버젼이 같다면 바로 브레이너 실행 요청*/
            setUpdateState((prevState) => {
                return {
                    ...prevState, fileName: 'Start Now!',
                    isNeedUpdate: false, percent: '100',isUpdateSuccess:true
                };
            });

            //@ts-ignore
            main.updateAPI.sendMessage(RUN_RAINER_APP);
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

