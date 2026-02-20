import { Router } from 'express';
import { authenticate, requireAdmin } from '@/middlewares/auth.mid';
import { validateBody, validateParams } from '@/middlewares/validate.mid';
import {
  createModerator,
  listModerators,
  getModerator,
  updateModeratorPermissions,
  toggleModeratorStatus,
  deleteModerator,
} from '@/controllers/admin.controller';
import {
  createModeratorSchema,
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
router.post('/moderators',          validateBody(createModeratorSchema),                               createModerator);
router.get('/moderators',                                                                              listModerators);
router.get('/moderators/:id',       validateParams(objectIdSchema),                                    getModerator);
router.patch('/moderators/:id/permissions', validateParams(objectIdSchema), validateBody(updateModeratorPermissionsSchema), updateModeratorPermissions);
router.patch('/moderators/:id/toggle',      validateParams(objectIdSchema),                            toggleModeratorStatus);
router.delete('/moderators/:id',    validateParams(objectIdSchema),                                    deleteModerator);

export default router;
