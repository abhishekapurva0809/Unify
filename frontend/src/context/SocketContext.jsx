import React, { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import useAuth from '../hooks/useAuth';

export const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:8090';

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    let socketInstance = null;

    if (isAuthenticated && user) {
      // Connect to Socket.IO Server
      socketInstance = io(SOCKET_URL, {
        reconnection: true,
        reconnectionAttempts: 5,
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

      // Clean up connection when user unmounts or logs out
      return () => {
        console.log('⚡ CLIENT SOCKET: Disconnecting socket...');
        socketInstance.disconnect();
        setSocket(null);
        setSocketConnected(false);
      };
    } else {
      setSocketConnected(false);
      setSocket(null);
    }
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        socketConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
