import io from 'socket.io-client';
import { API_URL } from './config';

let socket = null;
let reconnectTimer = null;

/**
 * Initialize a socket connection for a specific project
 * @param {string} projectId - The ID of the project to connect to
 * @returns {object} - The socket instance
 */
export const initializeSocket = (projectId) => {
    try {
        if (socket) {
            // If we have a previous connection, clean it up first
            cleanupSocket();
        }

        console.log(`Initializing socket connection to ${API_URL} for project ${projectId}`);

        // Get auth token from localStorage
        const authToken = localStorage.getItem('authToken');
        
        // Debug logging
        console.log('Socket connection with token?', !!authToken);
        
        // Create socket connection with improved auth options
        socket = io(API_URL, {
            withCredentials: true, // Enable sending cookies
            auth: { token: authToken }, // Always send token in auth object
            query: {
                projectId: projectId
            },
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            timeout: 20000,
            forceNew: true, // Force a new connection
            transports: ['websocket', 'polling'], // Try WebSocket first, then fallback to polling
            extraHeaders: authToken ? {
                'Authorization': `Bearer ${authToken}`
            } : {}
        });

        // Set up connection event handlers
        socket.on('connect', () => {
            console.log('Socket connected successfully', socket.id);
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }
            window.socket = socket;
            
            // Dispatch connection event for UI components
            window.dispatchEvent(new CustomEvent('socket_connected', { 
                detail: { socketId: socket.id } 
            }));
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
            
            // Special handling for auth errors
            if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
                console.warn('Authentication error in socket connection. Trying to refresh auth...');
                
                // Attempt to refresh authentication if this looks like an auth error
                // This will trigger the UserContext to attempt re-auth via axios interceptor
                window.dispatchEvent(new CustomEvent('auth_refresh_needed'));
                
                // Try to reconnect using token from localStorage in case cookie is not working
                const latestToken = localStorage.getItem('authToken');
                if (latestToken) {
                    socket.auth = { token: latestToken };
                    socket.io.opts.extraHeaders = {
                        'Authorization': `Bearer ${latestToken}`
                    };
                }
                
                // Schedule a reconnection attempt
                if (!reconnectTimer) {
                    reconnectTimer = setTimeout(() => {
                        console.log('Attempting to reconnect socket after auth refresh...');
                        if (socket) {
                            socket.connect();
                        }
                        reconnectTimer = null;
                    }, 5000); // Give time for auth refresh to complete
                }
            }
            
            // Show error in UI if needed
            window.dispatchEvent(new CustomEvent('socket_error', { 
                detail: { 
                    type: 'CONNECT_ERROR',
                    message: 'Failed to connect to the server. Please check if you are logged in.' 
                } 
            }));
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            
            window.dispatchEvent(new CustomEvent('socket_disconnected', { 
                detail: { reason } 
            }));
            
            if (reason === 'io server disconnect' || reason === 'transport close') {
                // Server disconnected us, try to reconnect after a short delay
                if (!reconnectTimer) {
                    reconnectTimer = setTimeout(() => {
                        console.log('Attempting to reconnect after disconnect...');
                        // Try to reconnect using token from localStorage
                        const latestToken = localStorage.getItem('authToken');
                        if (latestToken) {
                            socket.auth = { token: latestToken };
                            socket.io.opts.extraHeaders = {
                                'Authorization': `Bearer ${latestToken}`
                            };
                        }
                        socket.connect();
                        reconnectTimer = null;
                    }, 3000);
                }
            }
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
            
            // Show error in UI
            window.dispatchEvent(new CustomEvent('socket_error', { 
                detail: typeof error === 'object' ? error : { message: error } 
            }));
        });

        // Listen for auth events
        socket.on('authentication_failed', (details) => {
            console.error('Socket authentication failed:', details);
            
            // Refresh auth or redirect to login
            window.dispatchEvent(new CustomEvent('auth_expired', { 
                detail: { message: 'Your session has expired. Please log in again.' } 
            }));
        });

        window.socket = socket;
        return socket;
    } catch (error) {
        console.error('Error initializing socket:', error);
        return null;
    }
};

/**
 * Send a message via the socket connection
 * @param {string} event - The event name to emit
 * @param {object} data - The data to send
 * @returns {boolean} - Whether the message was sent successfully
 */
export const sendMessage = (event, data) => {
    try {
        if (!socket) {
            console.error('Cannot send message: Socket not initialized');
            return false;
        }

        if (!socket.connected) {
            console.warn('Socket not connected when trying to send message. Reconnecting...');
            
            // Try to refresh auth token before reconnecting
            const latestToken = localStorage.getItem('authToken');
            if (latestToken) {
                socket.auth = { token: latestToken };
                socket.io.opts.extraHeaders = {
                    'Authorization': `Bearer ${latestToken}`
                };
            }
            
            socket.connect();
            
            // Queue message to be sent after reconnection
            socket.once('connect', () => {
                console.log(`Sending delayed ${event} after reconnection`);
                socket.emit(event, data);
            });
            
            return false;
        }

        // Send the message
        socket.emit(event, data);
        return true;
    } catch (error) {
        console.error('Error sending message:', error);
        return false;
    }
};

/**
 * Set up a callback for receiving messages of a specific event type
 * @param {string} event - The event name to listen for
 * @param {function} callback - The callback function to execute when the event is received
 */
export const receiveMessage = (event, callback) => {
    try {
        if (!socket) {
            console.error('Cannot receive messages: Socket not initialized');
            return;
        }

        // Remove any existing listeners for this event
        socket.off(event);
        
        // Add the new listener with error handling
        socket.on(event, (data) => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in ${event} callback:`, error);
            }
        });
    } catch (error) {
        console.error('Error setting up message receiver:', error);
    }
};

/**
 * Refresh socket authentication with updated token
 * @param {string} newToken - The new authentication token
 */
export const refreshSocketAuth = (newToken) => {
    try {
        if (!socket) {
            console.warn('Cannot refresh auth: Socket not initialized');
            return;
        }
        
        if (newToken) {
            // Store token for reconnection scenarios
            localStorage.setItem('authToken', newToken);
            
            // Update socket auth
            socket.auth = { token: newToken };
            if (socket.io && socket.io.opts) {
                socket.io.opts.extraHeaders = {
                    'Authorization': `Bearer ${newToken}`
                };
            }
            
            // If socket is already connected, disconnect and reconnect with new auth
            if (socket.connected) {
                console.log('Reconnecting socket with new authentication token');
                socket.disconnect().connect();
            } else {
                console.log('Socket will use new token on next connection attempt');
                socket.connect();
            }
        }
    } catch (error) {
        console.error('Error refreshing socket authentication:', error);
    }
};

/**
 * Clean up the socket connection and event listeners
 */
export const cleanupSocket = () => {
    try {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        
        if (socket) {
            console.log('Cleaning up socket connection');
            // Remove all listeners and disconnect
            socket.removeAllListeners();
            socket.disconnect();
            socket = null;
            window.socket = null;
        }
    } catch (error) {
        console.error('Error cleaning up socket:', error);
    }
};

export default { 
    initializeSocket, 
    sendMessage, 
    receiveMessage, 
    refreshSocketAuth, 
    cleanupSocket 
};