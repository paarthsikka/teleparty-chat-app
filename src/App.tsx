import { useState, useEffect, useRef, useCallback } from 'react';
import { TelepartyClient, SocketMessageTypes } from 'teleparty-websocket-lib';
import type { SessionChatMessage, MessageList, SocketEventHandler } from 'teleparty-websocket-lib';
import './App.css';

interface SocketMessage {
  type: string;
  data: unknown;
  callbackId?: string;
}

interface TypingMessageData {
  anyoneTyping: boolean;
  usersTyping: string[];
}

type Screen = 'landing' | 'chat';

function App() {
  const [connectionReady, setConnectionReady] = useState(false);
  const [connectionClosed, setConnectionClosed] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [nickname, setNickname] = useState('');
  const [userIcon, setUserIcon] = useState<string | undefined>(undefined);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [messages, setMessages] = useState<SessionChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const clientRef = useRef<InstanceType<typeof TelepartyClient> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [iconCache, setIconCache] = useState<Record<string, string>>({});

  const getIconForMessage = useCallback((msg: SessionChatMessage): string | undefined => {
    const msgNickname = msg.userNickname;
    if (!msgNickname) return undefined;

    const localIcon = iconCache[msgNickname];
    if (localIcon && localIcon.length > 100) return localIcon;

    if (msg.userIcon && msg.userIcon.length > 100) return msg.userIcon;

    return undefined;
  }, [iconCache]);

  const handleMessage = useCallback((message: SocketMessage) => {
    if (message.type === SocketMessageTypes.SEND_MESSAGE) {
      const chatMessage = message.data as SessionChatMessage;
      setMessages(prev => [...prev, chatMessage]);

    } else if (message.type === SocketMessageTypes.SET_TYPING_PRESENCE) {
      const typingData = message.data as TypingMessageData;

      if (typingData.anyoneTyping && typingData.usersTyping.length > 0) {
        if (isTypingRef.current) {
          if (typingData.usersTyping.length > 1) {
            setTypingUsers(['Others']);
          } else {
            setTypingUsers([]);
          }
        } else {
          setTypingUsers(['Someone']);
        }
      } else {
        setTypingUsers([]);
      }
    }
  }, []);

  useEffect(() => {
    const eventHandler: SocketEventHandler = {
      onConnectionReady: () => {
        setConnectionReady(true);
        setConnectionClosed(false);
      },
      onClose: () => {
        setConnectionClosed(true);
        setConnectionReady(false);
      },
      onMessage: handleMessage,
    };

    clientRef.current = new TelepartyClient(eventHandler);

    return () => {
      clientRef.current?.teardown();
    };
  }, [handleMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const sendTypingPresence = (typing: boolean) => {
    if (!clientRef.current || isTypingRef.current === typing) return;

    isTypingRef.current = typing;
    try {
      clientRef.current.sendMessage(SocketMessageTypes.SET_TYPING_PRESENCE, {
        typing,
      });
    } catch {
      // Ignore errors
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputMessage(value);

    if (value.length > 0) {
      sendTypingPresence(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        sendTypingPresence(false);
      }, 2000);
    } else {
      sendTypingPresence(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!clientRef.current || !connectionReady || !nickname.trim()) return;

    setError(null);
    try {
      const newRoomId = await clientRef.current.createChatRoom(nickname.trim(), userIcon);
      setRoomId(newRoomId);
      if (userIcon) {
        setIconCache(prev => ({ ...prev, [nickname.trim()]: userIcon }));
      }
      setCurrentScreen('chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    }
  };

  const handleJoinRoom = async () => {
    if (!clientRef.current || !connectionReady || !nickname.trim() || !joinRoomId.trim()) return;

    setError(null);
    try {
      const messageList: MessageList = await clientRef.current.joinChatRoom(
        nickname.trim(),
        joinRoomId.trim(),
        userIcon
      );
      setRoomId(joinRoomId.trim());

      if (userIcon) {
        setIconCache(prev => ({ ...prev, [nickname.trim()]: userIcon }));
      }

      setMessages(messageList.messages || []);
      setCurrentScreen('chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    }
  };

  const handleSendMessage = () => {
    if (!clientRef.current || !inputMessage.trim()) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingPresence(false);

    try {
      clientRef.current.sendMessage(SocketMessageTypes.SEND_MESSAGE, {
        body: inputMessage.trim(),
      });
      setInputMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError('Image file is too large. Please select a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 48;
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, size, size);
          let quality = 0.7;
          let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

          const MAX_TARGET_LENGTH = 2000;
          while (compressedDataUrl.length > MAX_TARGET_LENGTH && quality > 0.3) {
            quality -= 0.1;
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          setUserIcon(compressedDataUrl);
          setError(null);
        }
      };
      img.onerror = () => {
        setError('Failed to load image. Please try another file.');
      };
      img.src = reader.result as string;
    };
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLeaveRoom = () => {
    clientRef.current?.teardown();
    setCurrentScreen('landing');
    setRoomId(null);
    setMessages([]);
    setTypingUsers([]);
    setError(null);
    setConnectionReady(false);
    setConnectionClosed(false);
    const eventHandler: SocketEventHandler = {
      onConnectionReady: () => {
        setConnectionReady(true);
        setConnectionClosed(false);
      },
      onClose: () => {
        setConnectionClosed(true);
        setConnectionReady(false);
      },
      onMessage: handleMessage,
    };
    clientRef.current = new TelepartyClient(eventHandler);
  };

  if (connectionClosed) {
    return (
      <div className="app">
        <div className="overlay">
          <div className="overlay-content">
            <h2>Connection Lost</h2>
            <p>The connection to the chat server was closed.</p>
            <button onClick={() => window.location.reload()}>
              Reload App
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Landing page
  if (currentScreen === 'landing') {
    return (
      <div className="app">
        <div className="landing">
          <div className="landing-card">
            <h1>Teleparty Chat</h1>
            <p className="subtitle">Real-time chat powered by WebSockets</p>

            <div className="connection-status">
              <span className={`status-dot ${connectionReady ? 'connected' : 'connecting'}`}></span>
              <span>{connectionReady ? 'Connected' : 'Connecting...'}</span>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="nickname">Nickname</label>
              <input
                id="nickname"
                type="text"
                placeholder="Enter your nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
              />
            </div>

            <div className="form-group">
              <label>User Icon (optional)</label>
              <div className="icon-upload">
                {userIcon ? (
                  <img src={userIcon} alt="User icon" className="icon-preview" />
                ) : (
                  <div className="icon-placeholder">
                    {nickname ? getInitials(nickname) : '?'}
                  </div>
                )}
                <label className="upload-btn">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconUpload}
                    hidden
                  />
                  Choose Image
                </label>
              </div>
            </div>

            <div className="action-section">
              <button
                className="btn primary"
                onClick={handleCreateRoom}
                disabled={!connectionReady || !nickname.trim()}
              >
                Create New Room
              </button>
            </div>

            <div className="divider">
              <span>or join existing room</span>
            </div>

            <div className="form-group">
              <label htmlFor="roomId">Room ID</label>
              <input
                id="roomId"
                type="text"
                placeholder="Enter room ID"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
              />
            </div>

            <button
              className="btn secondary"
              onClick={handleJoinRoom}
              disabled={!connectionReady || !nickname.trim() || !joinRoomId.trim()}
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chat room
  return (
    <div className="app">
      <div className="chat-room">
        <div className="chat-header">
          <div className="header-left">
            <h2>Teleparty Chat</h2>
            <div className="room-id">
              Room ID: <code>{roomId}</code>
              <button
                className="copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(roomId || '');
                }}
                title="Copy Room ID"
              >
                📋
              </button>
            </div>
          </div>
          <button className="leave-btn" onClick={handleLeaveRoom} title="Leave Room">
            Leave Room
          </button>
        </div>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="no-messages">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg, index) => {
              const icon = !msg.isSystemMessage ? getIconForMessage(msg) : undefined;
              return (
                <div
                  key={`${msg.permId}-${msg.timestamp}-${index}`}
                  className={`message ${msg.isSystemMessage ? 'system' : 'user'}`}
                >
                  {msg.isSystemMessage ? (
                    <div className="system-message">
                      {msg.userNickname ? `${msg.userNickname} ${msg.body}` : msg.body}
                    </div>
                  ) : (
                    <>
                      <div className="message-avatar">
                        {icon ? (
                          <img src={icon} alt={msg.userNickname} />
                        ) : (
                          <div className="avatar-initials">
                            {getInitials(msg.userNickname || 'U')}
                          </div>
                        )}
                      </div>
                      <div className="message-content">
                        <div className="message-header">
                          <span className="message-author">{msg.userNickname}</span>
                          <span className="message-time">{formatTime(msg.timestamp)}</span>
                        </div>
                        <div className="message-body">{msg.body}</div>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            <span className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </span>
            {typingUsers[0]} is typing...
          </div>
        )}

        <div className="message-input-container">
          <input
            type="text"
            placeholder="Type a message..."
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          />
          <button
            className="send-btn"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
