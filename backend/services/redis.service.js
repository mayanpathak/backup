import Redis from 'ioredis';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Check if Redis config is available
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisPassword = process.env.REDIS_PASSWORD || '';

// Create Redis client with reconnection options
const redisClient = new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword || undefined, // Use undefined instead of empty string
    retryStrategy: (times) => {
        // Exponential backoff strategy with jitter
        const delay = Math.min(times * 50 + Math.random() * 100, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true, // Don't connect immediately
    keepAlive: true,
    connectTimeout: 10000,
    commandTimeout: 5000
});

// Event handlers for connection management
redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

redisClient.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
});

redisClient.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
});

redisClient.on('close', () => {
    console.log('🔌 Redis connection closed');
});

// Wrap Redis operations with error handling
const safeRedisOperation = async (operation) => {
    try {
        // Ensure connection is established
        if (redisClient.status !== 'ready') {
            await redisClient.connect();
        }
        return await operation();
    } catch (error) {
        console.error(`Redis operation failed: ${error.message}`);
        throw new Error(`Redis operation failed: ${error.message}`);
    }
};

// Helper function to ensure parameters are the right type
const ensureNumber = (value) => {
    if (value === undefined || value === null) return null;
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num; // Return null instead of 0 for invalid numbers
};

// Enhanced Redis client with error handling
const enhancedRedisClient = {
    // Basic operations
    get: (key) => {
        if (!key) throw new Error('Key is required');
        return safeRedisOperation(() => redisClient.get(key));
    },
    
    set: (key, value, ttl) => {
        if (!key) throw new Error('Key is required');
        if (value === undefined || value === null) throw new Error('Value is required');
        
        if (ttl) {
            const ttlSeconds = ensureNumber(ttl);
            if (ttlSeconds === null || ttlSeconds <= 0) {
                throw new Error('TTL must be a positive number');
            }
            return safeRedisOperation(() => redisClient.set(key, value, 'EX', ttlSeconds));
        }
        return safeRedisOperation(() => redisClient.set(key, value));
    },
    
    del: (key) => {
        if (!key) throw new Error('Key is required');
        return safeRedisOperation(() => redisClient.del(key));
    },

    // List operations
    lpush: (key, value) => {
        if (!key) throw new Error('Key is required');
        if (value === undefined || value === null) throw new Error('Value is required');
        return safeRedisOperation(() => redisClient.lpush(key, value));
    },
    
    rpush: (key, value) => {
        if (!key) throw new Error('Key is required');
        if (value === undefined || value === null) throw new Error('Value is required');
        return safeRedisOperation(() => redisClient.rpush(key, value));
    },
    
    lrange: (key, start, end) => {
        if (!key) throw new Error('Key is required');
        const startNum = ensureNumber(start);
        const endNum = ensureNumber(end);
        if (startNum === null || endNum === null) {
            throw new Error('Start and end must be valid numbers');
        }
        return safeRedisOperation(() => redisClient.lrange(key, startNum, endNum));
    },
    
    ltrim: (key, start, end) => {
        if (!key) throw new Error('Key is required');
        const startNum = ensureNumber(start);
        const endNum = ensureNumber(end);
        if (startNum === null || endNum === null) {
            throw new Error('Start and end must be valid numbers');
        }
        return safeRedisOperation(() => redisClient.ltrim(key, startNum, endNum));
    },
    
    llen: (key) => {
        if (!key) throw new Error('Key is required');
        return safeRedisOperation(() => redisClient.llen(key));
    },

    // Hash operations
    hset: (key, field, value) => {
        if (!key) throw new Error('Key is required');
        if (!field) throw new Error('Field is required');
        if (value === undefined || value === null) throw new Error('Value is required');
        return safeRedisOperation(() => redisClient.hset(key, field, value));
    },
    
    hget: (key, field) => {
        if (!key) throw new Error('Key is required');
        if (!field) throw new Error('Field is required');
        return safeRedisOperation(() => redisClient.hget(key, field));
    },
    
    hgetall: (key) => {
        if (!key) throw new Error('Key is required');
        return safeRedisOperation(() => redisClient.hgetall(key));
    },
    
    hdel: (key, field) => {
        if (!key) throw new Error('Key is required');
        if (!field) throw new Error('Field is required');
        return safeRedisOperation(() => redisClient.hdel(key, field));
    },

    // Set operations
    sadd: (key, ...members) => {
        if (!key) throw new Error('Key is required');
        if (members.length === 0) throw new Error('At least one member is required');
        return safeRedisOperation(() => redisClient.sadd(key, ...members));
    },
    
    smembers: (key) => {
        if (!key) throw new Error('Key is required');
        return safeRedisOperation(() => redisClient.smembers(key));
    },
    
    srem: (key, ...members) => {
        if (!key) throw new Error('Key is required');
        if (members.length === 0) throw new Error('At least one member is required');
        return safeRedisOperation(() => redisClient.srem(key, ...members));
    },

    // Expiration
    expire: (key, seconds) => {
        if (!key) throw new Error('Key is required');
        const ttlSeconds = ensureNumber(seconds);
        if (ttlSeconds === null || ttlSeconds <= 0) {
            throw new Error('Seconds must be a positive number');
        }
        return safeRedisOperation(() => redisClient.expire(key, ttlSeconds));
    },
    
    ttl: (key) => {
        if (!key) throw new Error('Key is required');
        return safeRedisOperation(() => redisClient.ttl(key));
    },

    // Transaction
    multi: () => redisClient.multi(),

    // Utility methods
    ping: () => safeRedisOperation(() => redisClient.ping()),
    
    disconnect: async () => {
        try {
            await redisClient.quit();
            console.log('🔌 Redis disconnected gracefully');
        } catch (error) {
            console.error('Error disconnecting Redis:', error.message);
            redisClient.disconnect();
        }
    },

    // Raw client for advanced operations
    raw: redisClient
};

// Graceful shutdown handling
process.on('SIGINT', async () => {
    console.log('🛑 Received SIGINT, closing Redis connection...');
    await enhancedRedisClient.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 Received SIGTERM, closing Redis connection...');
    await enhancedRedisClient.disconnect();
    process.exit(0);
});

export default enhancedRedisClient;