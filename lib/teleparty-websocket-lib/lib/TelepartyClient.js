"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelepartyClient = void 0;
const SocketCallbackManager_1 = require("./SocketCallbackManager");
const SocketMessageTypes_1 = require("./SocketMessageTypes");
const SOCKET_URL = "wss://uwstest.teleparty.com";
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL = 1000;
const RECONNECT_DECAY = 2;
const MANUAL_CLOSE_CODE = 4500;
class TelepartyClient {
    constructor(eventHandler) {
        this._socketEventHandler = eventHandler;
        this._socket = new WebSocket(SOCKET_URL);
        this._callbackManager = new SocketCallbackManager_1.SocketCallbackManager();
        this._handleSocketEvents();
        this._reconnectAttempts = 0;
    }
    _handleSocketEvents() {
        this._socket.onmessage = this._onMessage.bind(this);
        this._socket.onclose = this._onClose.bind(this);
        this._socket.onerror = this._onError.bind(this);
        this._socket.onopen = this._onOpen.bind(this);
    }
    _onMessage(event) {
        try {
            const message = JSON.parse(event.data);
            if (message.callbackId) {
                this._callbackManager.executeCallback(message.callbackId, message.data);
            }
            else {
                this._socketEventHandler.onMessage(message);
            }
        }
        catch (error) {
            //
        }
    }
    _onOpen() {
        this._socketEventHandler.onConnectionReady();
    }
    _onClose(event) {
        this._socketEventHandler.onClose();
    }
    _onError(event) {
        this._socket.close();
    }
    _formatMessage(type, data, callbackId) {
        return {
            type: type,
            data: data,
            callbackId: callbackId
        };
    }
    /**
     * Join a room with a given id
     * @param nickname The name of the user in chat
     * @param userIcon The users icon in chat (Optional)
     * @param roomId
     * @returns{MessageList} The list of previous messages in the session
     */
    joinChatRoom(nickname, roomId, userIcon) {
        return __awaiter(this, void 0, void 0, function* () {
            const joinData = {
                videoId: "0",
                sessionId: roomId,
                videoService: "netflix",
                permId: "0000000000000000",
                userSettings: {
                    userIcon: userIcon,
                    userNickname: nickname
                }
            };
            const sessionData = yield new Promise((resolve) => {
                this.sendMessage(SocketMessageTypes_1.SocketMessageTypes.JOIN_SESSION, joinData, (res) => {
                    resolve(res);
                });
            });
            if (sessionData.errorMessage) {
                throw new Error(sessionData.errorMessage);
            }
            return {
                messages: sessionData.messages
            };
        });
    }
    /**
     * Create a chat room
     * @param nickname The name of the user in chat
     * @param userIcon The users icon in chat (Optional)
     * @returns {string} The id for the created room
     */
    createChatRoom(nickname, userIcon) {
        return __awaiter(this, void 0, void 0, function* () {
            const createData = {
                controlLock: false,
                videoId: "0",
                videoDuration: 0,
                videoService: "netflix",
                permId: "0000000000000000",
                userSettings: {
                    userIcon: userIcon,
                    userNickname: nickname
                }
            };
            const sessionData = yield new Promise((resolve) => {
                this.sendMessage(SocketMessageTypes_1.SocketMessageTypes.CREATE_SESSION, createData, (res) => {
                    resolve(res);
                });
            });
            if (sessionData.errorMessage) {
                throw new Error(sessionData.errorMessage);
            }
            return sessionData.sessionId;
        });
    }
    /**
     * Send a message to the server over the Socket
     * @param type Type of message to send, see "SocketMessageTypes"
     * @param data
     * @param callback Optional Callback function, will return the response from the server
     */
    sendMessage(type, data, callback) {
        if (this._socket.readyState == 1) {
            let callbackId = "null";
            if (callback) {
                callbackId = this._callbackManager.addCallback(callback);
            }
            const socketMessage = this._formatMessage(type, data, callbackId);
            this._socket.send(JSON.stringify(socketMessage));
        }
        else {
            if (callback) {
                callback({
                    errorMessage: "Connection isn't Ready yet."
                });
            }
        }
    }
    /**
     * Close the underlying websocket connectoin
     */
    teardown() {
        try {
            this._socket.close(MANUAL_CLOSE_CODE);
        }
        catch (e) {
        }
        if (this._reconnectTimeOut) {
            clearTimeout(this._reconnectTimeOut);
        }
        if (this._keepAliveInterval) {
            clearInterval(this._keepAliveInterval);
        }
    }
}
exports.TelepartyClient = TelepartyClient;
