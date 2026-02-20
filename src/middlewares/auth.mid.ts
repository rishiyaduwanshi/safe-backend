import { config } from '@config/index';
import { NextFunction, Request, Response } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { JwtPayload, ModeratorJwtPayload, UserRole } from '@/types/common.types';
import { ForbiddenError, UnauthorizedError } from '@/utils/appError';
import { Permission } from '@/data/permissions';

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
      name: decoded.name,
      email: decoded.email,
      role: decoded.role ?? UserRole.USER,
    };

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      next(new UnauthorizedError('Token has expired'));
    } else if (error instanceof JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
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
      throw new ForbiddenError('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to authenticate Moderator JWT tokens from cookies
 */
export const authenticateModerator = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const cookies = req.cookies as Record<string, string> | undefined;
    const token = cookies?.['moderatorAccessToken'];

    if (!token) {
      throw new UnauthorizedError('Moderator authentication token missing');
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as ModeratorJwtPayload;

    if (decoded.actorType !== 'moderator') {
      throw new UnauthorizedError('Invalid token type');
    }

    req.moderator = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      permissions: decoded.permissions,
    };

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      next(new UnauthorizedError('Moderator token has expired'));
    } else if (error instanceof JsonWebTokenError) {
      next(new UnauthorizedError('Invalid moderator token'));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware factory to check if authenticated moderator has a specific permission.
 * Must be used after authenticateModerator.
 *
 * @example
 * router.patch('/reports/:id/approve', authenticateModerator, requirePermission(Permission.REPORT_APPROVE), handler)
 */
export const requirePermission = (permission: Permission) => (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.moderator) {
      throw new UnauthorizedError('Moderator authentication required');
    }

    if (!req.moderator.permissions.includes(permission)) {
      throw new ForbiddenError(`Missing permission: ${permission}`);
    }

    next();
  } catch (error) {
    next(error);
  }
};
