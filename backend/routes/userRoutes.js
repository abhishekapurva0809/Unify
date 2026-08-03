const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  searchUsers,
  uploadAvatar,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Protected User Routes (Requires Bearer Token)
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Search Users Endpoint
router.get('/search', protect, searchUsers);

// Upload Avatar Endpoint
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

module.exports = router;
