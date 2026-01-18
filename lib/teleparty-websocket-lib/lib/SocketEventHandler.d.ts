import { SocketMessage } from "./SocketMessage";
export interface SocketEventHandler {
    /**
     * Called when the initial connection is established
     */
    onConnectionReady(): void;
    /**
     * Called when the socket loses connection. Restart the application
     */
    onClose(): void;
    /**
     * Called when a (non callback) message is received from the server.
     * @param message
     */
    onMessage(message: SocketMessage): void;
}
