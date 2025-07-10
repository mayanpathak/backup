// import redisClient from './redis.service.js';

// const MESSAGE_TTL = 60 * 60 * 24; // 24 hours in seconds
// const MAX_MESSAGES = 1000; // Maximum number of messages to store per project
// const MAX_MESSAGE_SIZE = 1024 * 50; // 50KB max message size

// // Validate message structure
// const validateMessage = (message) => {
//     if (!message || typeof message !== 'object') {
//         throw new Error('Invalid message format: message must be an object');
//     }

//     if (!message.sender || !message.sender._id) {
//         throw new Error('Invalid message format: sender information missing');
//     }

//     if (!message.message || typeof message.message !== 'string') {
//         throw new Error('Invalid message format: message content missing or invalid');
//     }

//     if (JSON.stringify(message).length > MAX_MESSAGE_SIZE) {
//         throw new Error(`Message size exceeds maximum limit of ${MAX_MESSAGE_SIZE} bytes`);
//     }

//     return true;
// };

// export const storeMessage = async (projectId, message) => {
//     try {
//         if (!projectId) {
//             throw new Error('Project ID is required');
//         }

//         // Validate message structure
//         validateMessage(message);

//         const key = `project:${projectId}:messages`;
        
//         // Add timestamp if not present
//         const messageToStore = {
//             ...message,
//             timestamp: message.timestamp || new Date().toISOString()
//         };

//         // Store message in Redis - use lpush and then expire in separate commands
//         const multi = redisClient.multi();
//         await multi.lpush(key, JSON.stringify(messageToStore));
//         await multi.ltrim(key, 0, MAX_MESSAGES - 1); // Keep only the latest messages
//         await multi.expire(key, MESSAGE_TTL);
//         await multi.exec();

//         return true;
//     } catch (error) {
//         console.error('Error storing message in Redis:', error);
//         throw new Error(`Failed to store message: ${error.message}`);
//     }
// };

// export const getMessages = async (projectId, options = { limit: 100, offset: 0 }) => {
//     try {
//         if (!projectId) {
//             throw new Error('Project ID is required');
//         }

//         const { limit = 100, offset = 0 } = options;
        
//         if (limit > MAX_MESSAGES) {
//             throw new Error(`Cannot request more than ${MAX_MESSAGES} messages`);
//         }

//         const key = `project:${projectId}:messages`;
        
//         // Get messages with pagination
//         const messages = await redisClient.lrange(key, offset, offset + limit - 1);
        
//         // Parse messages and handle invalid JSON
//         const parsedMessages = messages.reduce((acc, msg) => {
//             try {
//                 const parsed = JSON.parse(msg);
//                 // Ensure timestamp exists
//                 if (!parsed.timestamp) {
//                     parsed.timestamp = new Date().toISOString();
//                 }
//                 acc.push(parsed);
//             } catch (error) {
//                 console.error('Error parsing message:', error);
//                 // Skip invalid messages
//             }
//             return acc;
//         }, []);

//         return parsedMessages;
//     } catch (error) {
//         console.error('Error retrieving messages from Redis:', error);
//         throw new Error(`Failed to retrieve messages: ${error.message}`);
//     }
// };

// export const clearMessages = async (projectId) => {
//     try {
//         if (!projectId) {
//             throw new Error('Project ID is required');
//         }

//         const key = `project:${projectId}:messages`;
//         await redisClient.del(key);
//         return true;
//     } catch (error) {
//         console.error('Error clearing messages from Redis:', error);
//         throw new Error(`Failed to clear messages: ${error.message}`);
//     }
// };

// export const getMessageCount = async (projectId) => {
//     try {
//         if (!projectId) {
//             throw new Error('Project ID is required');
//         }

//         const key = `project:${projectId}:messages`;
//         return await redisClient.llen(key);
//     } catch (error) {
//         console.error('Error getting message count from Redis:', error);
//         throw new Error(`Failed to get message count: ${error.message}`);
//     }
// };

// export const searchMessages = async (projectId, searchTerm) => {
//     try {
//         if (!projectId || !searchTerm) {
//             throw new Error('Project ID and search term are required');
//         }

//         const key = `project:${projectId}:messages`;
//         const allMessages = await redisClient.lrange(key, 0, -1);
        
//         // Search through messages
//         const matchingMessages = allMessages.reduce((acc, msg) => {
//             try {
//                 const parsed = JSON.parse(msg);
//                 if (parsed.message.toLowerCase().includes(searchTerm.toLowerCase())) {
//                     acc.push(parsed);
//                 }
//             } catch (error) {
//                 console.error('Error parsing message during search:', error);
//             }
//             return acc;
//         }, []);

//         return matchingMessages;
//     } catch (error) {
//         console.error('Error searching messages in Redis:', error);
//         throw new Error(`Failed to search messages: ${error.message}`);
//     }
// }; 









