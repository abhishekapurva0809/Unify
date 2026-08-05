import { useContext } from 'react';
import { SocketContext } from '../context/SocketContext';

/**
 * Custom Hook: useSocket
 * Provides easy access to active socket connection and socket status
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default useSocket;
