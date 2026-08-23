import { Server } from 'socket.io';
import { env } from './env.js';

let ioInstance = null;

export function initSocket(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: [env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  ioInstance.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join room for specific execution timeline streaming
    socket.on('subscribe_execution', (executionId) => {
      socket.join(`execution:${executionId}`);
      console.log(`Socket ${socket.id} subscribed to execution:${executionId}`);
    });

    socket.on('unsubscribe_execution', (executionId) => {
      socket.leave(`execution:${executionId}`);
      console.log(`Socket ${socket.id} unsubscribed from execution:${executionId}`);
    });

    // Join room for user-specific real-time notifications
    socket.on('subscribe_user', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`Socket ${socket.id} subscribed to user:${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
}

export function getIO() {
  return ioInstance;
}

// Helper to send real-time logs to subscribed clients
export function emitExecutionEvent(executionId, eventData) {
  if (ioInstance) {
    ioInstance.to(`execution:${executionId}`).emit('execution_event', eventData);
    // Also emit a general system event for active feed updates if needed
    ioInstance.emit('system_execution_event', { executionId, ...eventData });
  }
}

// Helper to send real-time notifications to a specific user
export function emitNotificationEvent(userId, notification) {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit('new_notification', notification);
    ioInstance.emit('global_notification', notification); // global broadcast fallback
  }
}
