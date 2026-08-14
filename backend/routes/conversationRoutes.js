const express = require('express');
const router = express.Router();
const {
  fetchConversations,
  createGroupChat,
} = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');

// Fetch User Conversations Feed Endpoint
router.get('/', protect, fetchConversations);

// Create Group Chat Endpoint
router.post('/group', protect, createGroupChat);

module.exports = router;
