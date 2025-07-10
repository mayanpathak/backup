import express from 'express';
import morgan from 'morgan';
import connect from './db/db.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import aiRoutes from './routes/ai.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// Initialize database connection with error handling
try {
    await connect();
    console.log('Database connected successfully');
} catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
}

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://code-collab-mny8.vercel.app',
    // Add any other frontend domains here
];

// CORS origin checker function
const corsOriginHandler = (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
    } else {
        console.log('CORS blocked request from:', origin);
        // In production, you might want to block unauthorized origins
        // For now, allowing all origins as per original logic
        callback(null, true);
    }
};

// Configure CORS with credentials
app.use(cors({
    origin: corsOriginHandler,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Handle preflight requests explicitly
app.options('*', cors({
    origin: corsOriginHandler,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
    optionsSuccessStatus: 200
}));

// Middleware setup with error handling
app.use(morgan('dev'));

// Body parsing middleware - optimized for fast auth
app.use(express.json({ 
    limit: '1mb', // Reduced limit for faster parsing
    strict: false // Less strict for compatibility
}));

app.use(express.urlencoded({ 
    extended: true,
    limit: '1mb' // Reduced limit for faster parsing
}));

app.use(cookieParser());

// Skip timeout middleware for auth routes to ensure fast login/signup
// Request timeout middleware for non-auth routes only
app.use((req, res, next) => {
    // Skip timeout for authentication routes
    if (req.path.includes('/users/login') || req.path.includes('/users/signup') || req.path.includes('/users/register')) {
        return next();
    }
    
    // Set timeout for other requests (30 seconds)
    req.setTimeout(30000, () => {
        if (!res.headersSent) {
            res.status(408).json({
                status: 'error',
                message: 'Request timeout'
            });
        }
    });
    next();
});

// Routes
app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/ai', aiRoutes);

// Health check endpoint
app.get('/', (req, res) => {
    try {
        res.status(200).json({
            status: 'success',
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Health check failed'
        });
    }
});

// Global error handling middleware - streamlined for auth
app.use((err, req, res, next) => {
    // Prevent duplicate error responses
    if (res.headersSent) {
        return next(err);
    }
    
    // For auth routes, log less and respond faster
    const isAuthRoute = req.path.includes('/users/login') || req.path.includes('/users/signup') || req.path.includes('/users/register');
    
    if (!isAuthRoute) {
        // Full logging for non-auth routes
        console.error('API Error:', {
            message: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
            timestamp: new Date().toISOString()
        });
    } else {
        // Minimal logging for auth routes
        console.error('Auth Error:', err.message);
    }
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            status: 'error',
            message: err.message
        });
    }
    
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token'
        });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            status: 'error',
            message: 'Token expired'
        });
    }
    
    if (err.name === 'CastError') {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid ID format'
        });
    }
    
    if (err.code === 11000) {
        return res.status(409).json({
            status: 'error',
            message: 'Duplicate entry'
        });
    }
    
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid JSON format'
        });
    }
    
    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            status: 'error',
            message: 'Request entity too large'
        });
    }
    
    // Handle known HTTP errors
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    // Don't expose internal errors in production
    const responseMessage = process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'Internal Server Error'
        : message;
    
    res.status(statusCode).json({
        status: 'error',
        message: responseMessage
    });
});

// 404 Not Found handler - must be last
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        type: 'not_found'
    });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

export default app;