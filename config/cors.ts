import { CorsOptions } from 'cors';
import { config } from './index';
import logger from '@/utils/errorLogger';
import { Environment } from '@/types/common.types';

const isProduction = config.NODE_ENV === Environment.PRODUCTION;

export const corsOptions: CorsOptions = {
  origin: (origin, callback): void => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (config.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }

    // Log blocked CORS requests
    const logMessage = `Blocked CORS request from: ${origin}`;
    if (isProduction) {
      logger.warn(logMessage);
    } else {
      console.warn(`⚠️  ${logMessage}`);
    }

    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400, // 24 hours
};
