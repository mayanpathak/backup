import userModel from '../models/user.model.js';
import * as userService from '../services/user.service.js';
import { validationResult } from 'express-validator';
import redisClient from '../services/redis.service.js';

// Structured logging helper
const logger = {
    info: (message, context = {}) => {
        console.log(`[${new Date().toISOString()}] INFO: ${message}`, context);
    },
    warn: (message, context = {}) => {
        console.warn(`[${new Date().toISOString()}] WARN: ${message}`, context);
    },
    error: (message, context = {}) => {
        console.error(`[${new Date().toISOString()}] ERROR: ${message}`, context);
    }
};

// Common cookie options for consistency
const COOKIE_OPTIONS = {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'none',
    secure: true,
    path: '/'
};

export const createUserController = async (req, res) => {
    try {
        // Fast validation check
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                errors: errors.array(),
                message: 'Validation failed'
            });
        }

        // Direct user creation and token generation
        const user = await userService.createUser(req.body);
        const token = await user.generateJWT();

        // Quick password removal
        delete user._doc.password;

        // Set cookie immediately
        res.cookie('token', token, COOKIE_OPTIONS);

        // Async logging (non-blocking)
        setImmediate(() => {
            logger.info('User registered successfully', { 
                userId: user._id,
                email: user.email,
                timestamp: new Date().toISOString()
            });
        });

        // Immediate response
        return res.status(201).json({ 
            user, 
            token,
            message: 'Registration successful' 
        });

    } catch (error) {
        // Async error logging (non-blocking)
        setImmediate(() => {
            logger.error('Registration error occurred', { 
                error: error.message,
                email: req.body?.email || 'unknown',
                timestamp: new Date().toISOString()
            });
        });
        
        return res.status(400).json({ 
            error: error.message || 'Registration failed',
            message: 'Registration failed'
        });
    }
};

export const loginController = async (req, res) => {
    try {
        // Fast validation check
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                errors: errors.array(),
                message: 'Validation failed'
            });
        }

        const { email, password } = req.body;
        
        // Quick credential check
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required',
                message: 'Invalid request'
            });
        }

        // Direct database query and validation
        const user = await userModel.findOne({ email }).select('+password');

        if (!user) {
            // Async logging for failed attempts (non-blocking)
            setImmediate(() => {
                logger.warn('Login attempt with non-existent email', { 
                    email,
                    timestamp: new Date().toISOString()
                });
            });
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Login failed'
            });
        }

        const isMatch = await user.isValidPassword(password);

        if (!isMatch) {
            // Async logging for failed attempts (non-blocking)
            setImmediate(() => {
                logger.warn('Login attempt with incorrect password', { 
                    userId: user._id,
                    email: user.email,
                    timestamp: new Date().toISOString()
                });
            });
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Login failed'
            });
        }

        // Generate token and prepare response
        const token = await user.generateJWT();
        delete user._doc.password;

        // Set cookie immediately
        res.cookie('token', token, COOKIE_OPTIONS);

        // Async success logging (non-blocking)
        setImmediate(() => {
            logger.info('User logged in successfully', { 
                userId: user._id,
                email: user.email,
                timestamp: new Date().toISOString()
            });
        });

        // Immediate response
        return res.status(200).json({ 
            user, 
            token,
            message: 'Login successful'
        });

    } catch (error) {
        // Async error logging (non-blocking)
        setImmediate(() => {
            logger.error('Login error occurred', { 
                error: error.message,
                email: req.body?.email || 'unknown',
                timestamp: new Date().toISOString()
            });
        });
        
        return res.status(500).json({ 
            error: error.message || 'Login failed',
            message: 'Login failed'
        });
    }
};

export const profileController = async (req, res) => {
    const requestId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
        if (!req.user) {
            logger.warn('Profile access attempt without authenticated user', { requestId });
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please log in to access your profile'
            });
        }

        logger.info('Profile accessed successfully', { 
            requestId,
            userId: req.user._id || req.user.id,
            email: req.user.email
        });

        res.status(200).json({
            user: req.user
        });

    } catch (error) {
        logger.error('Profile controller error', { 
            requestId,
            error: error.message,
            stack: error.stack,
            userId: req.user?._id || req.user?.id || 'unknown'
        });
        
        res.status(500).json({
            error: 'Failed to retrieve profile',
            message: 'Profile access failed'
        });
    }
};

