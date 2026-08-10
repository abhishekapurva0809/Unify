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
