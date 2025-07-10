import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';
import redisClient from '../services/redis.service.js';

const router = Router();

router.get('/get-result', aiController.getResult);

// Health check for Redis connectivity
router.get('/redis-health', async (req, res) => {
    try {
        // Test Redis connectivity with a PING command
        const ping = await redisClient.raw.ping();
        
        if (ping === 'PONG') {
            return res.status(200).json({
                status: 'success',
                message: 'Redis connection is healthy',
                timestamp: new Date().toISOString()
            });
        } else {
            return res.status(500).json({
                status: 'error',
                message: 'Redis connection is not responding properly',
                response: ping
            });
        }
    } catch (error) {
        console.error('Redis health check failed:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Redis health check failed',
            error: error.message
        });
    }
});

export default router;