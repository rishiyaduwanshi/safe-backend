import { Request, Response, NextFunction } from 'express';
import logger from '@/utils/errorLogger';
import { AppError } from '@/utils/appError';
import { config } from '@config/index';
import { Environment, ErrorResponse, HttpStatus } from '@/types/common.types';

const globalErrorHandler = (
  err: Error | AppError, 
  req: Request, 
  res: Response, 
  _next: NextFunction
): void => {
  try {
    const isDev = config.NODE_ENV === Environment.DEVELOPMENT;
    
    const formattedErr: AppError = err instanceof AppError
      ? err
      : new AppError({
          message: isDev ? err.message : 'Something went wrong!',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          stack: err.stack || '',
          errors: [],
        });

    // Log the error
    try {
      const userAgent = req.headers['user-agent'] || 'Unknown';
      logger.error(
        `[${formattedErr.statusCode}] ${req.method} ${req.originalUrl} - ${userAgent}\n${formattedErr.stack}`
      );
    } catch (logError) {
      console.error('🚨 Logger failed:', logError);
    }

    const errorResponse: ErrorResponse = {
      message: formattedErr.message,
      statusCode: formattedErr.statusCode,
      success: false,
      errors: isDev ? formattedErr.errors : [],
      ...(isDev && { stack: formattedErr.stack }),
    };

    res.status(formattedErr.statusCode).json(errorResponse);
  } catch (fatalError) {
    logger.error(`🔥 Critical Error in Error Handler:\n${fatalError}`);
    
    const criticalResponse: ErrorResponse = {
      message: 'Internal server error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      errors: [],
    };
    
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(criticalResponse);
  }
};

export default globalErrorHandler;
