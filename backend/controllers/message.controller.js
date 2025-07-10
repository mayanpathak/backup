import { 
    getMessages as getMessagesService, 
    searchMessages as searchMessagesService, 
    clearMessages as clearMessagesService, 
    getMessageCount as getMessageCountService 
} from '../services/message.service.js';

/**
 * Get messages for a project with pagination
 * @route GET /projects/:projectId/messages
 */
export const getProjectMessages = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { limit = 100, offset = 0 } = req.query;
        
        // Validate projectId
        if (!projectId || typeof projectId !== 'string' || projectId.trim().length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Valid project ID is required'
            });
        }
        
        // Validate project access
        if (!req.project) {
            return res.status(403).json({
                status: 'error',
                message: 'You do not have access to this project'
            });
        }
        
        // Parse and validate pagination parameters
        const parsedLimit = parseInt(limit, 10);
        const parsedOffset = parseInt(offset, 10);
        
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
            return res.status(400).json({
                status: 'error',
                message: 'Limit must be a number between 1 and 1000'
            });
        }
        
        if (isNaN(parsedOffset) || parsedOffset < 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Offset must be a non-negative number'
            });
        }
        
        // Get messages from Redis with error handling
        let messages, messageCount;
        try {
            [messages, messageCount] = await Promise.all([
                getMessagesService(projectId.trim(), {
                    limit: parsedLimit,
                    offset: parsedOffset
                }),
                getMessageCountService(projectId.trim())
            ]);
        } catch (serviceError) {
            console.error('Service error getting messages:', {
                projectId: projectId.trim(),
                error: serviceError.message,
                stack: serviceError.stack
            });
            return res.status(500).json({
                status: 'error',
                message: 'Failed to retrieve messages from storage'
            });
        }
        
        // Validate service responses
        if (!Array.isArray(messages)) {
            console.warn('Messages service returned non-array:', typeof messages);
            messages = [];
        }
        
        if (typeof messageCount !== 'number' || isNaN(messageCount) || messageCount < 0) {
            console.warn('Message count service returned invalid count:', messageCount);
            messageCount = messages.length;
        }
        
        return res.status(200).json({
            status: 'success',
            data: {
                messages,
                totalCount: messageCount
            }
        });
    } catch (error) {
        console.error('Error getting messages:', {
            projectId: req.params?.projectId,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        if (!res.headersSent) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to get messages'
            });
        }
    }
};

/**
 * Search messages for a project
 * @route POST /projects/:projectId/messages/search
 */
export const searchProjectMessages = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { searchTerm } = req.body || {};
        
        // Validate projectId
        if (!projectId || typeof projectId !== 'string' || projectId.trim().length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Valid project ID is required'
            });
        }
        
        // Validate search term
        if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Search term is required and must be a non-empty string'
            });
        }
        
        // Validate project access
        if (!req.project) {
            return res.status(403).json({
                status: 'error',
                message: 'You do not have access to this project'
            });
        }
        
        const sanitizedSearchTerm = searchTerm.trim();
        
        // Validate search term length to prevent abuse
        if (sanitizedSearchTerm.length > 500) {
            return res.status(400).json({
                status: 'error',
                message: 'Search term is too long (maximum 500 characters)'
            });
        }
        
        // Search messages in Redis with error handling
        let results;
        try {
            results = await searchMessagesService(projectId.trim(), sanitizedSearchTerm);
        } catch (serviceError) {
            console.error('Service error searching messages:', {
                projectId: projectId.trim(),
                searchTerm: sanitizedSearchTerm.substring(0, 50) + '...',
                error: serviceError.message,
                stack: serviceError.stack
            });
            return res.status(500).json({
                status: 'error',
                message: 'Failed to search messages in storage'
            });
        }
        
        // Validate service response
        if (!Array.isArray(results)) {
            console.warn('Search service returned non-array:', typeof results);
            results = [];
        }
        
        return res.status(200).json({
            status: 'success',
            data: {
                messages: results,
                totalCount: results.length
            }
        });
    } catch (error) {
        console.error('Error searching messages:', {
            projectId: req.params?.projectId,
            searchTerm: req.body?.searchTerm?.substring(0, 50) + '...',
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        if (!res.headersSent) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to search messages'
            });
        }
    }
};

