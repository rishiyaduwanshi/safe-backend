import { Router } from 'express';
import {
    submitReport,
    getMyReports,
    getReportById,
    getMyStats,
} from '@/controllers/report.controller';
import { authenticate, requireProfile } from '@/middlewares/auth.mid';
import { validateBody, validateParams } from '@/middlewares/validate.mid';
import { reportSchema, reportParamsSchema } from '@/validations';

const router: Router = Router();

/**
 * @route   POST /api/v1/reports
 * @desc    Submit a new safety report
 * @access  Private — user must have completed DL verification (profileId set)
 */
router.post('/', authenticate, requireProfile, validateBody(reportSchema), submitReport);

/**
 * @route   GET /api/v1/reports/me
 * @desc    Get all reports submitted by the logged-in user
 * @access  Private (authenticated)
 */
router.get('/me', authenticate, getMyReports);

/**
 * @route   GET /api/v1/reports/stats
 * @desc    Get CSS (Citizen Safety Score) + report counts for logged-in user
 * @access  Private (authenticated)
 */
router.get('/stats', authenticate, getMyStats);

/**
 * @route   GET /api/v1/reports/:id
 * @desc    Get a single report by ID (must belong to logged-in user)
 * @access  Private (authenticated)
 */
router.get('/:id', authenticate, validateParams(reportParamsSchema), getReportById);

export default router;
