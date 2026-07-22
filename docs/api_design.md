# REST API Route Design — Unify

This document details the REST API endpoints, input payloads, server responses, middleware requirements, and error codes designed for the **Unify** backend layer.

---

## 1. Goal of Step 1.5: API Design
To design a secure, standardized, resource-oriented REST API using clear HTTP verbs, payload parameters, and standard status codes.

---

## 2. Technical Decisions & Industry Best Practices
- **Resource Prefixing**: All API paths will be prefixed with `/api/v1` to support API versioning. If we deploy major updates later, we can launch `/api/v2` without breaking existing clients.
- **REST Semantic Verbs**: 
  - `GET`: Retrieve data (e.g., fetch profile, get message logs).
  - `POST`: Create a resource (e.g., sign up, send message, join group).
  - `PUT`/`PATCH`: Update resource details (e.g., edit profile, change status).
  - `DELETE`: Remove resource references.
- **JWT Authorization Header**: Private routes look for the standard authorization header prefix `Bearer <JWT_TOKEN>`. This decouples user profiles from session records on the server.
- **HTTP Status Codes**:
  - `200 OK`: Request succeeded.
  - `201 Created`: Resource successfully created (e.g., message sent, account registered).
  - `400 Bad Request`: Validation failures (e.g., invalid email format, missing password).
  - `401 Unauthorized`: Token missing, expired, or invalid.
  - `403 Forbidden`: Authenticated, but lacking permission (e.g., non-admin trying to remove a member).
  - `404 Not Found`: Target conversation or user profile missing.
  - `500 Server Error`: Database connection dropping or code execution exception.

---

## 3. Directory Structure Layout
This documentation is stored under:

```text
Unify/
├── docs/
│   ├── requirements_analysis.md
│   ├── system_design.md
│   ├── database_design.md
│   └── api_design.md              # [NEW] This document
├── LICENSE
└── README.md
```

---

## 4. REST API Schema References

### A. Authentication Route (`/api/v1/auth`)

#### 1. Register User
- **Method**: `POST`
- **Path**: `/api/v1/auth/register`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex@unify.com",
    "password": "SecurePassword123"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "_id": "65b2d8c362a7b8e1f0e21234",
    "name": "Alex Mercer",
    "email": "alex@unify.com",
    "avatar": "",
    "token": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```

#### 2. Login User
- **Method**: `POST`
- **Path**: `/api/v1/auth/login`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "email": "alex@unify.com",
    "password": "SecurePassword123"
  }
  ```
- **Response (200 OK)**: Same as register output.

---

### B. User Profiles Route (`/api/v1/users`)

#### 1. Fetch Profile Info
- **Method**: `GET`
- **Path**: `/api/v1/users/profile`
- **Auth**: Private (`Bearer <Token>`)
- **Response (200 OK)**:
  ```json
  {
    "_id": "65b2d8c362a7b8e1f0e21234",
    "name": "Alex Mercer",
    "email": "alex@unify.com",
    "avatar": "/uploads/avatar-1234.jpg",
    "status": "online"
  }
  ```

#### 2. Search Users
- **Method**: `GET`
- **Path**: `/api/v1/users/search?q=alex`
- **Auth**: Private
- **Response (200 OK)**:
  ```json
  [
    {
      "_id": "65b2d8c362a7b8e1f0e21234",
      "name": "Alex Mercer",
      "email": "alex@unify.com",
      "avatar": "/uploads/avatar-1234.jpg"
    }
  ]
  ```

---

### C. Conversation Routes (`/api/v1/conversations`)

#### 1. Fetch Conversations Feed
- **Method**: `GET`
- **Path**: `/api/v1/conversations`
- **Auth**: Private
- **Response (200 OK)**:
  ```json
  [
    {
      "_id": "65b3e9a162a7b8e1f0e25678",
      "name": "Dev Team",
      "isGroup": true,
      "participants": [
        { "_id": "65b2d8c3...", "name": "Alex Mercer" },
        { "_id": "65b2d9d4...", "name": "Sarah Chen" }
      ],
      "admins": ["65b2d8c3..."],
      "latestMessage": {
        "_id": "65b3f112...",
        "content": "Make sure to push your PRs!",
        "sender": "65b2d8c3...",
        "createdAt": "2026-07-21T18:00:00.000Z"
      }
    }
  ]
  ```

#### 2. Create Group Conversation
- **Method**: `POST`
- **Path**: `/api/v1/conversations`
- **Auth**: Private
- **Request Body**:
  ```json
  {
    "name": "Design Sync",
    "participants": ["65b2d9d462a7b8e1f0e29999"],
    "isGroup": true
  }
  ```

---

### D. Message Routes (`/api/v1/messages`)

#### 1. Fetch Paginated History
- **Method**: `GET`
- **Path**: `/api/v1/messages/:conversationId?page=1&limit=20`
- **Auth**: Private
- **Response (200 OK)**:
  ```json
  {
    "messages": [
      {
        "_id": "65b3f11262a7b8e1f0e28888",
        "conversationId": "65b3e9a1...",
        "sender": { "_id": "65b2d8c3...", "name": "Alex Mercer" },
        "content": "Hey Sarah, did you review the mockups?",
        "mediaUrl": "",
        "status": "read",
        "createdAt": "2026-07-21T17:55:00.000Z"
      }
    ],
    "totalPages": 5,
    "currentPage": 1
  }
  ```

#### 2. Post a Message
- **Method**: `POST`
- **Path**: `/api/v1/messages`
- **Auth**: Private
- **Request Body**:
  ```json
  {
    "conversationId": "65b3e9a1...",
    "content": "Mockups look clean!"
  }
  ```
- **Response (201 Created)**: Returns the newly saved message document.

---

## 5. Common API Design Pitfalls to Avoid
- **Leaking Password Hashes**: Returning the password hash in the JSON response when fetching user details or listings. Always project out password fields (`.select("-password")`) in Mongoose queries.
- **Vulnerable ID Manipulations**: Trusting parameters like `senderId` in the body of a `/messages` payload. Always extract the sender's identity directly from the verified JWT payload (`req.user.id`) to prevent users from spoofing messages as other users.
