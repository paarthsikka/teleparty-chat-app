export interface SessionChatMessage {
    isSystemMessage: boolean;
    userIcon?: string;
    userNickname?: string;
    body: string;
    permId: string;
    timestamp: number;
}