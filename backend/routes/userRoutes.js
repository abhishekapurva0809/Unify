const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  searchUsers,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Protected User Routes (Requires Bearer Token)
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Search Users Endpoint
router.get('/search', protect, searchUsers);

module.exports = router;
