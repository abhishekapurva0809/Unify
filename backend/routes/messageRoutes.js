const express = require('express');
const router = express.Router();
const {
  sendMessage,
  fetchMessages,
  markMessagesAsRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// Send Message Endpoint
router.post('/', protect, sendMessage);

// Fetch Conversation Messages Endpoint
router.get('/:conversationId', protect, fetchMessages);

// Mark Conversation Messages as Read Endpoint
router.put('/read/:conversationId', protect, markMessagesAsRead);

module.exports = router;
