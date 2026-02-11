import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { BadRequestError } from '@/utils/appError';
import { ValidationError as AppValidationError } from '@/types/common.types';

/**
 * Generic validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
export function validateRequest<T extends z.ZodTypeAny>(
  schema: T,
  source: 'body' | 'query' | 'params' | 'cookies' = 'body'
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = req[source];
      const validated = schema.parse(data);
      
      // Replace the request data with validated data
      req[source] = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Transform Zod errors to our ValidationError format
        const validationErrors: AppValidationError[] = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        next(new BadRequestError(
          'Validation failed',
          validationErrors
        ));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate request body
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return validateRequest(schema, 'body');
}

/**
 * Validate query parameters
 */
export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return validateRequest(schema, 'query');
}

/**
 * Validate URL parameters
 */
export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return validateRequest(schema, 'params');
}

/**
 * Validate cookies
 */
export function validateCookies<T extends z.ZodTypeAny>(schema: T) {
  return validateRequest(schema, 'cookies');
}
