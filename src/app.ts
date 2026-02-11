import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { config } from '@config/index';
import { AppError } from '@/utils/appError';
import { HttpStatus } from '@/types/common.types';
import httpLogger from '@/utils/appLogger';
import globalErrorHandler from '@/middlewares/globalError.mid';
import { corsOptions } from '@config/cors';

const app: Express = express();

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(httpLogger);
app.use(rateLimit(config.GLOBAL_RATE_LIMIT_CONFIG));
app.use(rateLimit(config.PER_IP_RATE_LIMIT_CONFIG));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
import indexRoutes from './routes/index';
import authRoutes from './routes/auth.routes';

// API routes
const api = express.Router();

app.use('/', indexRoutes);
api.use('/auth', authRoutes);

app.use(`/api/v${config.VERSION.split('.')[0]}`, api);

// 404 handler for undefined routes
app.use((_req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError({ 
    statusCode: HttpStatus.NOT_FOUND, 
    message: 'Route not found' 
  }));
});

// Global error handler (must be last)
app.use(globalErrorHandler);

export default app;
