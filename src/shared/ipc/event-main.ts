import {ipcMain, app} from "electron";
import {
    CHECK_VER,
    CHECK_VER_DIFFERENT,
    CHECK_VER_SAME, RUN_RAINER_APP,
    UPDATE_FILE_NAME,
    UPDATE_FILE_TOTAL_COUNT
} from "./constants";
import {getExtraPath, getExtraUpdatePath} from "../path/extra-path";
import {downloadFiles, listFiles} from "../../services/aws/s3";
import {
    getObjectCommandInput,
    listCommandArray,
    prefix_game,
    prefix_main,
    releaseJsonKey
} from "../../services/aws/configures";
import {jsonReadAsync, jsonWriteAsync} from "../../services/aws/file-stream";
import path from "path";
import {_Object} from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as exec from 'child_process';

export const onIpcEvent = (isDev: boolean) => {
    let _objects: _Object[][];

    ipcMain.on(CHECK_VER, async (_e) => {
        //TODO: read release.json from aws s3
        const extraPath = getExtraPath(isDev);
        const releaseJson = await jsonReadAsync(path.join(
            extraPath, 'release.json')
        );

        await downloadFiles(getObjectCommandInput(releaseJsonKey), extraPath, 'update.json');
        await sleep(500);
        const updateJson = await jsonReadAsync(path.join(
            extraPath, 'update.json')
        );

        const checkVerParams: IIpcParams = {
            key: releaseJson.ver === updateJson.ver ? CHECK_VER_SAME : CHECK_VER_DIFFERENT,
            message: {currentVersion: releaseJson.ver, updateVersion: updateJson.ver}
        }

        _e.reply(CHECK_VER, checkVerParams);

    });

    ipcMain.on(UPDATE_FILE_TOTAL_COUNT, async (_e) => {
        if (!_objects) {
            console.log('UPDATE_FILE_TOTAL_COUNT');
            _objects = await getFiles(isDev);
        }

        let totalFileCount =  0;
        for (const contents of _objects) {
            totalFileCount += contents.length;
        }
        const totalCountParams: IIpcParams = {
            key: UPDATE_FILE_TOTAL_COUNT,
            message: {totalFileCount}
        };
        _e.reply(UPDATE_FILE_TOTAL_COUNT, totalCountParams);

    });
    ipcMain.on(UPDATE_FILE_NAME, async (_e) => {
        //TODO: if current version different update version -> download files
        if (!_objects) {
            _objects = await getFiles(isDev);
        }

        for (const contents of _objects) {
            for (const content of contents) {
                if(content.Key === prefix_main) continue;
                const paredPath = path.parse(content.Key);
                const {mainUpdatePath} = getExtraUpdatePath(isDev);
                const extraUpdatePath = paredPath.dir.replace(prefix_main, mainUpdatePath);
                const rootPath = mainUpdatePath;

                await downloadFiles(getObjectCommandInput(content.Key), extraUpdatePath, paredPath.base, rootPath);
                await sleep(200);

                const fileNameParams: IIpcParams = {
                    key: UPDATE_FILE_NAME,
                    message: {fileName: paredPath.base}
                };
                _e.reply(UPDATE_FILE_NAME, fileNameParams);
            }
        }
    });

    ipcMain.on(RUN_RAINER_APP, async (_e) => {
        const extraPath = getExtraPath(isDev);
        const {ver, date} = await jsonReadAsync(path.join(
            extraPath, 'update.json')
        );

        await jsonWriteAsync(path.join(extraPath, 'release.json'), {ver, date});
        await sleep(1000);

        const {mainUpdatePath} = getExtraUpdatePath(isDev);

        fs.unlink(path.join(extraPath, 'update.json'), (err) => {
            console.log(err);
        })
        // spawn(path.join(mainUpdatePath, 'GijangStart.exe'));
        try {
            const cp = exec.spawn(path.join(mainUpdatePath, 'GijangStart.exe'));
            cp.on('exit', ()=> {
                app.quit();
            })

        } catch (err) {
            console.error(err);
            app.quit();
        }
    });

    const getFiles = async (isDev: boolean) => {
        const {mainUpdatePath, gameUpdatePath} = getExtraUpdatePath(isDev);
        const listCommandParams: listCommandArray = [
            {
                Prefix: prefix_main,
                UpdatePath: mainUpdatePath,
            },
        ];
        return await listFiles(listCommandParams);
    }

    const sleep = async (ms: number) => {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
};

