const Conversation = require('../models/Conversation');

/**
 * @desc    Fetch all conversations for the logged in user
 * @route   GET /api/v1/conversations
 * @access  Private (Protected by authMiddleware)
 */
const fetchConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: { $elemMatch: { $eq: req.user._id } },
    })
      .populate('participants', 'name email avatar status lastSeen')
      .populate('admins', 'name email avatar')
      .populate({
        path: 'latestMessage',
        populate: {
          path: 'sender',
          select: 'name email avatar',
        },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error fetching conversations',
    });
  }
};

module.exports = {
  fetchConversations,
};
