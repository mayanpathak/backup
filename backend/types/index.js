// Type definitions for the application (JavaScript equivalent)

// AI Message structure
export const createAIMessage = (role, content) => ({
    role, // 'user' | 'assistant' | 'system'
    content
});

// Chat Response structure
export const createChatResponse = (response) => ({
    response
});

// Template Response structure
export const createTemplateResponse = (prompts, uiPrompts) => ({
    prompts,
    uiPrompts
});

// Error Response structure
export const createErrorResponse = (error) => ({
    error
});

// Validation functions
export const validateAIMessage = (message) => {
    return message && 
           typeof message === 'object' && 
           typeof message.role === 'string' && 
           typeof message.content === 'string';
};

export const validateChatRequest = (body) => {
    return body && 
           Array.isArray(body.messages) && 
           body.messages.every(validateAIMessage);
};

export const validateTemplateRequest = (body) => {
    return body && 
           typeof body.prompt === 'string' && 
           body.prompt.trim().length > 0;
};

// Helper functions for type checking
export const isValidRole = (role) => {
    return ['user', 'assistant', 'system'].includes(role);
};

export const sanitizeMessage = (message) => {
    if (!validateAIMessage(message)) {
        throw new Error('Invalid message format');
    }
    
    return {
        role: message.role.toLowerCase(),
        content: String(message.content).trim()
    };
};
