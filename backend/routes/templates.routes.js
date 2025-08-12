import { Router } from 'express';
import { callGemini } from '../services/ai.service.js';
import { BASE_PROMPT } from '../types/prompts.js';
import { basePrompt as nodeBasePrompt } from '../defaults/node.js';
import { basePrompt as reactBasePrompt } from '../defaults/react.js';
import { createTemplateResponse, createErrorResponse, validateTemplateRequest } from '../types/index.js';

const router = Router();

// Detect if project is node or react
router.post('/', async (req, res) => {
  try {
    // Validate request
    if (!validateTemplateRequest(req.body)) {
      return res.status(400).json(createErrorResponse('Invalid request format. Expected prompt string.'));
    }

    const prompt = req.body.prompt;

    const messages = [
      {
        role: 'user',
        content:
          "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra\n\n" + prompt,
      },
    ];

    const answer = (await callGemini(messages, 200)).trim().toLowerCase();

    if (answer === 'react') {
      const response = createTemplateResponse(
        [
          BASE_PROMPT,
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n `,
        ],
        [reactBasePrompt]
      );
      res.json(response);
    } else if (answer === 'node') {
      const response = createTemplateResponse(
        [
          BASE_PROMPT,
          `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
        ],
        [nodeBasePrompt]
      );
      res.json(response);
    } else {
      const errorResponse = createErrorResponse("You can't access this");
      res.status(403).json(errorResponse);
    }
  } catch (error) {
    console.error('Template request error:', error);
    const errorResponse = createErrorResponse('Failed to process template request');
    res.status(500).json(errorResponse);
  }
});

export default router; 