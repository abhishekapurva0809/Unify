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

    // 1. If conversationId is not provided but recipientId is, find or create 1-to-1 conversation
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

    // 2. Create the message document
    const newMessage = await Message.create({
      sender: req.user._id,
      conversationId: targetConversationId,
      content: content || '',
      mediaUrl: mediaUrl || '',
      mediaType: mediaType || '',
    });

    // 3. Update Conversation's latestMessage reference
    await Conversation.findByIdAndUpdate(targetConversationId, {
      latestMessage: newMessage._id,
    });

    // 4. Populate message details for client response
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

    // 5. Emit real-time Socket.IO event to room participants
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

    // Update messages in this conversation sent by other users
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

    // Emit real-time read receipt event to room subscribers
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

module.exports = {
  sendMessage,
  fetchMessages,
  markMessagesAsRead,
};
