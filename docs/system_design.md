# System & Directory Design — Unify

This document details the software architecture, component relationships, data flow, and directory structure designed for the **Unify** full-stack real-time chat application.

---

## 1. Goal of Step 1.2 & 1.3: System & Folder Structure Design
To design a highly modular system architecture adhering to the MVC design pattern, and translate it into a clean, scalable folder structure that separates client concerns from server operations.

---

## 2. Technical Decisions & Industry Best Practices
- **Monorepo Directory Layout**: Having separate `frontend` and `backend` folders under a single root repository makes local development, dependency management, and configuration tracking straightforward.
- **Component Decoupling**: The backend acts as a stateless REST server and an event-driven WebSocket gateway. This allows horizontal scalability (e.g., placing the backend behind a load balancer and using a Redis Adapter for WebSockets).
- **Stateless Server Architecture**: All sessions are validated via JWT on each request. The backend doesn't store session states in memory, keeping CPU and RAM footprints low.

---

## 3. Data Flow Diagram (ASCII)

```text
  React Client (Vite)               Express Router / Controllers              MongoDB (Database)
         |                                       |                                     |
         | --- 1. POST /api/v1/auth/login ------>|                                     |
         | <--- 2. Returns JSON JWT Token -------|                                     |
         |                                       |                                     |
         | --- 3. GET /api/v1/conversations ---->|                                     |
         |                                       | --- 4. Query user conversations --->|
         |                                       |<--- 5. Return document list --------|
         | <--- 6. Render conversation list -----|                                     |
         |                                       |                                     |
         | === 7. Connects to Socket.IO Server =>|                                     |
         |                                       |                                     |
```

---

## 4. Folder Structure Layout
We will establish the following structure in our workspace during Phase 2:

```text
Unify/
├── docs/
│   ├── requirements_analysis.md
│   └── system_design.md           # [NEW] This document
├── LICENSE
└── README.md
```

The app code will be structured as follows:
- **`backend/`**: Node/Express server, modularized into config, controllers, routes, middleware, models, and helper utils.
- **`frontend/`**: Vite React client, modularized into assets, components, contexts, hooks, layouts, pages, and API service files.

---

## 5. Component Explanations

### Backend Tier
- **`server.js`**: Integrates the Express router, Mongoose DB connection, and Socket.IO listener.
- **`config/`**: Separates server configuration options. Contains db initialization (`db.js`) and websocket configurations (`socket.js`).
- **`controllers/`**: Isolates business logic from routing. Handles actions like password hashing, message formatting, and search filters.
- **`routes/`**: Grouped by resource (auth, users, conversations, messages) and routes traffic to respective controllers.
- **`middleware/`**: Intercepts requests for authentication guards (`authMiddleware.js`), file stream handling (`uploadMiddleware.js`), or rate limiters.
- **`models/`**: Defines data properties using Mongoose Schemas.

### Frontend Tier
- **`src/main.jsx` & `App.jsx`**: The client entrance point and route definitions using `react-router-dom`.
- **`src/context/`**: Manages global React states like authenticated user details (`AuthContext`), socket connections (`SocketContext`), and active conversation logs (`ChatContext`).
- **`src/pages/`**: Full views mapped to routing targets (e.g., Dashboard views).
- **`src/components/`**: Reusable UI atoms (e.g., buttons, input text boxes, profile avatars) to maintain design consistency.
- **`src/services/`**: Formats HTTP requests to the backend using Axios.

---

## 6. Common Design Mistakes to Avoid
- **Tightly Coupling Socket.IO to Express Routes**: Injecting the socket instance directly inside Express controllers in a way that blocks horizontal scaling. Instead, use socket room rooms or a message broker.
- **Putting Business Logic in Route Definitions**: Defining route callbacks inline. This makes write testing difficult. Keep routes clean by mapping them straight to controller functions.

---

## 7. Interview Questions & Production Insights
- **Q**: *Why place the frontend and backend in separate directories instead of serving the built React files straight from the Express server?*
  - **A**: Serving React from Express couples frontend scaling to backend scaling. In production, we build the React files and host them on cheap, fast Content Delivery Networks (CDNs) like Vercel or Cloudflare Pages, keeping backend server compute resources dedicated to handling database writes and active WebSockets.
