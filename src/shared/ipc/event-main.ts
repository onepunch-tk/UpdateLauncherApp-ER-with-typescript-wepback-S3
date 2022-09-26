import {ipcMain, app} from "electron";
import {getExtraPath, getExtraUpdatePath} from "../path/extra-path";
import {downloadFiles, getUpdateFiles} from "../../services/aws/s3";
import {jsonReadAsync, jsonWriteAsync} from "../../services/aws/file-stream";
import path from "path";
import {_Object} from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as exec from 'child_process';
import {
    CHECK_VER,
    CHECK_VER_DIFFERENT,
    CHECK_VER_SAME, RUN_RAINER_APP,
    UPDATE_FILE_NAME,
    UPDATE_FILE_TOTAL_COUNT
} from "./constants";
import {
    getObjectCommandInput,
    listCommandArray,
    prefix_main,
    releaseJsonKey
} from "../../services/aws/configures";

/**
 * 메인 브라우져 ipc 이벤트
 * isDev: 개발환경인지, 프로덕션 환경인지 구분*/
let currentVer: string;
export const onIpcEvent = (isDev: boolean) => {

    /**
     * s3 다운로드 객체*/
    let _objects: _Object[];

    /**
     * 버젼체크 이벤트
     * */
    ipcMain.on(CHECK_VER, async (_e) => {
        /**
         * extra root path*/
        const extraPath = getExtraPath(isDev);

        /**
         *extra root path에서 release.json 파일 읽어온다 */
        const releaseJson = await jsonReadAsync(path.join(
            extraPath, 'release.json')
        );

        /**
         * s3 버켓에서 release.json 파일을 다운로드 한후, update.json으로 extra root path에 저장*/
        const writeStream = await downloadFiles(getObjectCommandInput(releaseJsonKey), extraPath, 'update.json');

        /**
         * writeStream 이벤트콜백(실제로 파일이 update.json이 정상적으로 쓰기가 끝나면 발생.*/
        writeStream.on('finish', async () => {
            /**
             * update.json에서 update 정보 읽기*/
            const updateJson = await jsonReadAsync(path.join(
                extraPath, 'update.json')
            );

            /**
             * ipc 전송 데이터 작성*/
            const checkVerParams: IIpcParams = {
                key: releaseJson.ver === updateJson.ver ? CHECK_VER_SAME : CHECK_VER_DIFFERENT,
                message: {currentVersion: releaseJson.ver, updateVersion: updateJson.ver}
            }
            currentVer = releaseJson.ver;
            /**
             * 렌더러 리스너 이벤트 호출*/
            _e.reply(CHECK_VER, checkVerParams);
        });

    });

    /**
     * 업데이트 진행할 토탈 파일수를 불러온다.*/
    ipcMain.on(UPDATE_FILE_TOTAL_COUNT, async (_e) => {
        /**
         * 다운로드할 객체가 비어있으면 다운로드 객체들을 불러온다*/
        if (!_objects) {
            console.log('UPDATE_FILE_TOTAL_COUNT');
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
                console.log('success');
                /**
                 * 파일 다운로드가 완료되면(개당) 파일네임을 렌더러 측에 전송하여, 파일 이름 상태업데이트와 퍼센테이지 상태 업데이트 진행*/
                _e.reply(UPDATE_FILE_NAME, fileNameParams);
            });
        }
    });

    /**
     * 업데이트 완료 후 브레이너 실행 이벤트*/
    ipcMain.on(RUN_RAINER_APP, async (_e) => {
        const extraPath = getExtraPath(isDev);
        /**
         * update.json에서 업데이트 정보를 읽어온다.*/
        const {ver, date} = await jsonReadAsync(path.join(
            extraPath, 'update.json')
        );

        /**
         * release.json에 업데이트된 정보 쓰기*/
        await jsonWriteAsync(path.join(extraPath, 'release.json'), {ver, date});

        const {mainUpdatePath} = getExtraUpdatePath(isDev);

        /**
         * update.json 제거*/
        fs.unlink(path.join(extraPath, 'update.json'), (err) => {
            //
        })
        // spawn(path.join(mainUpdatePath, 'GijangStart.exe'));

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


