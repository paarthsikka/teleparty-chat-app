import { CallbackFunction } from "./"
export class SocketCallbackManager {
    private _callbackMap: Map<string, CallbackFunction> = new Map();


    private makeId(): string {
        let result = '';
        const hexChars = '0123456789abcdef';
        for (let i = 0; i < 16; i += 1) {
            result += hexChars[Math.floor(Math.random() * 16)];
        }
        return result;
    }

    public executeCallback(callbackId: string, data?: any): void {
        const callback = this._callbackMap.get(callbackId);
        if (callback) {
            callback(data);
            this._callbackMap.delete(callbackId);
        }
    }

    public addCallback(callback: CallbackFunction): string {
        let newId = this.makeId();
        while (this._callbackMap.has(newId)) {
            newId = this.makeId();
        }
        this._callbackMap.set(newId, callback);
        return newId;
    }
}