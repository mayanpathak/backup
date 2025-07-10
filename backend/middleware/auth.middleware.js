import jwt from "jsonwebtoken";
import redisClient from "../services/redis.service.js";
import User from '../models/user.model.js';
import Project from '../models/project.model.js';
import { getProjectById } from '../services/project.service.js';
import dotenv from 'dotenv';

// Ensure environment variables are loaded with appropriate path
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });

// Structured logging helper for consistent formatting
const logger = {
    info: (message, context = {}) => {
        console.log(`[${new Date().toISOString()}] AUTH-INFO: ${message}`, context);
    },
    warn: (message, context = {}) => {
        console.warn(`[${new Date().toISOString()}] AUTH-WARN: ${message}`, context);
    },
    error: (message, context = {}) => {
        console.error(`[${new Date().toISOString()}] AUTH-ERROR: ${message}`, context);
    },
    debug: (message, context = {}) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[${new Date().toISOString()}] AUTH-DEBUG: ${message}`, context);
        }
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

// Improved token extraction function with better error handling
const extractToken = (req) => {
    try {
        // Check Authorization header first (Bearer token)
        const authHeader = req.header('Authorization') || req.headers?.authorization || req.headers?.Authorization;
        if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '').trim();
            if (token) return token;
        }
        
        // Then check cookies
        if (req.cookies && req.cookies.token && typeof req.cookies.token === 'string') {
            return req.cookies.token.trim();
        }
        
        // Finally check if token is in request body (not recommended but sometimes used)
        if (req.body && req.body.token && typeof req.body.token === 'string') {
            return req.body.token.trim();
        }
        
        // Async debug logging (non-blocking)
        setImmediate(() => {
            logger.debug('Token extraction failed', {
                hasAuthHeader: !!authHeader,
                hasCookies: !!req.cookies,
                cookieKeys: req.cookies ? Object.keys(req.cookies) : [],
                url: req.originalUrl,
                method: req.method
            });
        });
        
        return null;
    } catch (error) {
        // Async error logging (non-blocking)
        setImmediate(() => {
            logger.error('Token extraction error', {
                error: error.message,
                url: req.originalUrl,
                method: req.method
            });
        });
        return null;
    }
};

export const authUser = async (req, res, next) => {
    try {
        // Verify JWT secret is configured
        if (!process.env.JWT_SECRET) {
            logger.error('JWT_SECRET environment variable is not configured');
            return res.status(500).json({
                status: 'error',
                message: 'Server misconfiguration - contact administrator'
            });
        }
        
        // Extract token using the improved function
        const token = extractToken(req);
        
        if (!token) {
            // Async logging for missing token (non-blocking)
            setImmediate(() => {
                logger.warn('Authentication failed - no token provided', {
                    url: req.originalUrl,
                    method: req.method,
                    userAgent: req.headers['user-agent']
                });
            });
            
            return res.status(401).json({
                status: 'error',
                message: 'Not authorized, no token provided'
            });
        }
        
        // Check if token is blacklisted (logout)
        try {
            const isBlacklisted = await redisClient.get(token);
            if (isBlacklisted) {
                // Async logging for blacklisted token (non-blocking)
                setImmediate(() => {
                    logger.warn('Authentication failed - blacklisted token used', {
                        tokenPrefix: token.substring(0, 10) + '...',
                        url: req.originalUrl,
                        method: req.method
                    });
                });
                
                return res.status(401).json({
                    status: 'error',
                    message: 'Token has been invalidated. Please log in again.',
                    code: 'TOKEN_BLACKLISTED'
                });
            }
        } catch (redisError) {
            // Redis error - log warning but continue (don't block authentication)
            setImmediate(() => {
                logger.warn('Redis check failed during authentication', {
                    error: redisError.message,
                    tokenPrefix: token.substring(0, 10) + '...'
                });
            });
        }
        
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (tokenError) {
            if (tokenError.name === 'TokenExpiredError') {
                // Token expired - try to refresh it if we can identify the user
                try {
                    // Extract data without verification to find the user
                    const expiredDecoded = jwt.decode(token);
                    if (expiredDecoded && expiredDecoded.email) {
                        // Find user by email
                        const user = await User.findOne({ email: expiredDecoded.email }).select('-password');
                        
                        if (user) {
                            // User found - generate new token
                            const newToken = await user.generateJWT();
                            
                            if (!newToken) {
                                throw new Error('Failed to generate new token');
                            }
                            
                            // Set the new token in cookie
                            res.cookie('token', newToken, COOKIE_OPTIONS);
                            
                            // Set user in the request and continue
                            req.user = user;
                            
                            // Async success logging (non-blocking)
                            setImmediate(() => {
                                logger.info('Token refreshed successfully for expired token', {
                                    userId: user._id,
                                    email: user.email,
                                    url: req.originalUrl
                                });
                            });
                            
                            // Set refreshed token header so client can update
                            res.set('X-Refreshed-Token', newToken);
                            
                            // Continue to the route handler
                            return next();
                        }
                    }
                } catch (refreshError) {
                    // Async error logging (non-blocking)
                    setImmediate(() => {
                        logger.error('Token refresh failed', {
                            error: refreshError.message,
                            originalTokenPrefix: token.substring(0, 10) + '...'
                        });
                    });
                }
                
                // If we reach here, refresh failed
                return res.status(401).json({
                    status: 'error',
                    message: 'Your session has expired. Please log in again.',
                    code: 'TOKEN_EXPIRED'
                });
            }
            
            if (tokenError.name === 'JsonWebTokenError') {
                // Async logging for invalid token (non-blocking)
                setImmediate(() => {
                    logger.warn('Authentication failed - invalid token format', {
                        error: tokenError.message,
                        tokenPrefix: token.substring(0, 10) + '...',
                        url: req.originalUrl
                    });
                });
                
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid token. Please log in again.',
                    code: 'INVALID_TOKEN'
                });
            }
            
            // Other JWT errors
            setImmediate(() => {
                logger.error('JWT verification failed', {
                    error: tokenError.message,
                    tokenPrefix: token.substring(0, 10) + '...',
                    url: req.originalUrl
                });
            });
            
            return res.status(401).json({
                status: 'error',
                message: 'Token verification failed. Please log in again.',
                code: 'TOKEN_VERIFICATION_FAILED'
            });
        }
        
        if (!decoded || !decoded.email) {
            // Async logging for invalid decoded token (non-blocking)
            setImmediate(() => {
                logger.warn('Authentication failed - invalid token payload', {
                    hasDecoded: !!decoded,
                    hasEmail: !!(decoded && decoded.email),
                    url: req.originalUrl
                });
            });
            
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token payload'
            });
        }
        
        // Find user in database
        const user = await User.findOne({ email: decoded.email }).select('-password');
        
        if (!user) {
            // Async logging for user not found (non-blocking)
            setImmediate(() => {
                logger.warn('Authentication failed - user not found in database', {
                    email: decoded.email,
                    url: req.originalUrl
                });
            });
            
            return res.status(401).json({
                status: 'error',
                message: 'User not found'
            });
        }
        
        // Set user in request object
        req.user = user;
        
        // Async success logging (non-blocking)
        setImmediate(() => {
            logger.info('User authenticated successfully', {
                userId: user._id,
                email: user.email,
                url: req.originalUrl,
                method: req.method
            });
        });
        
        // Check if this is a project-related route and load project data
        const projectIdParam = req.params.projectId;
        if (projectIdParam && projectIdParam.trim()) {
            try {
                // Validate projectId format (basic MongoDB ObjectId check)
                if (!/^[0-9a-fA-F]{24}$/.test(projectIdParam.trim())) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'Invalid project ID format'
                    });
                }
                
                // Load project data for validation
                const project = await Project.findById(projectIdParam.trim());
                
                if (!project) {
                    // Async logging for project not found (non-blocking)
                    setImmediate(() => {
                        logger.warn('Project access failed - project not found', {
                            userId: user._id,
                            email: user.email,
                            projectId: projectIdParam,
                            url: req.originalUrl
                        });
                    });
                    
                    return res.status(404).json({
                        status: 'error',
                        message: 'Project not found'
                    });
                }
                
                // Check if user has access to the project
                if (!project.users || !Array.isArray(project.users)) {
                    // Async logging for invalid project structure (non-blocking)
                    setImmediate(() => {
                        logger.error('Project access validation failed - invalid project users structure', {
                            userId: user._id,
                            email: user.email,
                            projectId: project._id,
                            hasUsers: !!project.users,
                            usersType: typeof project.users
                        });
                    });
                    
                    return res.status(500).json({
                        status: 'error',
                        message: 'Project data is corrupted'
                    });
                }
                
                const hasAccess = project.users.some(
                    userId => userId && userId.toString() === user._id.toString()
                );
                
                if (!hasAccess) {
                    // Async logging for access denied (non-blocking)
                    setImmediate(() => {
                        logger.warn('Project access denied - user not authorized', {
                            userId: user._id,
                            email: user.email,
                            projectId: project._id,
                            projectUsers: project.users.length,
                            url: req.originalUrl
                        });
                    });
                    
                    return res.status(403).json({
                        status: 'error',
                        message: 'You do not have access to this project'
                    });
                }
                
                // Attach project to request for use in controllers
                req.project = project;
                
                // Async success logging (non-blocking)
                setImmediate(() => {
                    logger.info('Project access validated successfully', {
                        userId: user._id,
                        email: user.email,
                        projectId: project._id,
                        url: req.originalUrl
                    });
                });
                
            } catch (projectError) {
                // Async error logging (non-blocking)
                setImmediate(() => {
                    logger.error('Project validation error', {
                        userId: user._id,
                        email: user.email,
                        projectId: projectIdParam,
                        error: projectError.message,
                        url: req.originalUrl
                    });
                });
                
                return res.status(500).json({
                    status: 'error',
                    message: 'Error validating project access'
                });
            }
        }
        
        // Continue to next middleware/route handler
        next();
        
    } catch (error) {
        // Async critical error logging (non-blocking)
        setImmediate(() => {
            logger.error('Auth middleware critical error', {
                error: error.message,
                stack: error.stack,
                url: req.originalUrl,
                method: req.method,
                userAgent: req.headers['user-agent']
            });
        });
        
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error during authentication'
        });
    }
};