const express = require('express');
const router = express.Router();
const {
  fetchConversations,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
} = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');

// Fetch User Conversations Feed Endpoint
router.get('/', protect, fetchConversations);

// Group Chat Routes
router.post('/group', protect, createGroupChat);
router.put('/group/rename', protect, renameGroup);
router.put('/group/add', protect, addToGroup);
router.put('/group/remove', protect, removeFromGroup);

module.exports = router;
