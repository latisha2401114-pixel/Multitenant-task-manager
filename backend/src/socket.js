const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // For development
      methods: ['GET', 'POST']
    }
  });

  // Socket middleware for JWT authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // Payload includes userId, tenantId, role
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const tenantId = socket.user.tenantId;
    
    // Authenticated socket explicitly joins the room specific to their tenantId
    if (tenantId) {
      socket.join(tenantId);
      console.log(`[Socket.IO] Client connected - Joined tenant room: ${tenantId}`);
    }

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
};

module.exports = {
  initSocket,
  getIo
};
