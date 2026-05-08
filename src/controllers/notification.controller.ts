import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import appResponse from '@/utils/appResponse';
import { HttpStatus } from '@/types/common.types';
import { BadRequestError, NotFoundError, UnauthorizedError } from '@/utils/appError';
import { NotificationModel } from '@/models/notification.model';

const parseLimit = (value: unknown, fallback: number, max: number) => {
  const n = typeof value === 'string' ? parseInt(value, 10) : NaN;
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(max, n);
};

// GET /api/v1/notifications
export const getMyNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) throw new UnauthorizedError('Authentication required');

    const limit = parseLimit(req.query.limit, 20, 50);
    const unreadOnly = String(req.query.unreadOnly ?? 'false').toLowerCase() === 'true';

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const filter: Record<string, unknown> = { user: userId };
    if (unreadOnly) filter.readAt = null;

    const [notifications, unreadCount] = await Promise.all([
      NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('type title message entityType entityId data readAt createdAt')
        .lean(),
      NotificationModel.countDocuments({ user: userId, readAt: null }),
    ]);

    appResponse(res, {
      message: 'Notifications fetched successfully',
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/notifications/:id/read
export const markNotificationRead = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) throw new UnauthorizedError('Authentication required');

    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid notification id');
    }

    const notification = await NotificationModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), user: new mongoose.Types.ObjectId(req.user.id) },
      { $set: { readAt: new Date() } },
      { new: true }
    )
      .select('type title message entityType entityId data readAt createdAt')
      .lean();

    if (!notification) throw new NotFoundError('Notification not found');

    appResponse(res, {
      statusCode: HttpStatus.OK,
      message: 'Notification marked as read',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/notifications/read-all
export const markAllNotificationsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) throw new UnauthorizedError('Authentication required');

    await NotificationModel.updateMany(
      { user: new mongoose.Types.ObjectId(req.user.id), readAt: null },
      { $set: { readAt: new Date() } }
    );

    appResponse(res, {
      statusCode: HttpStatus.OK,
      message: 'All notifications marked as read',
      data: { ok: true },
    });
  } catch (error) {
    next(error);
  }
};
