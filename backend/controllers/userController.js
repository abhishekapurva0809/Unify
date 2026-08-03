const User = require('../models/User');

/**
 * @desc    Get logged in user profile
 * @route   GET /api/v1/users/profile
 * @access  Private (Protected by authMiddleware)
 */
const getUserProfile = async (req, res) => {
  try {
    // req.user is attached by authMiddleware after token verification
    const user = await User.findById(req.user._id);

    if (user) {
      res.status(200).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          status: user.status,
          lastSeen: user.lastSeen,
          createdAt: user.createdAt,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching profile',
    });
  }
};

/**
 * @desc    Update user profile details (name, status)
 * @route   PUT /api/v1/users/profile
 * @access  Private (Protected by authMiddleware)
 */
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.status = req.body.status || user.status;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.status(200).json({
        success: true,
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
          status: updatedUser.status,
          lastSeen: updatedUser.lastSeen,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile',
    });
  }
};

/**
 * @desc    Search registered users by name or email
 * @route   GET /api/v1/users/search?q=keyword
 * @access  Private (Protected by authMiddleware)
 */
const searchUsers = async (req, res) => {
  try {
    const keyword = req.query.q || req.query.search;

    if (!keyword) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Build regex search filter matching name or email (case-insensitive)
    const searchFilter = {
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
      ],
      // Exclude the currently logged-in user from search results
      _id: { $ne: req.user._id },
    };

    const users = await User.find(searchFilter)
      .select('name email avatar status lastSeen')
      .limit(20);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error searching users',
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  searchUsers,
};
