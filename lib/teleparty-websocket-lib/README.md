
## teleparty-websocket-lib

Enables functionality of a basic Websocket backed Real-time Chat Application

## Installation

To install, you can use npm or yarn:

```
npm install watchparty-org/teleparty-WebSocket-lib --save

or

yarn add https://github.com/watchparty-org/teleparty-websocket-lib
```

## Usage

Imports:

```javascript
import { TelepartyClient, SocketEventHandler, SocketMessageTypes, SessionChatMessage } from 'teleparty-websocket-lib';
```

Initializing the Client

```javascript
import { TelepartyClient, SocketEventHandler } from 'teleparty-websocket-lib';

const eventHandler: SocketEventHandler = {
    onConnectionReady: () => { alert("Connection has been established") },
    onClose: () => { alert("Socket has been closed") },
    onMessage: (message) => { alert("Received message: " + message) }
};

const client = new TelepartyClient(eventHandler);
```

Creating a chat room:

```javascript
let roomId = await client.createChatRoom(nickname, userIcon);
```


Joining a chat room:

```javascript
client.joinChatRoom(nickname, roomId, userIcon);
```

Sending a chat message:

```javascript
client.sendMessage(SocketMessageTypes.SEND_MESSAGE, {
    body: 'Hello world'
});
```

Updating typing presence:

```javascript
client.sendMessage(SocketMessageTypes.SET_TYPING_PRESENCE, {
    typing: true
});
```


Receiving messages:

```javascript
const eventHandler: SocketEventHandler = {
    ...
    onMessage: (message) => {
        // process message according to type
    }
    ...
};
```

## License

MIT
