const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { getIO } = require('../config/socket');

/**
 * @desc    Send a new message in a conversation (or start a 1-to-1 chat)
 * @route   POST /api/v1/messages
 * @access  Private (Protected by authMiddleware)
 */
const sendMessage = async (req, res) => {
  try {
    const { conversationId, recipientId, content, mediaUrl, mediaType } = req.body;

    if (!content && !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Message content or media attachment is required',
      });
    }

    let targetConversationId = conversationId;

    if (!targetConversationId && recipientId) {
      let existingChat = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [req.user._id, recipientId] },
      });

      if (!existingChat) {
        existingChat = await Conversation.create({
          isGroup: false,
          participants: [req.user._id, recipientId],
        });
      }

      targetConversationId = existingChat._id;
    }

    if (!targetConversationId) {
      return res.status(400).json({
        success: false,
        message: 'Please specify a valid conversationId or recipientId',
      });
    }

    const newMessage = await Message.create({
      sender: req.user._id,
      conversationId: targetConversationId,
      content: content || '',
      mediaUrl: mediaUrl || '',
      mediaType: mediaType || '',
    });

    await Conversation.findByIdAndUpdate(targetConversationId, {
      latestMessage: newMessage._id,
    });

    let populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name email avatar status')
      .populate({
        path: 'conversationId',
        select: 'name isGroup participants',
        populate: {
          path: 'participants',
          select: 'name email avatar status',
        },
      });

    try {
      const io = getIO();
      const conversation = populatedMessage.conversationId;

      if (conversation && conversation.participants) {
        conversation.participants.forEach((participant) => {
          if (participant._id.toString() !== req.user._id.toString()) {
            io.to(participant._id.toString()).emit('message_received', populatedMessage);
          }
        });
      }
    } catch (socketErr) {
      console.warn('Socket emit warning:', socketErr.message);
    }

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error sending message',
    });
  }
};

/**
 * @desc    Fetch all messages for a specific conversation
 * @route   GET /api/v1/messages/:conversationId
 * @access  Private (Protected by authMiddleware)
 */
const fetchMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this conversation.',
      });
    }

    const messages = await Message.find({ conversationId })
      .populate('sender', 'name email avatar status')
      .populate('reactions.user', 'name avatar')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error fetching messages',
    });
  }
};

/**
 * @desc    Mark all messages in a conversation as read by logged in user
 * @route   PUT /api/v1/messages/read/:conversationId
 * @access  Private (Protected by authMiddleware)
 */
const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id },
      },
      {
        $set: { status: 'read' },
        $push: { readBy: { user: req.user._id, readAt: new Date() } },
      }
    );

    try {
      const io = getIO();
      io.to(conversationId).emit('messages_read', {
        conversationId,
        readByUserId: req.user._id,
      });
    } catch (socketErr) {
      console.warn('Socket emit warning on read receipts:', socketErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error marking messages as read',
    });
  }
};

/**
 * @desc    Upload an image or document file attachment for a chat message
 * @route   POST /api/v1/messages/upload
 * @access  Private (Protected by authMiddleware & uploadMiddleware)
 */
const uploadMessageAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a file to upload',
      });
    }

    const isImage = req.file.mimetype.startsWith('image/');
    const mediaType = isImage ? 'image' : 'file';
    const mediaUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'File attachment uploaded successfully',
      data: {
        mediaUrl,
        mediaType,
        originalName: req.file.originalname,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error uploading media attachment',
    });
  }
};

/**
 * @desc    Search message content across user's conversations
 * @route   GET /api/v1/messages/search/query?q=keyword
 * @access  Private (Protected by authMiddleware)
 */
const searchMessages = async (req, res) => {
  try {
    const keyword = req.query.q || req.query.query;

    if (!keyword || !keyword.trim()) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const userConversations = await Conversation.find({
      participants: { $elemMatch: { $eq: req.user._id } },
    }).select('_id');

    const conversationIds = userConversations.map((c) => c._id);

    const messages = await Message.find({
      conversationId: { $in: conversationIds },
      content: { $regex: keyword.trim(), $options: 'i' },
    })
      .populate('sender', 'name email avatar status')
      .populate({
        path: 'conversationId',
        select: 'name isGroup participants',
        populate: {
          path: 'participants',
          select: 'name email avatar status',
        },
      })
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error searching messages',
    });
  }
};

/**
 * @desc    Toggle emoji reaction on a message
 * @route   PUT /api/v1/messages/react/:messageId
 * @access  Private (Protected by authMiddleware)
 */
const toggleMessageReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reaction } = req.body;

    if (!reaction) {
      return res.status(400).json({
        success: false,
        message: 'Reaction emoji is required',
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (existingReactionIndex > -1) {
      if (message.reactions[existingReactionIndex].reaction === reaction) {
        // Toggle off if same reaction clicked again
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // Update to new reaction
        message.reactions[existingReactionIndex].reaction = reaction;
      }
    } else {
      // Add new reaction
      message.reactions.push({
        user: req.user._id,
        reaction,
      });
    }

    await message.save();

    const updatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar status')
      .populate('reactions.user', 'name avatar');

    // Broadcast updated message reactions over WebSockets
    try {
      const io = getIO();
      io.to(message.conversationId.toString()).emit('message_reaction_updated', updatedMessage);
    } catch (socketErr) {
      console.warn('Socket emit warning on reaction update:', socketErr.message);
    }

    res.status(200).json({
      success: true,
      data: updatedMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error updating reaction',
    });
  }
};

module.exports = {
  sendMessage,
  fetchMessages,
  markMessagesAsRead,
  uploadMessageAttachment,
  searchMessages,
  toggleMessageReaction,
};
