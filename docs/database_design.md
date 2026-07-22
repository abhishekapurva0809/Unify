# Database Schema Design — Unify

This document outlines the data model, database entities, validation rules, indexing configurations, and schema properties designed for the **Unify** database layer.

---

## 1. Goal of Step 1.4: Database Design
To structure a high-performance MongoDB schema using **Mongoose ODM** that balances rapid message writes with fast conversation listings.

---

## 2. Technical Decisions & Industry Best Practices
- **Referencing vs. Embedding**:
  - We **reference** user profiles (`participants: [ObjectId]`) instead of embedding the entire user document in a conversation. This prevents data duplication and simplifies profile updates (like a user changing their name or avatar).
  - We **reference** messages by matching `conversationId: ObjectId` inside each message document instead of embedding messages inside a conversation document. Since conversations can have thousands of messages, embedding them would quickly hit MongoDB's 16MB document size limit.
- **Strategic Indexing**:
  - `email` on the User Schema is unique and indexed for fast authentication.
  - `conversationId` on the Message Schema is indexed. When a user opens a chat, fetching the messages requires query filters like `.find({ conversationId })`. An index avoids table scans, keeping search speeds under 5ms.
- **Timestamps**:
  - Enabling Mongoose's `{ timestamps: true }` automatically adds `createdAt` and `updatedAt` properties, which we use to sort chat messages and conversation feeds chronologically.

---

## 3. Database Collection Relationships

```text
  +--------------------------------+
  |           User Schema          |
  |  - _id: ObjectId               |
  |  - name: String                |
  |  - email: String (Indexed)     |
  |  - password: String            |
  |  - avatar: String              |
  |  - status: String              |
  +--------------------------------+
                  ^
                  | (References via User ObjectId)
                  |
  +---------------+---------------+     +-----------------------------------+
  |      Conversation Schema       |     |           Message Schema          |
  |  - _id: ObjectId               |     |  - _id: ObjectId                  |
  |  - name: String                |     |  - conversationId: ObjectId (Idx) |
  |  - isGroup: Boolean            |<----+  - sender: ObjectId (ref: 'User') |
  |  - participants: [ObjectId]    |     |  - content: String                |
  |  - admins: [ObjectId]          |     |  - mediaUrl / mediaType: String   |
  |  - latestMessage: ObjectId     |     |  - readBy: [{ user, readAt }]     |
  +--------------------------------+     +-----------------------------------+
```

---

## 4. Folder Structure Layout
This documentation is stored under:

```text
Unify/
├── docs/
│   ├── requirements_analysis.md
│   ├── system_design.md
│   └── database_design.md         # [NEW] This document
├── LICENSE
└── README.md
```

---

## 5. Schema Implementations (Mongoose Blueprint Code)

### A. User Schema (`User.js`)
```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    index: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, "Password is required"]
  },
  avatar: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away', 'busy'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });
```

### B. Conversation Schema (`Conversation.js`)
```javascript
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  name: {
    type: String,
    default: "" // Left blank for 1-to-1 chats, populated for groups
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  latestMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, { timestamps: true });
```

### C. Message Schema (`Message.js`)
```javascript
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true // Highly critical for fast message listing
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    default: ""
  },
  mediaUrl: {
    type: String,
    default: ""
  },
  mediaType: {
    type: String,
    enum: ['image', 'file', ''],
    default: ''
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reaction: {
      type: String // Emoji unicode or string value
    }
  }]
}, { timestamps: true });
```

---

## 6. Common Database Mistakes to Avoid
- **Unindexed Foreign Keys**: Forgetting to add `index: true` on fields like `conversationId` and `email`. Without indexes, queries scale linearly ($O(N)$), causing severe lag when collections hit thousands of rows.
- **Storing Encrypted Passwords in Plain-Text**: Never save plain passwords to MongoDB. We will use `bcrypt` middleware in our model schemas to auto-hash passwords before saving.

---

## 7. Interview Questions & Production Practice
- **Q**: *What is MongoDB's Document Size Limit and how does it affect design?*
  - **A**: MongoDB has a hard limit of 16MB per document. If we embedded messages inside the conversation document, a highly active group chat would quickly exceed 16MB, throwing database write errors and crashing the chat. Referencing messages as independent documents in a `/messages` collection solves this completely.
- **Production Tip**: High-scale platforms like Discord use wide-column stores (like Cassandra or ScyllaDB) for message history due to horizontal partition benefits, but MongoDB Atlas remains the most flexible NoSQL database for rapid scaling in MERN-stack architectures.
