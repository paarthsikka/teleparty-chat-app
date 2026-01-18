import { SocketMessage } from "./SocketMessage";
import { SocketCallbackManager } from "./SocketCallbackManager";
import { SocketEventHandler } from "./SocketEventHandler";
import { SocketMessageTypes } from "./SocketMessageTypes";
import { MessageList } from "./MessageList";
import { CallbackFunction } from "./CallbackFunction";


const SOCKET_URL = "wss://uwstest.teleparty.com";
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL = 1000;
const RECONNECT_DECAY = 2;
const MANUAL_CLOSE_CODE = 4500;

export class TelepartyClient {
    private _socket: WebSocket;
    private _socketEventHandler: SocketEventHandler;
    private _callbackManager: SocketCallbackManager;
    private _keepAliveInterval?: number;
    private _reconnectTimeOut?: number;
    private _reconnectAttempts: number;

    constructor(eventHandler: SocketEventHandler) {
        this._socketEventHandler = eventHandler;
        this._socket = new WebSocket(SOCKET_URL);
        this._callbackManager = new SocketCallbackManager();
        this._handleSocketEvents();
        this._reconnectAttempts = 0;
    }

    private _handleSocketEvents() {
        this._socket.onmessage = this._onMessage.bind(this);
        this._socket.onclose = this._onClose.bind(this);
        this._socket.onerror = this._onError.bind(this);
        this._socket.onopen = this._onOpen.bind(this);
    }

    private _onMessage(event: MessageEvent) {
        try {
            const message: SocketMessage = JSON.parse(event.data);
            if (message.callbackId) {
                this._callbackManager.executeCallback(message.callbackId, message.data);
            } else {
                this._socketEventHandler.onMessage(message);
            }
        } catch (error) {
            //
        }
    }

    private _onOpen() {
        this._socketEventHandler.onConnectionReady();
    }

    private _onClose(event: CloseEvent) {
        this._socketEventHandler.onClose();
    }


    private _onError(event: Event) {
        this._socket.close();
    }

    private _formatMessage(type: string, data: any, callbackId: string): SocketMessage {
        return {
            type: type,
            data: data,
            callbackId: callbackId
        }
    }

    /**
     * Join a room with a given id
     * @param nickname The name of the user in chat
     * @param userIcon The users icon in chat (Optional)
     * @param roomId 
     * @returns{MessageList} The list of previous messages in the session
     */
    public async joinChatRoom(nickname: string, roomId: string, userIcon?: string): Promise<MessageList> {
        const joinData = {
            videoId: "0",
            sessionId: roomId,
            videoService: "netflix",
            permId: "0000000000000000",
            userSettings: {
                userIcon: userIcon,
                userNickname: nickname
            }
        }

        const sessionData: any = await new Promise((resolve) => {
            this.sendMessage(SocketMessageTypes.JOIN_SESSION, joinData, (res) => {
                resolve(res);
            })
        });

        if (sessionData.errorMessage) {
            throw new Error(sessionData.errorMessage);
        }

        return {
            messages: sessionData.messages
        }
    }

    /**
     * Create a chat room
     * @param nickname The name of the user in chat
     * @param userIcon The users icon in chat (Optional)
     * @returns {string} The id for the created room
     */
    public async createChatRoom(nickname: string, userIcon?: string): Promise<string> {
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
        }

        const sessionData: any = await new Promise((resolve) => {
            this.sendMessage(SocketMessageTypes.CREATE_SESSION, createData, (res) => {
                resolve(res);
            })
        });

        if (sessionData.errorMessage) {
            throw new Error(sessionData.errorMessage);
        }

        return sessionData.sessionId;
    }

    /**
     * Send a message to the server over the Socket
     * @param type Type of message to send, see "SocketMessageTypes"
     * @param data 
     * @param callback Optional Callback function, will return the response from the server
     */
    public sendMessage(type: SocketMessageTypes, data: any, callback?: CallbackFunction): void {
        if (this._socket.readyState == 1) {
            let callbackId = "null";
            if (callback) {
                callbackId = this._callbackManager.addCallback(callback);
            }
            const socketMessage: SocketMessage = this._formatMessage(type, data, callbackId);
            this._socket.send(JSON.stringify(socketMessage));
        } else {
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
    public teardown(): void {
        try {
            this._socket.close(MANUAL_CLOSE_CODE);
        } catch (e) {
        }

        if (this._reconnectTimeOut) {
            clearTimeout(this._reconnectTimeOut);
        }

        if (this._keepAliveInterval) {
            clearInterval(this._keepAliveInterval);
        }
    }

}