const express = require('express');
const router = express.Router();
const { sendMessage, fetchMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// Send Message Endpoint
router.post('/', protect, sendMessage);

// Fetch Conversation Messages Endpoint
router.get('/:conversationId', protect, fetchMessages);

module.exports = router;
