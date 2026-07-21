# 💬 Unify — Real-Time Chat Application

**Unify** is a production-ready, full-stack real-time messaging application engineered with the MERN stack (MongoDB, Express, React, Node.js) and powered by Socket.IO for instant, event-driven communication.

---

## ✨ Features

- 🔐 **Authentication & Security**
  - Secure signup & login with password hashing via **BcryptJS**
  - Stateless session management using **JSON Web Tokens (JWT)**
  - Protected API endpoints & client-side route guards

- ⚡ **Real-Time Messaging**
  - Instant one-on-one direct messaging & group conversations
  - Dynamic **typing indicators** & **read receipts**
  - Live **online / offline user presence detection**

- 📁 **Media & File Sharing**
  - File upload handling using **Multer**
  - Support for images, documents, and media attachments with preview features

- 🎨 **Modern UI/UX**
  - Responsive 3-column chat layout built with **Tailwind CSS**
  - Real-time unread message badges & toast notification alerts

---

## 📋 Prerequisites

Before running the application, make sure you have the following installed on your system:

- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher) or **yarn**
- **MongoDB** (Local instance running on port `27017` or a MongoDB Atlas connection string)

---

## 🛠️ Tech Stack

| Component | Technologies Used |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Axios, Socket.io-Client, React Router DOM |
| **Backend** | Node.js, Express.js, Socket.IO, Mongoose, Multer, BcryptJS, JSON Web Token (JWT) |
| **Database** | MongoDB / MongoDB Atlas |

---

## 📂 Project Structure

```text
Unify/
├── backend/
│   ├── config/             # Database & Socket initializers
│   ├── controllers/        # Request handlers (Auth, Users, Messages)
│   ├── middleware/         # JWT verification, upload handling & rate limiting
│   ├── models/             # Mongoose schemas (User.js, Message.js, Conversation.js)
│   ├── routes/             # REST API routes (/api/v1/...)
│   ├── uploads/            # Media uploads temporary folder
│   ├── utils/              # Token generators & custom helpers
│   ├── server.js           # Express + Socket server entrance point
│   ├── .env.example        # Backend environment template
│   └── package.json
│
└── frontend/
    ├── public/             # Static public assets
    ├── src/
    │   ├── assets/         # Styles & brand media
    │   ├── components/     # Reusable UI components (Buttons, Avatars, Modals)
    │   ├── context/        # React Contexts (AuthContext, SocketContext, ChatContext)
    │   ├── hooks/          # Custom hooks (useSocket, useAuth, useChat)
    │   ├── layouts/        # Layout wrappers (Dashboard, Auth)
    │   ├── pages/          # Full page views (Landing, Login, Register, Dashboard)
    │   ├── services/       # Axios API client handlers
    │   ├── App.jsx         # Application routes definition
    │   └── main.jsx        # App entry point
    ├── .env.example        # Frontend environment template
    ├── tailwind.config.js  # Styling configuration rules
    ├── vite.config.js      # Vite build setup
    └── package.json
```

---

## ⚡ Quick Start Guide

Follow these steps to get your local development environment up and running.

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install server-side dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
4. Open the `.env` file and configure your variables:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/unify_db
   JWT_SECRET=your_super_secret_jwt_key
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   ```
5. Start the backend server in development mode:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install client-side dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
4. Open the `.env` file and set the API and Socket server URLs:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api/v1
   VITE_SOCKET_SERVER_URL=http://localhost:5000
   ```
5. Start the Vite development server:
   ```bash
   npm run dev
   ```
6. Open your browser and visit `http://localhost:5173`.

---

## 📡 REST API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/v1/auth/register` | Register a new user account | ❌ |
| `POST` | `/api/v1/auth/login` | Authenticate user & issue JWT | ❌ |
| `POST` | `/api/v1/auth/logout` | Clear authentication session | ✅ |
| `GET` | `/api/v1/users/me` | Fetch active user profile | ✅ |
| `GET` | `/api/v1/users/search?q=query` | Search registered users by username | ✅ |
| `GET` | `/api/v1/conversations` | Fetch all user conversations | ✅ |
| `GET` | `/api/v1/messages/:conversationId` | Fetch message history for a chat room | ✅ |
| `POST` | `/api/v1/messages` | Send a new message / media attachment | ✅ |

---

## 🔌 Socket.IO Events Reference

| Event Name | Direction | Description |
|---|---|---|
| `connection` | Client ➔ Server | Establishes the WebSocket handshake |
| `setup_user` | Client ➔ Server | Registers active socket with corresponding user ID |
| `join_chat` | Client ➔ Server | Joins a specific conversation room |
| `send_message` | Client ➔ Server | Emits a new real-time message |
| `receive_message` | Server ➔ Client | Dispatches message to active room participants |
| `typing` | Client ➔ Server | Broadcasts typing status to active chat room |
| `stop_typing` | Client ➔ Server | Broadcasts end-of-typing status |
| `user_status` | Server ➔ Client | Broadcasts online/offline status updates |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