import redisClient from './redis.service.js';

const MESSAGE_TTL = 60 * 60 * 24; // 24 hours in seconds
const MAX_MESSAGES = 1000; // Maximum number of messages to store per project
const MAX_MESSAGE_SIZE = 1024 * 50; // 50KB max message size

// Validate message structure
const validateMessage = (message) => {
    if (!message || typeof message !== 'object') {
        throw new Error('Invalid message format: message must be an object');
    }

    if (!message.sender || !message.sender._id) {
        throw new Error('Invalid message format: sender information missing');
    }

    if (!message.message || typeof message.message !== 'string') {
        throw new Error('Invalid message format: message content missing or invalid');
    }

    if (JSON.stringify(message).length > MAX_MESSAGE_SIZE) {
        throw new Error(`Message size exceeds maximum limit of ${MAX_MESSAGE_SIZE} bytes`);
    }

    return true;
};

export const storeMessage = async (projectId, message) => {
    try {
        if (!projectId) {
            throw new Error('Project ID is required');
        }

        // Validate message structure
        validateMessage(message);

        const key = `project:${projectId}:messages`;
        
        // Add timestamp if not present
        const messageToStore = {
            ...message,
            timestamp: message.timestamp || new Date().toISOString()
        };

        // Store message in Redis using RPUSH to maintain chronological order
        const multi = redisClient.multi();
        await multi.rpush(key, JSON.stringify(messageToStore));
        await multi.ltrim(key, -MAX_MESSAGES, -1); // Keep only the latest messages, trimming from the beginning
        await multi.expire(key, MESSAGE_TTL);
        await multi.exec();

        return true;
    } catch (error) {
        console.error('Error storing message in Redis:', error);
        throw new Error(`Failed to store message: ${error.message}`);
    }
};

export const getMessages = async (projectId, options = { limit: 100, offset: 0 }) => {
    try {
        if (!projectId) {
            throw new Error('Project ID is required');
        }

        const { limit = 100, offset = 0 } = options;
        
        if (limit > MAX_MESSAGES) {
            throw new Error(`Cannot request more than ${MAX_MESSAGES} messages`);
        }

        const key = `project:${projectId}:messages`;
        
        // Get total length of the list
        const totalMessages = await redisClient.llen(key);
        
        // Calculate proper indices for retrieving messages in chronological order
        // When using RPUSH, oldest messages are at the beginning (index 0)
        const startIndex = offset;
        const endIndex = Math.min(offset + limit - 1, totalMessages - 1);
        
        // Get messages with pagination
        const messages = await redisClient.lrange(key, startIndex, endIndex);
        
        // Parse messages and handle invalid JSON
        const parsedMessages = messages.reduce((acc, msg) => {
            try {
                const parsed = JSON.parse(msg);
                // Ensure timestamp exists
                if (!parsed.timestamp) {
                    parsed.timestamp = new Date().toISOString();
                }
                acc.push(parsed);
            } catch (error) {
                console.error('Error parsing message:', error);
                // Skip invalid messages
            }
            return acc;
        }, []);

        return parsedMessages;
    } catch (error) {
        console.error('Error retrieving messages from Redis:', error);
        throw new Error(`Failed to retrieve messages: ${error.message}`);
    }
};

export const clearMessages = async (projectId) => {
    try {
        if (!projectId) {
            throw new Error('Project ID is required');
        }

        const key = `project:${projectId}:messages`;
        await redisClient.del(key);
        return true;
    } catch (error) {
        console.error('Error clearing messages from Redis:', error);
        throw new Error(`Failed to clear messages: ${error.message}`);
    }
};

export const getMessageCount = async (projectId) => {
    try {
        if (!projectId) {
            throw new Error('Project ID is required');
        }

        const key = `project:${projectId}:messages`;
        return await redisClient.llen(key);
    } catch (error) {
        console.error('Error getting message count from Redis:', error);
        throw new Error(`Failed to get message count: ${error.message}`);
    }
};

export const searchMessages = async (projectId, searchTerm) => {
    try {
        if (!projectId || !searchTerm) {
            throw new Error('Project ID and search term are required');
        }

        const key = `project:${projectId}:messages`;
        const allMessages = await redisClient.lrange(key, 0, -1);
        
        // Search through messages
        const matchingMessages = allMessages.reduce((acc, msg) => {
            try {
                const parsed = JSON.parse(msg);
                if (parsed.message.toLowerCase().includes(searchTerm.toLowerCase())) {
                    acc.push(parsed);
                }
            } catch (error) {
                console.error('Error parsing message during search:', error);
            }
            return acc;
        }, []);

        return matchingMessages;
    } catch (error) {
        console.error('Error searching messages in Redis:', error);
        throw new Error(`Failed to search messages: ${error.message}`);
    }
};