import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';
import { generateResult } from './services/ai.service.js';
import { storeMessage, getMessages, getMessageCount, searchMessages } from './services/message.service.js';
import connect from './db/db.js';
import redisClient from './services/redis.service.js';
import { config } from './config/environment.js';

const port = config.port;

// Create HTTP server
const server = http.createServer(app);

// Enhanced CORS origins for Socket.IO
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://code-collab-mny8.vercel.app',
    'https://backup-alpha.vercel.app',
    'https://wildermain.vercel.app',
    'https://wilder-5.onrender.com',
    'https://wilder-3.onrender.com'
];

// CORS origin checker function for Socket.IO
const socketCorsOriginHandler = (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || config.nodeEnv !== 'production') {
        callback(null, true);
    } else {
        console.log('Socket CORS blocked request from:', origin);
        callback(null, config.nodeEnv !== 'production'); // Allow all in development
    }
};

// Create Socket.IO server with enhanced configuration
const io = new Server(server, {
    cors: {
        origin: socketCorsOriginHandler,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Accept', 'Origin'],
        exposedHeaders: ['Set-Cookie']
    },
    cookie: true,
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
});

// Centralized error handler
const handleFatalError = (error, source = 'Unknown') => {
    console.error(`FATAL ERROR from ${source}:`, {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });
    
    if (server && server.listening) {
        server.close(() => {
            console.log('Server closed gracefully');
            process.exit(1);
        });
        
        setTimeout(() => {
            console.log('Force exiting...');
            process.exit(1);
        }, 5000);
    } else {
        process.exit(1);
    }
};

// Safe token extraction from cookies
const extractTokenFromCookies = (cookies) => {
    if (!cookies || typeof cookies !== 'string') return null;
    
    try {
        const cookieArray = cookies.split(';');
        for (const cookie of cookieArray) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'token' && value) {
                return decodeURIComponent(value);
            }
        }
    } catch (error) {
        console.warn('Error parsing cookies:', error.message);
    }
    return null;
};

// Safe JWT verification with recovery
const verifyTokenWithRecovery = async (token) => {
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        return { success: true, user: decoded };
    } catch (jwtError) {
        if (jwtError.name === 'TokenExpiredError') {
            try {
                const decodedExpired = jwt.decode(token);
                if (decodedExpired?.email) {
                    const User = mongoose.model('user');
                    const user = await User.findOne({ email: decodedExpired.email });
                    if (user) {
                        return { 
                            success: true, 
                            user: { email: user.email },
                            recovered: true 
                        };
                    }
                }
            } catch (recoveryError) {
                console.warn('Token recovery failed:', recoveryError.message);
            }
        }
        return { success: false, error: jwtError.message };
    }
};

