const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { getIO } = require('../config/socket');

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

/**
 * @desc    Create a new Group Chat conversation
 * @route   POST /api/v1/conversations/group
 * @access  Private (Protected by authMiddleware)
 */
const createGroupChat = async (req, res) => {
  try {
    let { name, users } = req.body;

    if (!name || !users) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a group name and select group members',
      });
    }

    // Handle JSON stringified arrays or raw arrays
    if (typeof users === 'string') {
      users = JSON.parse(users);
    }

    if (!Array.isArray(users) || users.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 additional users are required to form a group chat',
      });
    }

    // Include the creator in the participants list
    users.push(req.user._id);

    // Create group conversation document
    const groupChat = await Conversation.create({
      name: name.trim(),
      isGroup: true,
      participants: users,
      admins: [req.user._id], // Creator becomes initial admin
    });

    const fullGroupChat = await Conversation.findById(groupChat._id)
      .populate('participants', 'name email avatar status')
      .populate('admins', 'name email avatar');

    // Real-time Socket.IO notification to all group members
    try {
      const io = getIO();
      fullGroupChat.participants.forEach((participant) => {
        io.to(participant._id.toString()).emit('group_created', fullGroupChat);
      });
    } catch (socketErr) {
      console.warn('Socket emit warning on group creation:', socketErr.message);
    }

    res.status(201).json({
      success: true,
      data: fullGroupChat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error creating group chat',
    });
  }
};

module.exports = {
  fetchConversations,
  createGroupChat,
};
