const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { getIO } = require('../config/socket');

/**
 * @desc    Fetch all conversations for the logged in user with unread message counts
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

    // Calculate unread count for each conversation dynamically
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          sender: { $ne: req.user._id },
          'readBy.user': { $ne: req.user._id },
        });

        const convObj = conv.toObject();
        convObj.unreadCount = unreadCount;
        return convObj;
      })
    );

    res.status(200).json({
      success: true,
      count: conversationsWithUnread.length,
      data: conversationsWithUnread,
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

    if (typeof users === 'string') {
      users = JSON.parse(users);
    }

    if (!Array.isArray(users) || users.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 additional users are required to form a group chat',
      });
    }

    users.push(req.user._id);

    const groupChat = await Conversation.create({
      name: name.trim(),
      isGroup: true,
      participants: users,
      admins: [req.user._id],
    });

    const fullGroupChat = await Conversation.findById(groupChat._id)
      .populate('participants', 'name email avatar status')
      .populate('admins', 'name email avatar');

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

/**
 * @desc    Rename a group chat title
 * @route   PUT /api/v1/conversations/group/rename
 * @access  Private (Protected by authMiddleware)
 */
const renameGroup = async (req, res) => {
  try {
    const { conversationId, name } = req.body;

    if (!conversationId || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide conversationId and new group name',
      });
    }

    const updatedGroup = await Conversation.findByIdAndUpdate(
      conversationId,
      { name: name.trim() },
      { new: true }
    )
      .populate('participants', 'name email avatar status')
      .populate('admins', 'name email avatar');

    if (!updatedGroup) {
      return res.status(404).json({
        success: false,
        message: 'Group conversation not found',
      });
    }

    try {
      const io = getIO();
      io.to(conversationId).emit('group_updated', updatedGroup);
    } catch (socketErr) {
      console.warn('Socket emit warning on group rename:', socketErr.message);
    }

    res.status(200).json({
      success: true,
      data: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error renaming group',
    });
  }
};

/**
 * @desc    Add a new member to an existing group chat
 * @route   PUT /api/v1/conversations/group/add
 * @access  Private (Protected by authMiddleware - Admin only)
 */
const addToGroup = async (req, res) => {
  try {
    const { conversationId, userId } = req.body;

    const group = await Conversation.findById(conversationId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group conversation not found',
      });
    }

    const isAdmin = group.admins.some((a) => a.toString() === req.user._id.toString());
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only group admins can add new members',
      });
    }

    const updatedGroup = await Conversation.findByIdAndUpdate(
      conversationId,
      { $addToSet: { participants: userId } },
      { new: true }
    )
      .populate('participants', 'name email avatar status')
      .populate('admins', 'name email avatar');

    try {
      const io = getIO();
      io.to(conversationId).emit('group_updated', updatedGroup);
      io.to(userId).emit('group_created', updatedGroup);
    } catch (socketErr) {
      console.warn('Socket emit warning on add member:', socketErr.message);
    }

    res.status(200).json({
      success: true,
      data: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error adding to group',
    });
  }
};

/**
 * @desc    Remove a member from a group chat or leave group
 * @route   PUT /api/v1/conversations/group/remove
 * @access  Private (Protected by authMiddleware - Admin or self leave)
 */
const removeFromGroup = async (req, res) => {
  try {
    const { conversationId, userId } = req.body;

    const group = await Conversation.findById(conversationId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group conversation not found',
      });
    }

    const isAdmin = group.admins.some((a) => a.toString() === req.user._id.toString());
    const isSelfRemove = userId === req.user._id.toString();

    if (!isAdmin && !isSelfRemove) {
      return res.status(403).json({
        success: false,
        message: 'Only group admins can remove members from the group',
      });
    }

    const updatedGroup = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $pull: { participants: userId, admins: userId },
      },
      { new: true }
    )
      .populate('participants', 'name email avatar status')
      .populate('admins', 'name email avatar');

    try {
      const io = getIO();
      io.to(conversationId).emit('group_updated', updatedGroup);
    } catch (socketErr) {
      console.warn('Socket emit warning on remove member:', socketErr.message);
    }

    res.status(200).json({
      success: true,
      data: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error removing from group',
    });
  }
};

module.exports = {
  fetchConversations,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
