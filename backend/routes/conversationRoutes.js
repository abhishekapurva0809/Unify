const express = require('express');
const router = express.Router();
const { fetchConversations } = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');

// Fetch User Conversations Feed Endpoint
router.get('/', protect, fetchConversations);

module.exports = router;
