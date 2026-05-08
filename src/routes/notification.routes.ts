import { Router } from 'express';
import { authenticate } from '@/middlewares/auth.mid';
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/controllers/notification.controller';

const router: Router = Router();

// GET /api/v1/notifications
router.get('/', authenticate, getMyNotifications);

// PATCH /api/v1/notifications/read-all
router.patch('/read-all', authenticate, markAllNotificationsRead);

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', authenticate, markNotificationRead);

export default router;
