/**
 * app’s resources directory (Contents/Resources for MacOS, resources for Linux and Windows).
 * */
import * as path from "path";

const MAIN_ROOT: string = __dirname;
export const EXTRA_PATH_DEV: string = path.join(MAIN_ROOT, '../../src/extraResources');
export const MACOS_EXTRA_PATH_PROD: string = path.join(MAIN_ROOT, '../../../extraResources');
export const WIN32_EXTRA_PATH_PROD: string = path.join(MAIN_ROOT, '../../../extraResources');

export const getExtraPath = (isDev: boolean) => {
    /*'aix' 'darwin' 'freebsd' 'linux' 'openbsd' 'sunos' 'win32*/
    return isDev ? EXTRA_PATH_DEV :
        (process.platform === 'darwin') ? MACOS_EXTRA_PATH_PROD : WIN32_EXTRA_PATH_PROD;
}

export const getExtraUpdatePath = (isDev:boolean) => {
    const mainUpdatePath = path.join(getExtraPath(isDev), 'Brainer_Main');
    const gameUpdatePath = path.join(mainUpdatePath, 'GijangStart_Data/StreamingAssets/Brainer_New');

    return {mainUpdatePath, gameUpdatePath};
}

