import { SocketEventHandler } from "./SocketEventHandler";
import { SocketMessageTypes } from "./SocketMessageTypes";
import { MessageList } from "./MessageList";
import { CallbackFunction } from "./CallbackFunction";
export declare class TelepartyClient {
    private _socket;
    private _socketEventHandler;
    private _callbackManager;
    private _keepAliveInterval?;
    private _reconnectTimeOut?;
    private _reconnectAttempts;
    constructor(eventHandler: SocketEventHandler);
    private _handleSocketEvents;
    private _onMessage;
    private _onOpen;
    private _onClose;
    private _onError;
    private _formatMessage;
    /**
     * Join a room with a given id
     * @param nickname The name of the user in chat
     * @param userIcon The users icon in chat (Optional)
     * @param roomId
     * @returns{MessageList} The list of previous messages in the session
     */
    joinChatRoom(nickname: string, roomId: string, userIcon?: string): Promise<MessageList>;
    /**
     * Create a chat room
     * @param nickname The name of the user in chat
     * @param userIcon The users icon in chat (Optional)
     * @returns {string} The id for the created room
     */
    createChatRoom(nickname: string, userIcon?: string): Promise<string>;
    /**
     * Send a message to the server over the Socket
     * @param type Type of message to send, see "SocketMessageTypes"
     * @param data
     * @param callback Optional Callback function, will return the response from the server
     */
    sendMessage(type: SocketMessageTypes, data: any, callback?: CallbackFunction): void;
    /**
     * Close the underlying websocket connectoin
     */
    teardown(): void;
}
