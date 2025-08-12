import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Database connection
import connect from './db/db.js';

// Routes
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import aiRoutes from './routes/ai.routes.js';
import chatRoutes from './routes/chat.routes.js';
import templateRoutes from './routes/templates.routes.js';

// Configuration
import { config } from './config/environment.js';

// Initialize database connection with error handling
try {
    await connect();
    console.log('✅ Database connected successfully');
} catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
}

const app = express();

// Set COOP and COEP headers for SharedArrayBuffer support
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
});

// Enhanced CORS configuration combining both projects
const allowedOrigins = [
    'http://localhost:5173',  // Vite dev server
    'http://localhost:5174',  // Alternative Vite port
    'http://localhost:3000',  // Common React dev server
    'https://code-collab-mny8.vercel.app',
    'https://backup-alpha.vercel.app',
    'https://wildermain.vercel.app',  // Wilder project frontend
    'https://wilder-5.onrender.com',
    'https://wilder-3.onrender.com'
];

// CORS configuration
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin) || config.nodeEnv !== 'production') {
            callback(null, true);
        } else {
            console.log('CORS blocked request from:', origin);
            // Allow all origins in development, block in production
            callback(null, config.nodeEnv !== 'production');
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With', 
        'Cookie',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200,
    preflightContinue: false
}));

// Additional CORS headers middleware for extra assurance
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cookie, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
    res.header('Access-Control-Expose-Headers', 'Set-Cookie');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    next();
});

// Middleware setup
app.use(morgan('dev'));

// Body parsing middleware
app.use(express.json({ 
    limit: '10mb',  // Increased for large file uploads
    strict: false
}));

app.use(express.urlencoded({ 
    extended: true,
    limit: '10mb'
}));

app.use(cookieParser());

// Request timeout middleware (skip for auth routes)
app.use((req, res, next) => {
    // Skip timeout for authentication routes and AI routes
    if (req.path.includes('/users/login') || 
        req.path.includes('/users/signup') || 
        req.path.includes('/users/register') ||
        req.path.includes('/chat') ||
        req.path.includes('/template')) {
        return next();
    }
    
    // Set timeout for other requests (45 seconds for AI operations)
    req.setTimeout(45000, () => {
        if (!res.headersSent) {
            res.status(408).json({
                status: 'error',
                message: 'Request timeout'
            });
        }
    });
    next();
});

// Routes setup
// Existing collaborative coding routes
app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/ai', aiRoutes);

// New Wilder project routes for AI code generation
app.use('/chat', chatRoutes);
app.use('/template', templateRoutes);

// Health check endpoint
app.get('/', (req, res) => {
    try {
        res.status(200).json({
            status: 'success',
            message: 'Combined AI Coding Server is running',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            features: [
                'Collaborative Coding',
                'Real-time Chat',
                'AI Code Generation',
                'Project Templates',
                'File Management'
            ]
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Health check failed'
        });
    }
});

// API info endpoint
app.get('/api/info', (req, res) => {
    res.json({
        name: 'Combined AI Coding Platform API',
        version: '2.0.0',
        endpoints: {
            collaborative: {
                users: '/users',
                projects: '/projects', 
                ai: '/ai'
            },
            codeGeneration: {
                chat: '/chat',
                templates: '/template'
            }
        },
        features: [
            'User authentication',
            'Project management',
            'Real-time collaboration',
            'AI-powered code generation',
            'Template-based project creation',
            'File tree management'
        ]
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    // Prevent duplicate error responses
    if (res.headersSent) {
        return next(err);
    }
    
    // Ensure CORS headers are always present, even on errors
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    const isAuthRoute = req.path.includes('/users/login') || 
                       req.path.includes('/users/signup') || 
                       req.path.includes('/users/register');
    
    if (!isAuthRoute) {
        console.error('API Error:', {
            message: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
            timestamp: new Date().toISOString()
        });
    } else {
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
    
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    const responseMessage = config.nodeEnv === 'production' && statusCode === 500
        ? 'Internal Server Error'
        : message;
    
    res.status(statusCode).json({
        status: 'error',
        message: responseMessage
    });
});

// 404 Not Found handler - must be last
app.use((req, res) => {
    // Ensure CORS headers are present even on 404
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    
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