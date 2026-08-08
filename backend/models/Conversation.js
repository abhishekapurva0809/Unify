const mongoose = require('mongoose');

/**
 * Conversation Schema Definition
 * Represents a 1-to-1 or Group Chat room between users.
 */
const conversationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: '', // Left blank for 1-to-1 direct chats, populated for group chats
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
