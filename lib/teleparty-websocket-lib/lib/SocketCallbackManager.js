"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketCallbackManager = void 0;
class SocketCallbackManager {
    constructor() {
        this._callbackMap = new Map();
    }
    makeId() {
        let result = '';
        const hexChars = '0123456789abcdef';
        for (let i = 0; i < 16; i += 1) {
            result += hexChars[Math.floor(Math.random() * 16)];
        }
        return result;
    }
    executeCallback(callbackId, data) {
        const callback = this._callbackMap.get(callbackId);
        if (callback) {
            callback(data);
            this._callbackMap.delete(callbackId);
        }
    }
    addCallback(callback) {
        let newId = this.makeId();
        while (this._callbackMap.has(newId)) {
            newId = this.makeId();
        }
        this._callbackMap.set(newId, callback);
        return newId;
    }
}
exports.SocketCallbackManager = SocketCallbackManager;
