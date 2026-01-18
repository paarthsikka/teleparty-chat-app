export interface SocketMessage {
    type: string;
    data: any;
    callbackId?: string;
}
