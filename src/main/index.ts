import {app, BrowserWindow} from 'electron';
import {onIpcEvent} from "../shared/ipc/event-main";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const isDev = !app.isPackaged;

if (require('electron-squirrel-startup')) {
    app.quit();
}
const createWindow = (): void => {
    const mainWindow = new BrowserWindow({
        height: 600,
        width: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        },
    });

    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    isDev && mainWindow.webContents.openDevTools();
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
console.log(process.env.S3_ACCESS_KEY);
console.log(process.env.S3_SECRET_KEY);
onIpcEvent(isDev);



