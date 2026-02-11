import { Response } from 'express';
import { ApiResponse, HttpStatus } from '@/types/common.types';

interface AppResponseOptions<T = unknown> {
  readonly statusCode?: HttpStatus;
  readonly message?: string;
  readonly data?: T;
}

/**
 * Sends a standardized API response
 * @template T - The type of data being sent
 */
export default function appResponse<T = unknown>(
  res: Response,
  { 
    statusCode = HttpStatus.OK, 
    message = 'Success', 
    data 
  }: AppResponseOptions<T>
): void {
  const response: ApiResponse<T> = {
    message,
    statusCode,
    success: true,
    data,
  };
  
  res.status(statusCode).json(response);
}
