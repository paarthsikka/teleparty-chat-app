"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketMessageTypes = void 0;
var SocketMessageTypes;
(function (SocketMessageTypes) {
    SocketMessageTypes["CREATE_SESSION"] = "createSession";
    SocketMessageTypes["JOIN_SESSION"] = "joinSession";
    SocketMessageTypes["SEND_MESSAGE"] = "sendMessage";
    SocketMessageTypes["SET_TYPING_PRESENCE"] = "setTypingPresence";
})(SocketMessageTypes = exports.SocketMessageTypes || (exports.SocketMessageTypes = {}));
