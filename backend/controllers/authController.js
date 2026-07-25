const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new user account
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validation: Ensure required fields are present
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, password)',
      });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email address',
      });
    }

    // 3. Create new user in database (Password auto-hashed via User model pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      // 4. Return user profile and signed JWT token
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          status: user.status,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data received',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error during user registration',
    });
  }
};

module.exports = {
  registerUser,
};
