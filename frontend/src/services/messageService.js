import API from './api';

/**
 * Message & Conversation API Services
 */

// Send a new message or initiate a 1-to-1 conversation
export const sendMessageApi = async (messageData) => {
  const response = await API.post('/messages', messageData);
  return response.data;
};

// Fetch message history for a specific conversation ID
export const fetchMessagesApi = async (conversationId) => {
  const response = await API.get(`/messages/${conversationId}`);
  return response.data;
};

// Fetch conversation list feed for the logged in user
export const fetchConversationsApi = async () => {
  const response = await API.get('/conversations');
  return response.data;
};

// Mark all unread messages in a conversation as read
export const markMessagesAsReadApi = async (conversationId) => {
  const response = await API.put(`/messages/read/${conversationId}`);
  return response.data;
};

// Create a new group chat conversation
export const createGroupChatApi = async (groupData) => {
  const response = await API.post('/conversations/group', groupData);
  return response.data;
};

// Rename an existing group chat
export const renameGroupApi = async (data) => {
  const response = await API.put('/conversations/group/rename', data);
  return response.data;
};

// Add a user to a group chat
export const addToGroupApi = async (data) => {
  const response = await API.put('/conversations/group/add', data);
  return response.data;
};

// Remove a user from a group chat or leave group
export const removeFromGroupApi = async (data) => {
  const response = await API.put('/conversations/group/remove', data);
  return response.data;
};
