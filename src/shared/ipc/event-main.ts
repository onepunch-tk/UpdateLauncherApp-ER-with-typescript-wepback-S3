import {ipcMain, Notification} from "electron";
import {
    CHECK_VER,
    CHECK_VER_DIFFERENT,
    CHECK_VER_SAME,
    UPDATE_FILE_NAME,
    UPDATE_FILE_TOTAL_COUNT, UPDATE_FILE_UPDATED_COUNT,
    UPDATE_SUCCESS
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
import {fileWriteAsync, jsonReadAsync} from "../../services/aws/file-stream";
import path from "path";
import {_Object} from "@aws-sdk/client-s3";

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

        const totalFileCount: number = _objects[0].length + _objects[1].length;
        const totalCountParams: IIpcParams = {
            key: UPDATE_FILE_TOTAL_COUNT,
            message: {totalFileCount}
        };
        _e.reply(UPDATE_FILE_TOTAL_COUNT, totalCountParams);

    });
    ipcMain.on(UPDATE_FILE_NAME, async (_e) => {
        //TODO: if current version different update version -> download files
        if (!_objects) {
            console.log('UPDATE_FILE_NAME');
            _objects = await getFiles(isDev);
        }

        for (const contents of _objects) {
            for (const content of contents) {
                const paredPath = path.parse(content.Key);
                const {mainUpdatePath, gameUpdatePath} = getExtraUpdatePath(isDev);

                const extraUpdatePath = content.Key.includes(prefix_main) ?
                    paredPath.dir.replace(prefix_main, mainUpdatePath) :
                    paredPath.dir.replace(prefix_game, gameUpdatePath);

                const rootPath = content.Key.includes(prefix_main) ? mainUpdatePath : gameUpdatePath;
                await downloadFiles(getObjectCommandInput(content.Key), extraUpdatePath, paredPath.base,rootPath);
                await sleep(200);

                const fileNameParams: IIpcParams = {
                    key: UPDATE_FILE_NAME,
                    message: {fileName: paredPath.base}
                };
                _e.reply(UPDATE_FILE_NAME, fileNameParams);
            }
        }
    });

    const getFiles = async (isDev: boolean) => {
        const {mainUpdatePath, gameUpdatePath} = getExtraUpdatePath(isDev);
        const listCommandParams: listCommandArray = [
            {
                Prefix: prefix_main,
                UpdatePath: mainUpdatePath,
            },
            {
                Prefix: prefix_game,
                UpdatePath: gameUpdatePath,
            }
        ];
        return await listFiles(listCommandParams);
    }

    function sleep(ms: number) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
};