export const logoutController = async (req, res) => {
    const requestId = `logout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let userIdentifier = 'unknown';
    
    try {
        // Extract user identifier for logging
        if (req.user) {
            userIdentifier = req.user.email || req.user._id || req.user.id || 'authenticated_user';
        }

        // Extract token from cookies or authorization header (multiple fallback sources)
        const token = req.cookies?.token || 
                     req.headers?.authorization?.split(' ')?.[1] || 
                     req.headers?.Authorization?.split(' ')?.[1];
        
        // If we have a token, add it to the blacklist
        if (token) {
            try {
                // Use the enhanced Redis client with numeric expiration (24 hours = 86400 seconds)
                await redisClient.set(token, 'logout', 86400);
                logger.info('Token blacklisted successfully', { 
                    requestId,
                    userIdentifier,
                    tokenPrefix: token.substring(0, 10) + '...'
                });
            } catch (redisError) {
                logger.warn('Failed to blacklist token in Redis', { 
                    requestId,
                    userIdentifier,
                    error: redisError.message,
                    tokenPrefix: token.substring(0, 10) + '...'
                });
                // Continue with logout even if Redis fails
            }
        } else {
            logger.warn('Logout attempt without token', { 
                requestId,
                userIdentifier,
                hasCookieToken: !!req.cookies?.token,
                hasAuthHeader: !!req.headers?.authorization
            });
        }
        
        // Always clear the cookie with matching options
        res.clearCookie('token', {
            httpOnly: true,
            sameSite: 'none',
            secure: true,
            path: '/'
        });
        
        logger.info('User logged out successfully', { 
            requestId,
            userIdentifier
        });
        
        res.status(200).json({
            message: 'Logged out successfully'
        });

    } catch (error) {
        logger.error('Logout controller error', { 
            requestId,
            userIdentifier,
            error: error.message,
            stack: error.stack
        });
        
        // Even if there's an error, try to clear the cookie
        try {
            res.clearCookie('token', {
                httpOnly: true,
                sameSite: 'none',
                secure: true,
                path: '/'
            });
        } catch (cookieError) {
            logger.error('Failed to clear cookie during error recovery', { 
                requestId,
                userIdentifier,
                cookieError: cookieError.message
            });
        }
        
        res.status(200).json({
            message: 'Logged out'
        });
    }
};

export const getAllUsersController = async (req, res) => {
    const requestId = `getUsers_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
        if (!req.user) {
            logger.warn('Get all users attempt without authenticated user', { requestId });
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please log in to access user list'
            });
        }

        if (!req.user.email) {
            logger.error('Authenticated user missing email field', { 
                requestId,
                userId: req.user._id || req.user.id || 'unknown'
            });
            return res.status(400).json({
                error: 'Invalid user data',
                message: 'User session is invalid'
            });
        }

        // Get the logged-in user's full data
        const loggedInUser = await userModel.findOne({
            email: req.user.email
        });

        if (!loggedInUser) {
            logger.error('Logged-in user not found in database', { 
                requestId,
                email: req.user.email
            });
            return res.status(404).json({
                error: 'User not found',
                message: 'Your user account could not be found'
            });
        }

        // Get all users excluding the current user
        const allUsers = await userService.getAllUsers({ userId: loggedInUser._id });

        if (!Array.isArray(allUsers)) {
            logger.warn('getAllUsers service returned non-array result', { 
                requestId,
                userId: loggedInUser._id,
                email: loggedInUser.email,
                resultType: typeof allUsers
            });
        }

        logger.info('Users list retrieved successfully', { 
            requestId,
            requesterId: loggedInUser._id,
            requesterEmail: loggedInUser.email,
            userCount: Array.isArray(allUsers) ? allUsers.length : 'unknown'
        });

        return res.status(200).json({
            users: allUsers || []
        });

    } catch (error) {
        logger.error('Get all users controller error', { 
            requestId,
            userEmail: req.user?.email || 'unknown',
            userId: req.user?._id || req.user?.id || 'unknown',
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({ 
            error: error.message || 'Failed to retrieve users',
            message: 'Unable to get user list'
        });
    }
};