import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { BadRequestError } from '@/utils/appError';
import { ValidationError as AppValidationError } from '@/types/common.types';

/**
 * Generic validation middleware factory
 * Validates request body, query, params, or cookies against a Zod schema
 */
export function validateRequest<T extends z.ZodTypeAny>(
    schema: T,
    source: 'body' | 'query' | 'params' | 'cookies' = 'body'
) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            const data = req[source];
            const validated = schema.parse(data);

            if (source === 'body') {
                req.body = validated;
            } else {
                const target = req[source] as unknown;
                if (target && typeof target === 'object') {
                    for (const key of Object.keys(target as Record<string, unknown>)) {
                        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                        delete (target as Record<string, unknown>)[key];
                    }
                    Object.assign(target as Record<string, unknown>, validated);
                } else {
                    // Fallback (should rarely happen)
                    (req as unknown as Record<string, unknown>)[source] = validated;
                }
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const validationErrors: AppValidationError[] = error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));

                next(new BadRequestError('Validation failed', validationErrors));
            } else {
                next(error);
            }
        }
    };
}

export function validateBody<T extends z.ZodTypeAny>(schema: T) {
    return validateRequest(schema, 'body');
}

export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
    return validateRequest(schema, 'query');
}

export function validateParams<T extends z.ZodTypeAny>(schema: T) {
    return validateRequest(schema, 'params');
}

export function validateCookies<T extends z.ZodTypeAny>(schema: T) {
    return validateRequest(schema, 'cookies');
}
