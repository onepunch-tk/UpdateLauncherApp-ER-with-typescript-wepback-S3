/**
 * main Browser 진입점*/
import {app, BrowserWindow, Menu} from 'electron';
import {onIpcEvent} from "../shared/ipc/event-main";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const isDev = !app.isPackaged;

if (require('electron-squirrel-startup')) {
    app.quit();
}
const createWindow = (): void => {
    //메인 브라우져 생성
    const mainWindow = new BrowserWindow({
        height: 600,
        width: 800,
        resizable:false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        },
        show:false
    });
    //플랫폼(os)에 따라 툴바 제거
    process.platform === "win32" && mainWindow.removeMenu();
    process.platform === "darwin" && Menu.setApplicationMenu(Menu.buildFromTemplate([]));

    //렌더러 브라우져 오픈(리액트)
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    isDev && mainWindow.webContents.openDevTools();
    mainWindow.once("ready-to-show",()=>{
       mainWindow.show();
    });
};

app.on('ready', () => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

//렌더러 브라우져와 통신하는 이벤트 모듈
onIpcEvent(isDev);



