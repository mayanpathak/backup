import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { body, validationResult } from 'express-validator';
import * as authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

// Structured logging helper matching the controller/middleware pattern
const logger = {
    info: (message, context = {}) => {
        console.log(`[${new Date().toISOString()}] ROUTES-INFO: ${message}`, context);
    },
    warn: (message, context = {}) => {
        console.warn(`[${new Date().toISOString()}] ROUTES-WARN: ${message}`, context);
    },
    error: (message, context = {}) => {
        console.error(`[${new Date().toISOString()}] ROUTES-ERROR: ${message}`, context);
    }
};

/**
 * Lightweight validation error handler that respects the controller's validation patterns
 * Provides immediate feedback without blocking login/signup flow
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const userContext = req.body?.email || 'unknown';
        
        // Async warning logging (non-blocking) - matches controller pattern
        setImmediate(() => {
            logger.warn('Route validation failed', {
                endpoint: req.path,
                method: req.method,
                email: userContext,
                errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
        });

        // Immediate response - no delays for login/signup flows
        return res.status(400).json({
            errors: errors.array(),
            message: 'Validation failed'
        });
    }
    next();
};

/**
 * Enhanced async error wrapper that prevents crashes and provides structured logging
 * Matches the error handling patterns used in controllers and middleware
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            const userContext = req.user?.email || req.body?.email || 'unknown';
            const requestId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Async error logging (non-blocking) - matches controller pattern
            setImmediate(() => {
                logger.error('Route handler error', {
                    requestId,
                    endpoint: req.path,
                    method: req.method,
                    user: userContext,
                    error: error.message,
                    stack: error.stack,
                    body: req.method === 'POST' ? { ...req.body, password: '[REDACTED]' } : undefined,
                    headers: {
                        'user-agent': req.get('User-Agent'),
                        'content-type': req.get('Content-Type')
                    },
                    ip: req.ip
                });
            });

            // Prevent server crash with graceful error response
            if (!res.headersSent) {
                res.status(500).json({
                    error: 'An unexpected error occurred. Please try again.',
                    message: 'Internal server error',
                    requestId
                });
            }
        });
    };
};

/**
 * Enhanced validation rules with robust input sanitization
 * Maintains existing minimum requirements while adding protection against edge cases
 */
const emailValidation = body('email')
    .trim()
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Email address is too long')
    .custom((value) => {
        // Additional validation to match controller expectations
        if (!value || value.length === 0) {
            throw new Error('Email is required');
        }
        return true;
    });

const passwordValidation = body('password')
    .isLength({ min: 3 })
    .withMessage('Password must be at least 3 characters long')
    .isLength({ max: 128 })
    .withMessage('Password is too long (maximum 128 characters)')
    .custom((value) => {
        // Matches controller validation patterns
        if (!value) {
            throw new Error('Password is required');
        }
        // Ensure password doesn't contain only whitespace
        if (typeof value === 'string' && value.trim().length === 0) {
            throw new Error('Password cannot be empty or contain only whitespace');
        }
        return true;
    });

/**
 * User Registration Route
 * Fast validation -> immediate controller execution
 * Preserves cookie-based authentication flow from controller
 */
router.post('/register',
    emailValidation,
    passwordValidation,
    handleValidationErrors,
    asyncHandler(userController.createUserController)
);

/**
 * User Login Route  
 * Fast validation -> immediate controller execution
 * Preserves cookie-based authentication and token recovery mechanisms
 */
router.post('/login',
    emailValidation,
    passwordValidation,
    handleValidationErrors,
    asyncHandler(userController.loginController)
);

/**
 * User Profile Route
 * Protected by auth middleware with cookie-based authentication
 * Supports token recovery for expired sessions as per middleware implementation
 */
router.get('/profile', 
    asyncHandler(authMiddleware.authUser), 
    asyncHandler(userController.profileController)
);

/**
 * User Logout Route
 * Maintains cookie-based authentication with Redis token blacklisting
 * Supports multiple fallback authentication sources as per middleware
 */
router.get('/logout', 
    asyncHandler(authMiddleware.authUser), 
    asyncHandler(userController.logoutController)
);

/**
 * Get All Users Route
 * Protected route with consistent authentication flow
 * Preserves all existing user session and identity handling logic
 */
router.get('/all', 
    asyncHandler(authMiddleware.authUser), 
    asyncHandler(userController.getAllUsersController)
);

/**
 * Global error handler for any unhandled route errors
 * Matches the error handling patterns from controllers and middleware
 * Ensures server stability and prevents crashes
 */
router.use((error, req, res, next) => {
    const userContext = req.user?.email || req.body?.email || 'unknown';
    const requestId = `global_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Async error logging (non-blocking) - consistent with other components
    setImmediate(() => {
        logger.error('Unhandled route error', {
            requestId,
            endpoint: req.path,
            method: req.method,
            user: userContext,
            error: error.message,
            stack: error.stack,
            ip: req.ip
        });
    });

    // Graceful error response that doesn't crash the server
    if (!res.headersSent) {
        res.status(500).json({
            error: 'Internal server error',
            message: 'An unexpected error occurred',
            requestId
        });
    }
});

export default router;