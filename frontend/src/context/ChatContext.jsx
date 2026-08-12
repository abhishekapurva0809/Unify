import React, { createContext, useState, useEffect, useCallback } from 'react';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import {
  fetchConversationsApi,
  fetchMessagesApi,
  sendMessageApi,
  markMessagesAsReadApi,
} from '../services/messageService';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { socket, socketConnected, joinChat } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // 1. Fetch Conversations Feed on Load
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingConversations(true);
      const response = await fetchConversationsApi();
      if (response.success) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error.message);
    } finally {
      setLoadingConversations(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Mark Messages as Read helper
  const markAsRead = useCallback(async (chatId) => {
    if (!chatId) return;
    try {
      await markMessagesAsReadApi(chatId);
    } catch (err) {
      console.error('Error marking messages as read:', err.message);
    }
  }, []);

  // 2. Select a Conversation & Load Message History
  const selectConversation = useCallback(
    async (chat) => {
      setSelectedChat(chat);
      setIsTyping(false);
      const chatId = chat._id;

      // Join socket room
      joinChat(chatId);

      // Mark messages as read on server
      markAsRead(chatId);

      try {
        setLoadingMessages(true);
        const response = await fetchMessagesApi(chatId);
        if (response.success) {
          setMessages(response.data);
        }
      } catch (error) {
        console.error('Error fetching message history:', error.message);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [joinChat, markAsRead]
  );

  // 3. Send Message Action
  const sendMessage = async ({ content, mediaUrl, mediaType, recipientId }) => {
    try {
      const payload = {
        conversationId: selectedChat ? selectedChat._id : undefined,
        recipientId: !selectedChat ? recipientId : undefined,
        content,
        mediaUrl,
        mediaType,
      };

      const response = await sendMessageApi(payload);
      if (response.success) {
        const newMsg = response.data;

        // Append to active message thread
        setMessages((prev) => [...prev, newMsg]);

        // Stop typing indicator on message send
        if (selectedChat && socket && socketConnected) {
          socket.emit('stop_typing', selectedChat._id);
        }

        // Refresh conversation feed
        await loadConversations();

        // If starting new conversation, set as active
        if (!selectedChat && newMsg.conversationId) {
          const conversationObj =
            typeof newMsg.conversationId === 'object'
              ? newMsg.conversationId
              : { _id: newMsg.conversationId };
          setSelectedChat(conversationObj);
          joinChat(conversationObj._id);
        }
        return response;
      }
    } catch (error) {
      console.error('Error sending message:', error.message);
      throw error;
    }
  };

  // 4. Emit Typing Events
  const sendTyping = useCallback(() => {
    if (socket && socketConnected && selectedChat && selectedChat._id) {
      socket.emit('typing', selectedChat._id);
    }
  }, [socket, socketConnected, selectedChat]);

  const sendStopTyping = useCallback(() => {
    if (socket && socketConnected && selectedChat && selectedChat._id) {
      socket.emit('stop_typing', selectedChat._id);
    }
  }, [socket, socketConnected, selectedChat]);

  // 5. Real-Time Socket Event Listeners
  useEffect(() => {
    if (!socket || !socketConnected) return;

    // Incoming Real-Time Message Event Listener
    const handleMessageReceived = (newMessage) => {
      console.log('⚡ REALTIME: Received new message:', newMessage);

      const targetConversationId =
        typeof newMessage.conversationId === 'object'
          ? newMessage.conversationId._id
          : newMessage.conversationId;

      if (selectedChat && selectedChat._id === targetConversationId) {
        setMessages((prevMessages) => {
          if (prevMessages.some((m) => m._id === newMessage._id)) {
            return prevMessages;
          }
          return [...prevMessages, newMessage];
        });

        // Automatically mark incoming active chat message as read
        markAsRead(targetConversationId);
      }

      loadConversations();
    };

    // Incoming Typing Events
    const handleTyping = (room) => {
      if (selectedChat && selectedChat._id === room) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (room) => {
      if (selectedChat && selectedChat._id === room) {
        setIsTyping(false);
      }
    };

    // Real-Time Read Receipts Event Listener
    const handleMessagesRead = ({ conversationId }) => {
      if (selectedChat && selectedChat._id === conversationId) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) => ({
            ...msg,
            status: 'read',
          }))
        );
      }
    };

    socket.on('message_received', handleMessageReceived);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('message_received', handleMessageReceived);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, socketConnected, selectedChat, loadConversations, markAsRead]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        selectedChat,
        messages,
        loadingConversations,
        loadingMessages,
        isTyping,
        selectConversation,
        sendMessage,
        sendTyping,
        sendStopTyping,
        markAsRead,
        loadConversations,
        setSelectedChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
