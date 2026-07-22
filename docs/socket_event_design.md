# Socket.IO Event Design — Unify

This document outlines the real-time events, communication flows, payload schemas, and room management rules designed for the **Unify** WebSocket layer.

---

## 1. Goal of Step 1.6: Socket Event Design
To design an event-driven network interface using **Socket.IO** that establishes real-time message distribution, presence tracking, typing animations, and read receipts.

---

## 2. Technical Decisions & Industry Best Practices
- **Room Segmentation**:
  - **User Private Notification Room**: Upon connecting, every user socket joins a room named after their unique `userId`. If another user invites them to a group or calls them, the server can emit an event directly to this private room (`io.to(targetUserId).emit(...)`).
  - **Conversation Active Room**: When opening a conversation, the client leaves any previous conversation room and joins a room named after the active `conversationId`. Sending a message emits an event directly to this room, distributing the chat bubble instantly to all active room participants.
- **Heartbeat & Disconnection Management**: We configure `pingTimeout: 60000` to clean up server memory immediately when socket clients drop offline due to network interruptions, rather than leaving orphan socket connections active in memory.

---

## 3. Real-Time Communication Lifecycle Flow

```text
 Client React (Sarah)            Socket.IO Server              Client React (Alex)
        |                                |                               |
        | === 1. setup { userId } ======>| (Joins Sarah private room)    |
        |                                |                               |
        | === 2. join_chat { roomId } ===>| (Joins conversation room)     |
        |                                |                               |
        | === 3. typing =================>|                               |
        |                                | --- 4. typing (Broadcast) --->|
        |                                |                               | (Renders "Sarah is typing...")
        |                                |                               |
        |                                |<--- 5. send_message ----------| (Alex sends chat bubble)
        |<--- 6. message_received -------|                               |
        |                                |                               |
```

---

## 4. Directory Structure Layout
This documentation is stored under:

```text
Unify/
├── docs/
│   ├── requirements_analysis.md
│   ├── system_design.md
│   ├── database_design.md
│   ├── api_design.md
│   └── socket_event_design.md     # [NEW] This document
├── LICENSE
└── README.md
```

---

## 5. Socket.IO Event Reference API

### A. Connection Setup

#### 1. Setup Session (`setup`)
- **Direction**: Client ➔ Server
- **Payload**: `{ _id: "65b2d9d4..." }` (Authenticated User object)
- **Description**: Configures the socket connection, joins the user to their private notification room, and registers their presence as active.
- **Server Action**:
  ```javascript
  socket.join(userData._id);
  socket.emit("connected");
  ```

#### 2. Confirm Connection (`connected`)
- **Direction**: Server ➔ Client
- **Payload**: None
- **Description**: Confirmation event sent back to the client after a successful handshake and room registration.

---

### B. Room Management

#### 1. Join Active Chat Room (`join_chat`)
- **Direction**: Client ➔ Server
- **Payload**: `"65b3e9a162a7b8e1f0e25678"` (Target Conversation ID)
- **Description**: Instructs the socket server to subscribe this client connection to the conversation's broadcast channel.
- **Server Action**:
  ```javascript
  socket.join(room);
  ```

---

### C. Chat Interactions

#### 1. Submit Real-Time Message (`send_message`)
- **Direction**: Client ➔ Server
- **Payload**: Message Document (JSON)
- **Description**: Sends a message to the server for instant distribution to other conversation participants.
- **Server Action**:
  ```javascript
  const conversation = message.conversationId;
  // Broadcast message to all users in the chat room except the sender
  socket.in(conversation).emit("message_received", message);
  ```

#### 2. Distribute Message (`message_received`)
- **Direction**: Server ➔ Client
- **Payload**: Message Document (JSON)
- **Description**: Arrives at target client browsers, prompting the React chat context to append the message bubble to the active window state.

---

### D. Presence & Micro-Interactions

#### 1. Start Typing Indicator (`typing`)
- **Direction**: Client ➔ Server
- **Payload**: `"65b3e9a162a7b8e1f0e25678"` (Active Conversation ID)
- **Description**: Broadcasts to the conversation room that the user is typing, showing the typing UI animation.
- **Server Action**:
  ```javascript
  socket.in(room).emit("typing", room);
  ```

#### 2. Stop Typing Indicator (`stop_typing`)
- **Direction**: Client ➔ Server
- **Payload**: `"65b3e9a162a7b8e1f0e25678"`
- **Description**: Broadcasts that the user has stopped typing, removing the typing UI animation.
- **Server Action**:
  ```javascript
  socket.in(room).emit("stop_typing", room);
  ```

#### 3. Update Online Status (`presence_change`)
- **Direction**: Client ➔ Server
- **Payload**: `{ userId: "65b2d9d4...", status: "online" }`
- **Description**: Updates the database user status and broadcasts the state change to all online users.
- **Server Action**:
  ```javascript
  socket.broadcast.emit("presence_update", { userId, status, lastSeen: Date.now() });
  ```

---

## 6. Common Socket Pitfalls to Avoid
- **Leaking Broadcasts to Senders**: Emitting a message event back to the room using `io.to(room).emit(...)` instead of `socket.in(room).emit(...)`. This forces the sender client to process their own message twice, creating UI duplicate keys.
- **Orphan Socket Event Listeners**: Forgetting to unsubscribe (`socket.off(...)`) from event channels when a React component unmounts. This leads to severe memory leaks and duplicate event executions in the browser.
