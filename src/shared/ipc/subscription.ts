/**
 * 렌더러에서 등록한 ipc 리스너 콜백
 * main 이벤트에서 reply를 보내면 해당 메서드로 진입후 렌더러의 state 콜백을 호출한다.
 * 확장성을 위해 파일을 따로 뺐지만, 해당 버젼에서는 사용할 일이없어 렌더러 측에다가 코드를 작성해도될 듯,.,,.*/
export const listenerCallback = (ipcParams:IIpcParams) => {
    const {stateCallback} = ipcParams;
    stateCallback(ipcParams);
}


