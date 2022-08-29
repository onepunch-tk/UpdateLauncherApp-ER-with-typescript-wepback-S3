import {ipcRenderer, contextBridge, IpcRendererEvent} from 'electron';

contextBridge.exposeInMainWorld('main', {
    //TODO: add custom api...
    updateAPI: {
        sendMessage(channel: string) {
            ipcRenderer.send(channel);
        },

        listenerOnce(channel: string, listenerCallback: (ipcParams: IIpcParams) => void, stateCallback: (ipcParams: IIpcParams) => void) {
            const subscription = (_e: IpcRendererEvent, args: IIpcParams) => {
                const argument: IIpcParams = {...args, stateCallback};
                return listenerCallback(argument);
            };
            ipcRenderer.once(channel, subscription);
            return () => ipcRenderer.removeListener(channel, subscription);
        },

        listenerOn(channel: string, listenerCallback: (ipcParams: IIpcParams) => void, stateCallback: (ipcParams: IIpcParams) => void) {
            const subscription = (_e: IpcRendererEvent, args: IIpcParams) => {
                const argument: IIpcParams = {...args, stateCallback};
                return listenerCallback(argument);
            };
            ipcRenderer.on(channel, subscription);
        },

        removeAllListeners(channel: string) {
            ipcRenderer.removeAllListeners(channel);
        }
    }
});