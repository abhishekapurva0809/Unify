import { useContext } from 'react';
import { ChatContext } from '../context/ChatContext';

/**
 * Custom Hook: useChat
 * Provides access to global chat state, message history, and messaging actions
 */
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default useChat;
