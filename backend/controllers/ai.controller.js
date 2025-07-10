import * as ai from '../services/ai.service.js';

export const getResult = async (req, res) => {
    try {
        // Extract and validate prompt with better type checking
        const { prompt } = req.query;
        
        // Enhanced input validation
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Prompt is required and must be a non-empty string' 
            });
        }

        // Sanitize prompt by trimming whitespace
        const sanitizedPrompt = prompt.trim();
        
        // Add timeout protection and additional error context
        let result;
        try {
            result = await ai.generateResult(sanitizedPrompt);
        } catch (aiError) {
            console.error('AI service error:', {
                message: aiError.message,
                stack: aiError.stack,
                prompt: sanitizedPrompt.substring(0, 100) + '...' // Log first 100 chars for debugging
            });
            
            return res.status(500).json({
                error: 'AI service unavailable',
                text: "I couldn't generate a response due to a service error. Please try again."
            });
        }

        // Validate AI service response
        if (result === null || result === undefined) {
            console.error('AI service returned null/undefined response');
            return res.status(500).json({
                error: 'Empty AI response',
                text: "I couldn't generate a response. Please try again."
            });
        }

        // Convert result to string if it isn't already
        const resultString = typeof result === 'string' ? result : String(result);
        
        // Enhanced JSON parsing with better error handling
        try {
            const parsedResult = JSON.parse(resultString);
            
            // Validate that parsed result is an object (not null, array, or primitive)
            if (parsedResult === null || typeof parsedResult !== 'object' || Array.isArray(parsedResult)) {
                console.warn('AI response is not a valid object:', typeof parsedResult);
                return res.status(500).json({
                    error: 'Invalid AI response structure',
                    text: "I couldn't generate a proper response format. Please try again."
                });
            }
            
            return res.json(parsedResult);
            
        } catch (parseError) {
            console.error('AI response parsing error:', {
                error: parseError.message,
                rawResponse: resultString.substring(0, 200) + '...', // Log first 200 chars
                responseType: typeof resultString,
                responseLength: resultString.length
            });
            
            // Try to extract any meaningful text from malformed response
            const fallbackText = resultString.length > 0 
                ? "I generated a response but it wasn't in the expected format. Please try again."
                : "I couldn't generate a proper response. Please try again.";
            
            return res.status(500).json({
                error: 'Invalid AI response format',
                details: parseError.message,
                text: fallbackText
            });
        }
        
    } catch (error) {
        // Top-level error handler for any unexpected errors
        console.error('Unexpected error in AI controller:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        // Ensure we always return a JSON response
        if (!res.headersSent) {
            return res.status(500).json({
                error: 'Internal server error',
                text: "There was an unexpected error processing your request. Please try again."
            });
        }
    }
};