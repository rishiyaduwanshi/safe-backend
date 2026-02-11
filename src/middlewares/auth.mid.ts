import { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError } from 'jsonwebtoken';
import { UnauthorizedError } from '@/utils/appError';
import { config } from '@config/index';
import { JwtPayload, UserRole } from '@/types/common.types';

/**
 * Middleware to authenticate JWT tokens from cookies
 */
export const authenticate = (
  req: Request, 
  _res: Response, 
  next: NextFunction
): void => {
  try {
    const cookies = req.cookies as Record<string, string> | undefined;
    const token = cookies?.['accessToken'];

    if (!token) {
      throw new UnauthorizedError('Authentication token missing');
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    
    req.user = { 
      id: decoded.id,
      role: UserRole.USER, // Default role, can be enhanced to include role in JWT
    };

    next();
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      next(new UnauthorizedError('Invalid or expired token'));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (
  req: Request, 
  _res: Response, 
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (req.user.role !== UserRole.ADMIN) {
      throw new UnauthorizedError('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};
