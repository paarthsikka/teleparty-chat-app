# Teleparty Chat Application

A real-time chat application built with React, TypeScript, and WebSockets using the Teleparty WebSocket library.

https://paarthsikka.github.io/teleparty-chat-app/

## Features

### Required Features (All Implemented)
- Create chat rooms with a button click
- Join existing rooms using Room ID
- Send and receive real-time chat messages
- Set nickname when joining/creating rooms
- View all messages (sent, received, system messages)
- Load previous chat history when joining
- Typing presence indicator

## Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
teleparty-chat-app/
├── src/
│   ├── App.tsx          # Main application component
│   ├── App.css          # Styling
│   └── main.tsx         # Entry point
├── lib/
│   └── teleparty-websocket-lib/  # WebSocket library
└── .github/
    └── workflows/
        └── deploy.yml   # GitHub Pages deployment
```

## WebSocket Communication

The app uses the `teleparty-websocket-lib` for:
- Creating and joining chat rooms
- Sending/receiving messages
- Typing presence updates

## 👤 Author

Paarth Sikka