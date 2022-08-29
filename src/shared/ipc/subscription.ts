
export const listenerCallback = (ipcParams:IIpcParams) => {
    const {stateCallback} = ipcParams;
    stateCallback(ipcParams);
}


