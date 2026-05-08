import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import appResponse from '@/utils/appResponse';
import { HttpStatus } from '@/types/common.types';
import { BadRequestError, UnauthorizedError } from '@/utils/appError';
import { PushSubscriptionModel } from '@/models/pushSubscription.model';
import { getVapidPublicKey } from '@/services/push';

// GET /api/v1/push/vapid-public-key
export const getPublicKey = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const key = getVapidPublicKey();
    if (!key) {
      throw new BadRequestError('Push not configured (missing VAPID_PUBLIC_KEY)');
    }

    appResponse(res, {
      statusCode: HttpStatus.OK,
      message: 'VAPID key fetched',
      data: { publicKey: key },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/push/subscribe
export const subscribe = async (
  req: Request<unknown, unknown, { subscription?: any; userAgent?: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) throw new UnauthorizedError('Authentication required');

    const subscription = req.body?.subscription;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      throw new BadRequestError('Invalid subscription payload');
    }

    const userAgent = typeof req.body?.userAgent === 'string' ? req.body.userAgent : '';

    const doc = await PushSubscriptionModel.findOneAndUpdate(
      { endpoint: String(subscription.endpoint) },
      {
        $set: {
          user: new mongoose.Types.ObjectId(req.user.id),
          endpoint: String(subscription.endpoint),
          keys: {
            p256dh: String(subscription.keys.p256dh),
            auth: String(subscription.keys.auth),
          },
          userAgent,
          lastSeenAt: new Date(),
        },
      },
      { upsert: true, new: true }
    )
      .select('endpoint createdAt')
      .lean();

    appResponse(res, {
      statusCode: HttpStatus.OK,
      message: 'Push subscription saved',
      data: { subscription: doc },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/push/unsubscribe
export const unsubscribe = async (
  req: Request<unknown, unknown, { endpoint?: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.id) throw new UnauthorizedError('Authentication required');

    const endpoint = String(req.body?.endpoint ?? '').trim();
    if (!endpoint) throw new BadRequestError('Missing endpoint');

    await PushSubscriptionModel.deleteOne({ endpoint, user: new mongoose.Types.ObjectId(req.user.id) });

    appResponse(res, {
      statusCode: HttpStatus.OK,
      message: 'Unsubscribed',
      data: { ok: true },
    });
  } catch (error) {
    next(error);
  }
};
