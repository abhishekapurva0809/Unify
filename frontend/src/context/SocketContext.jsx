import React, { createContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import useAuth from '../hooks/useAuth';

export const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:8090';

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);

  useEffect(() => {
    let socketInstance = null;

    if (isAuthenticated && user) {
      // Connect to Socket.IO Server
      socketInstance = io(SOCKET_URL, {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      setSocket(socketInstance);

      // Emit 'setup' event with user details upon connection
      socketInstance.on('connect', () => {
        console.log('⚡ CLIENT SOCKET: Connected with ID:', socketInstance.id);
        socketInstance.emit('setup', user);
      });

      // Listen for confirmation from server
      socketInstance.on('connected', () => {
        console.log('⚡ CLIENT SOCKET: Server confirmed setup room registration');
        setSocketConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('⚡ CLIENT SOCKET: Disconnected from server');
        setSocketConnected(false);
      });

      socketInstance.on('connect_error', (err) => {
        console.warn('⚡ CLIENT SOCKET: Connection error:', err.message);
        setSocketConnected(false);
      });

      // Clean up connection when user unmounts or logs out
      return () => {
        console.log('⚡ CLIENT SOCKET: Cleaning up connection...');
        socketInstance.disconnect();
        setSocket(null);
        setSocketConnected(false);
        setActiveRoom(null);
      };
    } else {
      setSocketConnected(false);
      setSocket(null);
      setActiveRoom(null);
    }
  }, [isAuthenticated, user]);

  /**
   * Room Management Helper: joinChat
   * Emits join_chat event to subscribe client socket to a specific conversation room
   */
  const joinChat = useCallback((roomId) => {
    if (socket && roomId) {
      socket.emit('join_chat', roomId);
      setActiveRoom(roomId);
      console.log(`⚡ CLIENT SOCKET: Joined room: ${roomId}`);
    }
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        socketConnected,
        activeRoom,
        joinChat,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
