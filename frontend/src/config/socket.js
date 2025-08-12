import { io } from 'socket.io-client';

let socket = null;
const messageHandlers = new Map();

// Socket configuration with Redis support and 24-hour message retention
export const initializeSocket = (projectId) => {
  if (socket) {
    socket.disconnect();
  }

  try {
    // Initialize socket connection to your backend
    socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      auth: {
        token: localStorage.getItem('token'),
        projectId: projectId
      },
      query: {
        projectId: projectId
      }
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      // Join project room for real-time collaboration
      socket.emit('join-project', { projectId });
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      // Emit custom error event for UI handling
      window.dispatchEvent(new CustomEvent('socket_error', { 
        detail: { message: error.message || 'Connection failed' } 
      }));
    });

    // Authentication error handling
    socket.on('auth_error', (error) => {
      console.error('Socket authentication error:', error);
      window.dispatchEvent(new CustomEvent('socket_error', { 
        detail: { message: 'Authentication error: ' + error.message } 
      }));
    });

    // Store socket reference globally for cleanup
    window.socket = socket;

    return socket;
  } catch (error) {
    console.error('Failed to initialize socket:', error);
    window.dispatchEvent(new CustomEvent('socket_error', { 
      detail: { message: 'Failed to initialize socket connection' } 
    }));
    return null;
  }
};

// Send message with Redis storage (24-hour TTL)
export const sendMessage = (event, data) => {
  if (socket && socket.connected) {
    // Add timestamp and message ID for Redis storage
    const messageData = {
      ...data,
      timestamp: new Date().toISOString(),
      messageId: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      ttl: 24 * 60 * 60 // 24 hours in seconds
    };
    
    socket.emit(event, messageData);
  } else {
    console.warn('Socket not connected, message not sent:', event, data);
  }
};

// Receive message handler
export const receiveMessage = (event, handler) => {
  if (socket) {
    socket.on(event, handler);
    messageHandlers.set(event, handler);
  }
};

// Remove message handler
export const removeMessageHandler = (event) => {
  if (socket) {
    socket.off(event);
    messageHandlers.delete(event);
  }
};

// Get socket instance
export const getSocket = () => socket;

// Check if socket is connected
export const isSocketConnected = () => {
  return socket && socket.connected;
};

// Reconnect socket
export const reconnectSocket = () => {
  if (socket) {
    socket.connect();
  }
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    messageHandlers.clear();
    if (window.socket) {
      delete window.socket;
    }
  }
};

// Handle AI message processing
export const sendAIMessage = (message, projectId) => {
  if (socket && socket.connected) {
    const aiMessageData = {
      message: message,
      projectId: projectId,
      sender: {
        _id: 'ai-request',
        email: 'AI Assistant'
      },
      timestamp: new Date().toISOString(),
      messageId: Date.now() + '-ai-' + Math.random().toString(36).substr(2, 9),
      ttl: 24 * 60 * 60 // 24 hours
    };
    
    socket.emit('ai-message', aiMessageData);
  }
};

// Load cached messages from Redis
export const loadCachedMessages = (projectId, offset = 0, limit = 50) => {
  if (socket && socket.connected) {
    socket.emit('load-messages', { 
      projectId, 
      offset, 
      limit 
    });
  }
};

// Search messages in Redis
export const searchMessages = (projectId, searchTerm) => {
  if (socket && socket.connected) {
    socket.emit('search-messages', { 
      projectId, 
      searchTerm 
    });
  }
};

// Get message count from Redis
export const getMessageCount = (projectId) => {
  if (socket && socket.connected) {
    socket.emit('get-message-count', { projectId });
  }
};

// Export all socket events for easy reference
export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  AUTH_ERROR: 'auth_error',
  
  // Project events
  JOIN_PROJECT: 'join-project',
  LEAVE_PROJECT: 'leave-project',
  PROJECT_UPDATE: 'project-update',
  
  // Message events
  PROJECT_MESSAGE: 'project-message',
  AI_MESSAGE: 'ai-message',
  LOAD_MESSAGES: 'load-messages',
  SEARCH_MESSAGES: 'search-messages',
  SEARCH_RESULTS: 'search-results',
  MORE_MESSAGES_LOADED: 'more-messages-loaded',
  GET_MESSAGE_COUNT: 'get-message-count',
  MESSAGE_COUNT: 'message-count',
  
  // File events
  FILE_UPDATE: 'file-update',
  FILE_TREE_UPDATE: 'file-tree-update',
  
  // User events
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  USER_TYPING: 'user-typing',
  
  // Error events
  ERROR: 'error'
};