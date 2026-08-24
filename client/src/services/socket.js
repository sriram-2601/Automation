import { io } from 'socket.io-client';

let SOCKET_URL = 'http://localhost:5001';

if (typeof window !== 'undefined') {
  if (window.location.hostname !== 'localhost') {
    SOCKET_URL = window.location.origin;
  } else {
    if (window.location.port === '3000') {
      SOCKET_URL = 'http://localhost:5001';
    } else {
      SOCKET_URL = window.location.origin;
    }
  }
}

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('Socket.IO client connected to server');
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO client disconnected from server');
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}

export function subscribeToExecution(executionId, onEventCallback) {
  const s = connectSocket();
  
  s.emit('subscribe_execution', executionId);
  
  // Listen for execution step updates
  s.on('execution_event', onEventCallback);

  return () => {
    s.emit('unsubscribe_execution', executionId);
    s.off('execution_event', onEventCallback);
  };
}

export function subscribeToUserNotifications(userId, onNotificationCallback) {
  const s = connectSocket();
  
  s.emit('subscribe_user', userId);
  
  s.on('new_notification', onNotificationCallback);
  s.on('global_notification', onNotificationCallback);

  return () => {
    s.off('new_notification', onNotificationCallback);
    s.off('global_notification', onNotificationCallback);
  };
}
