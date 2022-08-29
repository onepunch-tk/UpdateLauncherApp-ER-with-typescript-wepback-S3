interface IIpcParams {
    key?: string;
    message?: any;
    stateCallback?(value:any):void,
}