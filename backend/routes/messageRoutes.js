const express = require('express');
const router = express.Router();
const {
  sendMessage,
  fetchMessages,
  markMessagesAsRead,
  uploadMessageAttachment,
  searchMessages,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Send Message Endpoint
router.post('/', protect, sendMessage);

// Upload Media Attachment Endpoint
router.post('/upload', protect, upload.single('file'), uploadMessageAttachment);

// Search Messages Content Endpoint
router.get('/search/query', protect, searchMessages);

// Fetch Conversation Messages Endpoint
router.get('/:conversationId', protect, fetchMessages);

// Mark Conversation Messages as Read Endpoint
router.put('/read/:conversationId', protect, markMessagesAsRead);

module.exports = router;
