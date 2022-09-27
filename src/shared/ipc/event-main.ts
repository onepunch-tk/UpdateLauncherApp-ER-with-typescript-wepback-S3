import path from "path";
import * as exec from 'child_process';
import {ipcMain, app} from "electron";
import {getExtraPath, getExtraUpdatePath} from "../path/extra-path";
import {downloadFiles, getUpdateFiles} from "../../services/aws/s3";
import {RUN_BRAINER_APP, UPDATE_FILE_NAME, UPDATE_FILE_TOTAL_COUNT} from "./constants";
import {getObjectCommandInput, listCommandArray, prefix_main} from "../../services/aws/configures";
import {_Object} from "@aws-sdk/client-s3";

/**
 * 메인 브라우져 ipc 이벤트
 * isDev: 개발환경인지, 프로덕션 환경인지 구분*/
let currentVer: string;
export const onIpcEvent = (isDev: boolean) => {

    /**
     * s3 다운로드 객체*/
    let _objects: _Object[];

    /**
     * 업데이트 진행할 토탈 파일수를 불러온다.*/
    ipcMain.on(UPDATE_FILE_TOTAL_COUNT, async (_e) => {
        /**
         * 다운로드할 객체가 비어있으면 다운로드 객체들을 불러온다*/
        if (!_objects) {
            _objects = await getFiles(isDev);
        }

        /**
         * 다운로드할 객체수 총합 구하기*/
        const totalFileCount = _objects.length;

        /**
         * ipc 전송 데이터 작성*/
        const totalCountParams: IIpcParams = {
            key: UPDATE_FILE_TOTAL_COUNT,
            message: {totalFileCount}
        };

        /**
         * 렌더러 리스너 이벤트 호출*/
        _e.reply(UPDATE_FILE_TOTAL_COUNT, totalCountParams);

    });

    /**
     * 업데이트 시작 이벤트*/
    ipcMain.on(UPDATE_FILE_NAME, async (_e) => {
        //TODO: if current version different update version -> download files
        if (!_objects) {
            _objects = await getFiles(isDev);
        }

        //TODO: 버젼체크후 0.0.0 버젼이면 전부 받고, 그게 아니면 일부 업데이트 방식 추가 예정

        /**
         * 전체 파일 내려받기*/
        for (const content of _objects) {
            const paredPath = path.parse(content.Key);

            const fileNameParams: IIpcParams = {
                key: UPDATE_FILE_NAME,
                message: {fileName: paredPath.base}
            };

            /**
             * 다운로드 총합에 디렉토리까지 딸려오는 현상때문에 걸러 준다...*/
            if (paredPath.base === 'Brainer_Main') {
                _e.reply(UPDATE_FILE_NAME, fileNameParams);
                continue;
            }

            /**
             * 개발자환경인지, 프로덕션 환경인지 따라 다운로드 경로를 가져온다*/
            const {mainUpdatePath} = getExtraUpdatePath(isDev);
            /**
             * s3 다운로드 객체는 prefix(ex) download/Brainer_Main...)를 포함하므로 해당 path를 extra path로 변경*/
            const extraUpdatePath = paredPath.dir.replace(prefix_main, mainUpdatePath);

            /**
             * 파일 다운로드 후, 파일 쓰기*/
            const writeStream = await downloadFiles(getObjectCommandInput(content.Key), extraUpdatePath, paredPath.base, mainUpdatePath)

            /**
             * 파일 쓰기가 완료돠면 호출되는 이벤트 콜백*/
            writeStream.on('finish', () => {
                /**
                 * 파일 다운로드가 완료되면(개당) 파일네임을 렌더러 측에 전송하여, 파일 이름 상태업데이트와 퍼센테이지 상태 업데이트 진행*/
                _e.reply(UPDATE_FILE_NAME, fileNameParams);
            });
        }
    });

    /**
     * 업데이트 완료 후 브레이너 실행 이벤트*/
    ipcMain.on(RUN_BRAINER_APP, async (_e) => {
        const {mainUpdatePath} = getExtraUpdatePath(isDev);

        /**
         * 브레이너 실행, */
        try {
            const cp = exec.spawn(path.join(mainUpdatePath, 'GijangStart.exe'));
            /**
             * 브레이너가 종료되면 launcher도 같이 종료
             * launcher를 미리 종료하면, 브레이너 프로세스가 자식 프로세스이기때문에 같이 꺼져버리는 현상 발생*/
            cp.on('exit', () => {
                app.quit();
            })

        } catch (err) {
            console.error(err);
            app.quit();
        }
    });

    /**
     * 파일 목록 가져오기*/
    const getFiles = async (isDev: boolean) => {
        const {mainUpdatePath, gameUpdatePath} = getExtraUpdatePath(isDev);
        /**
         * prefix - s3 목록 제한. 정해진 루트에서만 목록을 가져온다*/
        const listCommandParams: listCommandArray = [
            {
                Prefix: prefix_main,
                UpdatePath: mainUpdatePath,
            },
        ];
        return await getUpdateFiles(listCommandParams, currentVer, isDev);
    }
};


