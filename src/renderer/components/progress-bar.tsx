import React, {useEffect, useState} from 'react';
import {Line as RcProgressBar} from "rc-progress";
import {
    RUN_BRAINER_APP,
    UPDATE_FILE_NAME, UPDATE_FILE_TOTAL_COUNT,
} from "../../shared/ipc/constants";
import {listenerCallback} from "../../shared/ipc/subscription";

import './styles/progress-bar.css';

interface IUpdateState {
    fileName: string;
    percent: string;
    isUpdateSuccess: boolean;
    updatedFileCount: number;
    totalFileCount: number;
}

const useStart = (changeState: IUpdateState, setMethod: React.Dispatch<React.SetStateAction<IUpdateState>>) => {
    setMethod((prevState) => {
        const {fileName, isUpdateSuccess, percent} = changeState;
        return {...prevState, fileName, isUpdateSuccess, percent};
    });

    //@ts-ignore
    /**
     * main ipc에 브레이너를 시작하라고 요청*/
    //@ts-ignore
    main.updateAPI.sendMessage(RUN_BRAINER_APP);
}

export const ProgressBar = () => {
    /**
     * 업데이트 정보 스테이트 초기화*/
    const [updateState, setUpdateState] = useState<IUpdateState>({
        fileName: "",
        percent: "0",
        isUpdateSuccess: false,
        updatedFileCount: 0,
        totalFileCount: 0,
    });

    const [initState, setInitState] = useState<boolean>(false);
    /**
     * 화면 렌더링이 전부 끝날때 호출되며, state 변경시 호출된다.*/
    useEffect(() => {

        //@ts-ignore
        main.updateAPI.listenerOnce(UPDATE_FILE_TOTAL_COUNT,updateTotalCountCallback);

        if (!initState) {
            //@ts-ignore
            main.updateAPI.sendMessage(UPDATE_FILE_TOTAL_COUNT);
            setInitState(true);
        }

        /**
         * 다운로드 완료 후 호출*/
        if (updateState.percent === '100' && !updateState.isUpdateSuccess) {
            useStart({
                ...updateState,
                fileName: "Start Now!!",
                isUpdateSuccess: true,
                percent:"100"
            }, setUpdateState);
        }
    }, [updateState]);

    /**
     * 다운로드할 총 개수 상태 업데이트 콜백*/
    const updateTotalCountCallback = (ipcParams: IIpcParams) => {
        const {message} = ipcParams;

        if (message.totalFileCount === 0) {
            console.log("updateTotalCountCallback");

            useStart({
                ...updateState,
                fileName: "Start Now!!",
                isUpdateSuccess: true,
                percent:"100"
            }, setUpdateState);
            return;
        }
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

    return (
        <div className="progress-bar-container">

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

