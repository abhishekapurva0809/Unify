const express = require('express');
const router = express.Router();
const { registerUser } = require('../controllers/authController');

// @route   POST /api/v1/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', registerUser);

module.exports = router;
