# Product Requirements Document (PRD) — Unify

This document details the functional, non-functional, and technical requirements for the **Unify** Real-Time Chat Application, establishing the blueprint for the entire project.

---

## 1. Goal of Step 1.1: Requirements Analysis
Establish a clear understanding of the user stories, interface flows, authentication lifecycle, real-time message handling, and file storage rules before initializing the code directories.

---

## 2. Industry Best Practices Being Used
- **User Story Mapping**: Defining features from the user's perspective (e.g., "As a user, I want to...") to ensure usability.
- **Security-First Planning**: Analyzing data flows to specify where authentication checks, rate limiting, and CORS blocks must be applied.
- **Separation of Concerns**: Ensuring real-time transport (WebSockets) is decoupled from data storage APIs (REST HTTP).

---

## 3. Architecture Diagrams (ASCII)

### User Authentication Lifecycle Flow
```text
                  +-----------------------+
                  |  User Visits Website  |
                  +-----------+-----------+
                              |
                     Is Authenticated?
                    /                 \
                 [Yes]                [No]
                  /                     \
                 v                       v
     +-----------------------+     +-----------------------+
     |  Dashboard Page       |     |  Landing Page         |
     |  - List conversations |     |  - Features overview  |
     |  - Chat window        |     |  - CTA to Login/Sign  |
     +-----------------------+     +-----------+-----------+
                                               |
                                               v
                                   +-----------------------+
                                   |  Authentication Page  |
                                   |  - Register / Login   |
                                   +-----------+-----------+
                                               |
                                         Login Success?
                                        /              \
                                     [Yes]             [No]
                                      /                  \
                                     v                    v
                         +-----------------------+   +-------------------+
                         | Redirect to Dashboard |   | Show error toast  |
                         +-----------------------+   +-------------------+
```

---

## 4. Folder Structure Update
We will create a `docs/` directory in the root of the project to store system plans, PRDs, and architecture blueprints.

```text
Unify/
├── docs/
│   └── requirements_analysis.md   # [NEW] This document
├── LICENSE
└── README.md
```

---

## 5. File-by-File Explanation
- **`docs/requirements_analysis.md`**: Outlines the user requirements, page transitions, database entities, and WebSocket schemas. Used as a single source of truth for the development team.

---

## 6. Functional Requirements (User Stories)

### A. User Management & Authentication
1. **Signup**: A new user can register using their Name, Email, and Password. Passwords must be encrypted using Bcrypt.
2. **Login**: An existing user can authenticate using their Email and Password. A stateless JWT must be returned.
3. **Session Guards**: Navigating to `/dashboard` without a token redirects the user back to `/login`. Navigating to `/login` with an active token redirects the user to `/dashboard`.
4. **Logout**: Destroy the client-side JWT token and redirect the user to `/login`.

### B. Direct and Group Messaging
1. **Direct Messaging (1-to-1)**: Users can search for other registered users by email or username and initiate a direct message conversation.
2. **Group Chats**: Users can create a group chat, name the group, and add multiple participants.
3. **Admin Controls**: The creator of a group is an Admin and has the sole authority to add or remove members and promote other users to admin status.

### C. Real-Time Interactions (Socket.IO)
1. **Instant Messaging**: Messages must deliver instantly to online recipients without page refreshing.
2. **Online Status**: Real-time indicators showing if a contact is `online`, `offline`, `away`, or `busy`.
3. **Typing Indicators**: Show a visual animation (e.g., "Sarah is typing...") when the remote user is typing inside the active chat window.
4. **Read Receipts**: Display delivery status:
   - **Sent**: Message saved in database.
   - **Delivered**: Message arrived at the client's socket.
   - **Read**: Message viewed by the recipient in the active window.

### D. File and Media Sharing
1. **Attachments**: Users can send images or documents (PDFs, text files) inside a chat window.
2. **Previews**: Images must display as previews inside the chat bubbles, and documents must show download links.

---

## 7. Non-Functional Requirements (Performance & Security)
- **Scalability**: Decoupled routes so Express can scale independently from Socket.IO servers.
- **Latency**: WebSockets round-trip message delivery must remain under 150ms.
- **Security**: Rate limit REST API endpoints to 100 requests per 15 minutes per IP. Use CORS to restrict access only to the frontend domain.

---

## 8. Common Mistakes
- **Mixing HTTP and WebSocket logic**: Attempting to upload large files directly over WebSocket connections, causing socket buffers to overflow.
- **Insecure State Validation**: Relying solely on frontend redirection for route protection without verifying the JWT on backend request routes.

---

## 9. Interview Questions & Production Deployment
- **Q**: *How do production apps secure WebSockets if they are stateless?*
  - **A**: During the initial HTTP handshake of the WebSocket connection, the client sends the JWT. The server validates the token before upgrading the connection to a WebSocket.
- **Production Practice**: Companies like Slack use distributed message queues (e.g., Redis Pub/Sub) behind Socket.IO servers to broadcast messages to users connected across different server instances.

---

## 10. Summary
This analysis sets our constraints. We now have a defined authentication boundary, clear user stories, and performance baselines.
