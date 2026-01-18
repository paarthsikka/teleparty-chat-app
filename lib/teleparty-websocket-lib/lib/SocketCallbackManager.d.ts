import { CallbackFunction } from "./";
export declare class SocketCallbackManager {
    private _callbackMap;
    private makeId;
    executeCallback(callbackId: string, data?: any): void;
    addCallback(callback: CallbackFunction): string;
}
