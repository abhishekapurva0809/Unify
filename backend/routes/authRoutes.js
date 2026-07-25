const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// @route   POST /api/v1/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/v1/auth/login
// @desc    Authenticate user & return JWT token
// @access  Public
router.post('/login', loginUser);

module.exports = router;
