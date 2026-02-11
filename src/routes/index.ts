import { Router, Request, Response } from 'express';
import appResponse from '@/utils/appResponse';

const router: Router = Router();

interface HealthCheckData {
  status: 'UP' | 'DOWN';
  timestamp: string;
  uptime: number;
}

/**
 * @route   GET /health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (_req: Request, res: Response): void => {
  const healthData: HealthCheckData = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  appResponse<HealthCheckData>(res, {
    message: 'Server is healthy',
    data: healthData,
  });
});

export default router;
