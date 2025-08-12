import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    geminiApiKey: process.env.GOOGLE_AI_KEY || process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    redisUrl: process.env.REDIS_URL,
    nodeEnv: process.env.NODE_ENV || 'development'
};

// Validate required environment variables
if (!config.geminiApiKey) {
    console.error('Warning: GOOGLE_AI_KEY or GEMINI_API_KEY environment variable is not set');
}

if (!config.mongoUri) {
    console.error('Warning: MONGO_URI environment variable is not set');
}

if (!config.jwtSecret) {
    console.error('Warning: JWT_SECRET environment variable is not set');
}

export default config;