// Start server with enhanced error handling
const startServer = async () => {
    try {
        await connect();
        console.log('✅ MongoDB connected successfully');

        // Test Redis connection with timeout
        const redisTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
        );
        
        try {
            await Promise.race([
                redisClient.raw.ping(),
                redisTimeout
            ]);
            console.log('✅ Redis connected successfully');
        } catch (redisError) {
            console.warn('⚠️ Redis connection failed:', redisError.message);
            console.log('Server will continue without Redis caching');
        }

        // Configure Socket.IO middleware
        io.use(async (socket, next) => {
            try {
                const projectId = socket.handshake.query?.projectId;
                if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
                    return next(new Error('Invalid or missing projectId'));
                }

                socket.projectId = projectId;
                
                try {
                    socket.project = await projectModel.findById(projectId);
                    if (!socket.project) {
                        console.warn(`Project with ID ${projectId} not found`);
                    }
                } catch (dbError) {
                    console.error('Database error finding project:', dbError.message);
                    socket.project = null;
                }

                let token = null;
                
                // Try multiple token sources
                const cookies = socket.handshake.headers.cookie;
                if (cookies) {
                    token = extractTokenFromCookies(cookies);
                    if (token) console.log("Found token in cookies");
                }
                
                if (!token && socket.handshake.auth?.token) {
                    token = socket.handshake.auth.token;
                    console.log("Found token in auth object");
                }
                
                if (!token) {
                    const authHeader = socket.handshake.headers.authorization;
                    if (authHeader && authHeader.startsWith('Bearer ')) {
                        token = authHeader.split(' ')[1];
                        console.log("Found token in authorization header");
                    }
                }

                console.log("Socket connection attempt with token:", !!token);

                if (!token) {
                    console.error("Authentication failed: No token found");
                    return next(new Error('Authentication error: No token provided'));
                }

                const tokenResult = await verifyTokenWithRecovery(token);
                if (!tokenResult.success) {
                    console.error("JWT verification failed:", tokenResult.error);
                    return next(new Error(`Authentication error: ${tokenResult.error}`));
                }

                socket.user = tokenResult.user;
                if (tokenResult.recovered) {
                    console.log("Successfully recovered from expired token");
                }
                
                console.log("Token verified successfully for user:", socket.user.email);
                next();

            } catch (error) {
                console.error('Socket middleware error:', error.message);
                next(new Error(`Connection error: ${error.message}`));
            }
        });

        // Configure Socket.IO connection handling
        io.on('connection', async (socket) => {
            let roomId = null;
            
            try {
                roomId = socket.projectId;
                socket.roomId = roomId;
                console.log(`User ${socket.user?.email} connected to room ${roomId}`);

                await socket.join(roomId);

                // Load cached messages with error handling
                try {
                    const [messageCount, cachedMessages] = await Promise.allSettled([
                        getMessageCount(roomId),
                        getMessages(roomId, { limit: 100, offset: 0 })
                    ]);

                    const count = messageCount.status === 'fulfilled' ? messageCount.value : 0;
                    const messages = cachedMessages.status === 'fulfilled' ? cachedMessages.value : [];
                    
                    if (messages.length > 0) {
                        socket.emit('load-messages', {
                            messages,
                            totalCount: count
                        });
                    }
                } catch (error) {
                    console.error('Error loading cached messages:', error.message);
                    socket.emit('error', {
                        type: 'LOAD_MESSAGES_ERROR',
                        message: 'Failed to load message history'
                    });
                }

                // Handle loading more messages
                socket.on('load-more-messages', async ({ offset = 0, limit = 50 }) => {
                    try {
                        const safeOffset = Math.max(0, parseInt(offset) || 0);
                        const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 50));
                        
                        const olderMessages = await getMessages(roomId, { 
                            offset: safeOffset, 
                            limit: safeLimit 
                        });
                        socket.emit('more-messages-loaded', olderMessages || []);
                    } catch (error) {
                        console.error('Error loading more messages:', error.message);
                        socket.emit('error', {
                            type: 'LOAD_MORE_MESSAGES_ERROR',
                            message: 'Failed to load more messages'
                        });
                    }
                });

                // Handle message search
                socket.on('search-messages', async ({ searchTerm }) => {
                    try {
                        if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
                            return socket.emit('search-results', []);
                        }
                        
                        const sanitizedSearchTerm = searchTerm.trim().substring(0, 100);
                        const matchingMessages = await searchMessages(roomId, sanitizedSearchTerm);
                        socket.emit('search-results', matchingMessages || []);
                    } catch (error) {
                        console.error('Error searching messages:', error.message);
                        socket.emit('error', {
                            type: 'SEARCH_MESSAGES_ERROR',
                            message: 'Failed to search messages'
                        });
                    }
                });

                // Handle project messages
                socket.on('project-message', async (data) => {
                    try {
                        if (!data || !data.message) {
                            return socket.emit('error', {
                                type: 'INVALID_MESSAGE',
                                message: 'Message data is required'
                            });
                        }

                        const message = String(data.message).substring(0, 10000);

                        const messageWithTimestamp = {
                            ...data,
                            message,
                            timestamp: new Date().toISOString(),
                            sender: socket.user
                        };

                        // Store message with error handling
                        try {
                            await storeMessage(roomId, messageWithTimestamp);
                        } catch (storeError) {
                            console.error('Failed to store message in Redis:', storeError.message);
                        }

                        // Forward the user message to everyone else in the room
                        socket.broadcast.to(roomId).emit('project-message', messageWithTimestamp);

                        // Check if this is an AI request
                        const aiIsPresentInMessage = message.includes('@ai');
                        if (aiIsPresentInMessage) {
                            await handleAIRequest(socket, roomId, message);
                        }
                    } catch (error) {
                        console.error('Socket message handling error:', error.message);
                        socket.emit('error', {
                            type: 'MESSAGE_HANDLING_ERROR',
                            message: 'Failed to process message'
                        });
                    }
                });

                // Handle disconnect
                socket.on('disconnect', (reason) => {
                    console.log(`User ${socket.user?.email} disconnected from room ${roomId}. Reason: ${reason}`);
                    if (roomId) {
                        socket.leave(roomId);
                    }
                });

                socket.on('error', (error) => {
                    console.error('Socket error:', error.message);
                });

            } catch (error) {
                console.error('Socket connection setup error:', error.message);
                socket.emit('error', {
                    type: 'CONNECTION_ERROR',
                    message: 'Failed to establish connection properly'
                });
            }
        });

        // AI request handler function (enhanced with both project capabilities)
        const handleAIRequest = async (socket, roomId, message) => {
            try {
                const processingMessage = {
                    message: JSON.stringify({ 
                        text: "I'm thinking about your request... This may take a moment."
                    }),
                    sender: {
                        _id: 'ai',
                        email: 'AI Assistant'
                    },
                    timestamp: new Date().toISOString()
                };

                try {
                    await storeMessage(roomId, processingMessage);
                } catch (storeError) {
                    console.warn('Failed to store AI processing message:', storeError.message);
                }
                
                io.to(roomId).emit('project-message', processingMessage);

                const prompt = message.replace('@ai', '').trim();
                if (!prompt) {
                    throw new Error("Empty prompt provided");
                }

                const safePrompt = prompt.substring(0, 1000);

                // AI generation with timeout
                const aiTimeout = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("AI request timed out after 45 seconds")), 45000)
                );

                const aiGenerationPromise = generateResult(safePrompt);
                const result = await Promise.race([aiGenerationPromise, aiTimeout]);

                let parsedResult;
                try {
                    parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
                } catch (parseError) {
                    console.error('Failed to parse AI result:', parseError.message);
                    parsedResult = { text: `AI generated a response but it couldn't be parsed properly.` };
                }

                if (!parsedResult || typeof parsedResult !== 'object') {
                    parsedResult = { text: "AI generated an invalid response format." };
                }

                if (!parsedResult.text) {
                    parsedResult.text = `I've processed your request for "${safePrompt}" but couldn't generate detailed text.`;
                }

                const aiResponse = {
                    message: JSON.stringify(parsedResult),
                    sender: {
                        _id: 'ai',
                        email: 'AI Assistant'
                    },
                    timestamp: new Date().toISOString()
                };

                try {
                    await storeMessage(roomId, aiResponse);
                } catch (storeError) {
                    console.warn('Failed to store AI response:', storeError.message);
                }
                
                io.to(roomId).emit('project-message', aiResponse);

                // Update project file tree if provided
                if (parsedResult.fileTree && 
                    typeof parsedResult.fileTree === 'object' && 
                    Object.keys(parsedResult.fileTree).length > 0 && 
                    socket.project) {
                    
                    try {
                        await projectModel.findByIdAndUpdate(
                            socket.projectId,
                            { $set: { fileTree: parsedResult.fileTree } },
                            { new: true }
                        );
                        console.log("Updated project with new file tree");
                    } catch (dbError) {
                        console.error("Error saving file tree to project:", dbError.message);
                        socket.emit('error', {
                            type: 'UPDATE_FILE_TREE_ERROR',
                            message: 'Failed to update project file tree'
                        });
                    }
                }

            } catch (error) {
                console.error("AI processing error:", error.message);
                
                const errorMessage = {
                    message: JSON.stringify({
                        text: `Error: ${error.message}. Please try again with a more specific prompt.`
                    }),
                    sender: {
                        _id: 'ai',
                        email: 'AI Assistant'
                    },
                    timestamp: new Date().toISOString()
                };

                try {
                    await storeMessage(roomId, errorMessage);
                } catch (storeError) {
                    console.warn('Failed to store AI error message:', storeError.message);
                }
                
                io.to(roomId).emit('project-message', errorMessage);
            }
        };

        // Start server
        server.listen(port, () => {
            console.log(`✅ Combined AI Coding Server is running on http://localhost:${port}`);
            console.log(`🚀 Features: Collaborative Coding + AI Code Generation`);
        });

        server.on('error', (error) => {
            console.error('Server error:', error);
            if (error.code === 'EADDRINUSE') {
                console.error(`Port ${port} is already in use`);
                process.exit(1);
            }
        });

    } catch (error) {
        handleFatalError(error, 'Server startup');
    }
};

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    
    if (server && server.listening) {
        server.close(() => {
            console.log('HTTP server closed');
            
            mongoose.connection.close(false, () => {
                console.log('MongoDB connection closed');
                process.exit(0);
            });
        });
    } else {
        process.exit(0);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => handleFatalError(error, 'Uncaught Exception'));
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    handleFatalError(new Error(reason), 'Unhandled Rejection');
});

// Start server
startServer().catch((error) => handleFatalError(error, 'Server initialization'));
