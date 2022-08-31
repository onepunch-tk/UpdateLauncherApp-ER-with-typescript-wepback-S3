import {ipcRenderer, contextBridge, IpcRendererEvent} from 'electron';
//렌더러에서 Ipc통신이 가능하도록 공유한다.
contextBridge.exposeInMainWorld('main', {
    //TODO: add custom api...
    updateAPI: {
        //메인 브라우져에 메세지 보내기(채널로 구분 shared/ipc/constants 참조)
        sendMessage(channel: string) {
            ipcRenderer.send(channel);
        },

        /**
         * 리스너 이벤트(1회성)
         * channel:수신 받을 이벤트 채널
         * listenCallback:수신 이벤트 발생시 호출되는 콜백
         * stateCallback: react 상태 업데이트 콜백
         * IIpcParams: 전송되는 데이터 shared/interface 참*/
        listenerOnce(channel: string, listenerCallback: (ipcParams: IIpcParams) => void, stateCallback: (ipcParams: IIpcParams) => void) {
            const subscription = (_e: IpcRendererEvent, args: IIpcParams) => {
                const argument: IIpcParams = {...args, stateCallback};
                return listenerCallback(argument);
            };
            ipcRenderer.once(channel, subscription);
            return () => ipcRenderer.removeListener(channel, subscription);
        },
        /**
         * 리스너 이벤트
         * channel:수신받을 이벤트 채널
         * listenCallback:수신 이벤트 발생시 호출되는 콜백
         * stateCallback: react 상태 업데이트 콜백*/
        listenerOn(channel: string, listenerCallback: (ipcParams: IIpcParams) => void, stateCallback: (ipcParams: IIpcParams) => void) {
            const subscription = (_e: IpcRendererEvent, args: IIpcParams) => {

                const argument: IIpcParams = {...args, stateCallback};
                return listenerCallback(argument);
            };
            ipcRenderer.on(channel, subscription);
        },
        /**
         * 채널에 할당된 모든 리스터 제거*/
        removeAllListeners(channel: string) {
            ipcRenderer.removeAllListeners(channel);
        }
    }
});