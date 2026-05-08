import { Router } from 'express';
import { authenticate, requireAdmin } from '@/middlewares/auth.mid';
import { validateBody, validateParams, validateQuery } from '@/middlewares/validate.mid';
import {
  createModerator,
  listModerators,
  getModerator,
  updateModeratorPermissions,
  toggleModeratorStatus,
  deleteModerator,
  listUsers,
  getUser,
  toggleUserStatus,
} from '@/controllers/admin.controller';
import {
  createModeratorSchema,
  listUsersQuerySchema,
  updateModeratorPermissionsSchema,
} from '@/validations/validate.admin';
import { z } from 'zod';

const router: Router = Router();

// All admin routes require a logged-in admin user
router.use(authenticate, requireAdmin);

const objectIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid moderator ID'),
});

// Moderator management
router.post('/moderators', validateBody(createModeratorSchema), createModerator);
router.get('/moderators', listModerators);
router.get('/moderators/:id', validateParams(objectIdSchema), getModerator);
router.patch('/moderators/:id/permissions', validateParams(objectIdSchema), validateBody(updateModeratorPermissionsSchema), updateModeratorPermissions);
router.patch('/moderators/:id/toggle', validateParams(objectIdSchema), toggleModeratorStatus);
router.delete('/moderators/:id', validateParams(objectIdSchema), deleteModerator);

// Citizen user management
const userObjectIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid user ID'),
});

router.get('/users', validateQuery(listUsersQuerySchema), listUsers);
router.get('/users/:id', validateParams(userObjectIdSchema), getUser);
router.patch('/users/:id/toggle', validateParams(userObjectIdSchema), toggleUserStatus);

export default router;
