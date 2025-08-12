import { Router } from 'express';
import { callGemini } from '../services/ai.service.js';
import { getSystemPrompt } from '../types/prompts.js';
import { createChatResponse, createErrorResponse, validateChatRequest } from '../types/index.js';

const router = Router();

// Chat endpoint
router.post('/', async (req, res) => {
  try {
    // Validate request
    if (!validateChatRequest(req.body)) {
      return res.status(400).json(createErrorResponse('Invalid request format. Expected messages array.'));
    }

    const userMessages = req.body.messages;

    const messages = [
      {
        role: 'user',
        content: `${getSystemPrompt()}\n\n` + userMessages.map((m) => m.content).join('\n'),
      },
    ];

    const output = await callGemini(messages, 8000);
    
    const response = createChatResponse(output);
    
    res.json(response);
  } catch (error) {
    console.error('Chat request error:', error);
    const errorResponse = createErrorResponse('Failed to process chat request');
    res.status(500).json(errorResponse);
  }
});

export default router; 