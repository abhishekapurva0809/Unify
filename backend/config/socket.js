const { Server } = require('socket.io');

let io;

/**
 * Initializes Socket.IO server attached to Node HTTP server
 * @param {Object} server - Node.js HTTP server instance
 * @returns {Object} - Initialized Socket.IO instance
 */
const initSocket = (server) => {
  io = new Server(server, {
    pingTimeout: 60000, // Close connection if inactive for 60 seconds
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Listen for WebSocket client connections
  io.on('connection', (socket) => {
    console.log(`⚡ SOCKET: Client connected [socket.id: ${socket.id}]`);

    /**
     * Event: setup
     * Joins user to their private notification room (named after their userId)
     */
    socket.on('setup', (userData) => {
      if (userData && userData._id) {
        socket.join(userData._id);
        console.log(`⚡ SOCKET: User ${userData._id} joined private notification room`);
        socket.emit('connected');
      }
    });

    /**
     * Event: join_chat
     * Joins socket to a specific conversation room
     */
    socket.on('join_chat', (room) => {
      if (room) {
        socket.join(room);
        console.log(`⚡ SOCKET: Socket ${socket.id} joined conversation room: ${room}`);
      }
    });

    /**
     * Event: typing
     * Broadcasts typing status to room members except sender
     */
    socket.on('typing', (room) => {
      if (room) {
        socket.in(room).emit('typing', room);
      }
    });

    /**
     * Event: stop_typing
     * Broadcasts stop typing status to room members except sender
     */
    socket.on('stop_typing', (room) => {
      if (room) {
        socket.in(room).emit('stop_typing', room);
      }
    });

    /**
     * Event: disconnect
     * Fires when client socket drops or closes connection
     */
    socket.on('disconnect', () => {
      console.log(`⚡ SOCKET: Client disconnected [socket.id: ${socket.id}]`);
    });
  });

  return io;
};

/**
 * Returns the active Socket.IO server instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
};
