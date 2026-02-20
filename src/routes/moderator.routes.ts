import { Router } from 'express';
import { z } from 'zod';

import { authenticateModerator } from '@/middlewares/auth.mid';
import { requirePermission } from '@/middlewares/auth.mid';
import { validateBody, validateParams } from '@/middlewares/validate.mid';
import { Permission } from '@/data/permissions';

import { moderatorLoginSchema } from '@/validations/validate.admin';
import {
    modSignin,
    modMe,
    modRefresh,
    modSignout,
} from '@/controllers/mod.auth.controller';
import {
    listReports,
    getReport,
    approveReport,
    rejectReport,
    getModeratorStats,
} from '@/controllers/mod.report.controller';

const router: Router = Router();

const objectIdSchema = z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID'),
});

// ─── Auth (public) ────────────────────────────────────────────────────────────
router.post('/auth/signin', validateBody(moderatorLoginSchema), modSignin);
router.post('/auth/refresh', modRefresh);

// ─── Auth (protected) ────────────────────────────────────────────────────────
router.get('/auth/me', authenticateModerator, modMe);
router.post('/auth/signout', authenticateModerator, modSignout);

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get(
    '/stats',
    authenticateModerator,
    requirePermission(Permission.REPORT_VIEW),
    getModeratorStats
);

// ─── Reports ─────────────────────────────────────────────────────────────────
router.get(
    '/reports',
    authenticateModerator,
    requirePermission(Permission.REPORT_VIEW),
    listReports
);

router.get(
    '/reports/:id',
    authenticateModerator,
    requirePermission(Permission.REPORT_VIEW),
    validateParams(objectIdSchema),
    getReport
);

router.patch(
    '/reports/:id/approve',
    authenticateModerator,
    requirePermission(Permission.REPORT_APPROVE),
    validateParams(objectIdSchema),
    approveReport
);

router.patch(
    '/reports/:id/reject',
    authenticateModerator,
    requirePermission(Permission.REPORT_REJECT),
    validateParams(objectIdSchema),
    rejectReport
);

export default router;