/**
 * Clear all messages for a project
 * @route DELETE /projects/:projectId/messages
 */
export const clearProjectMessages = async (req, res) => {
    try {
        const { projectId } = req.params;
        
        // Validate projectId
        if (!projectId || typeof projectId !== 'string' || projectId.trim().length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Valid project ID is required'
            });
        }
        
        // Validate project access
        if (!req.project) {
            return res.status(403).json({
                status: 'error',
                message: 'You do not have access to this project'
            });
        }
        
        // Validate user and project objects
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                status: 'error',
                message: 'User authentication required'
            });
        }
        
        if (!req.project.createdBy || !req.project.users) {
            return res.status(500).json({
                status: 'error',
                message: 'Project data is incomplete'
            });
        }
        
        // Enhanced ownership validation with better error handling
        let isOwner = false;
        try {
            const userId = req.user._id.toString();
            const createdBy = req.project.createdBy.toString();
            const isUserInProject = Array.isArray(req.project.users) && 
                req.project.users.some(user => {
                    // Handle both ObjectId objects and string IDs
                    const userIdStr = (user && user.toString) ? user.toString() : String(user);
                    return userIdStr === userId;
                });
            
            isOwner = isUserInProject && createdBy === userId;
        } catch (conversionError) {
            console.error('Error validating ownership:', {
                projectId: projectId.trim(),
                error: conversionError.message,
                userId: req.user._id,
                createdBy: req.project.createdBy
            });
            return res.status(500).json({
                status: 'error',
                message: 'Failed to validate project ownership'
            });
        }
        
        if (!isOwner) {
            return res.status(403).json({
                status: 'error',
                message: 'Only the project owner can clear messages'
            });
        }
        
        // Clear messages in Redis with error handling
        try {
            await clearMessagesService(projectId.trim());
        } catch (serviceError) {
            console.error('Service error clearing messages:', {
                projectId: projectId.trim(),
                error: serviceError.message,
                stack: serviceError.stack
            });
            return res.status(500).json({
                status: 'error',
                message: 'Failed to clear messages from storage'
            });
        }
        
        return res.status(200).json({
            status: 'success',
            message: 'Messages cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing messages:', {
            projectId: req.params?.projectId,
            userId: req.user?._id,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        if (!res.headersSent) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to clear messages'
            });
        }
    }
};

/**
 * Get message count for a project
 * @route GET /projects/:projectId/messages/count
 */
export const getProjectMessageCount = async (req, res) => {
    try {
        const { projectId } = req.params;
        
        // Validate projectId
        if (!projectId || typeof projectId !== 'string' || projectId.trim().length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Valid project ID is required'
            });
        }
        
        // Validate project access
        if (!req.project) {
            return res.status(403).json({
                status: 'error',
                message: 'You do not have access to this project'
            });
        }
        
        // Get message count from Redis with error handling
        let count;
        try {
            count = await getMessageCountService(projectId.trim());
        } catch (serviceError) {
            console.error('Service error getting message count:', {
                projectId: projectId.trim(),
                error: serviceError.message,
                stack: serviceError.stack
            });
            return res.status(500).json({
                status: 'error',
                message: 'Failed to get message count from storage'
            });
        }
        
        // Validate service response
        if (typeof count !== 'number' || isNaN(count) || count < 0) {
            console.warn('Message count service returned invalid count:', count);
            count = 0;
        }
        
        return res.status(200).json({
            status: 'success',
            data: {
                count
            }
        });
    } catch (error) {
        console.error('Error getting message count:', {
            projectId: req.params?.projectId,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        if (!res.headersSent) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to get message count'
            });
        }
    }
};