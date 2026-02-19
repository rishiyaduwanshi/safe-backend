import { Router } from 'express';
import {
    submitReport,
    getMyReports,
    getReportById,
} from '@/controllers/report.controller';
import { authenticate } from '@/middlewares/auth.mid';
import { validateBody, validateParams } from '@/middlewares/validate.mid';
import { reportSchema, reportParamsSchema } from '@/validations';

const router: Router = Router();

/**
 * @route   POST /api/v1/reports
 * @desc    Submit a new safety report
 * @access  Private (authenticated)
 */
router.post('/', authenticate, validateBody(reportSchema), submitReport);

/**
 * @route   GET /api/v1/reports/me
 * @desc    Get all reports submitted by the logged-in user
 * @access  Private (authenticated)
 */
router.get('/me', authenticate, getMyReports);

/**
 * @route   GET /api/v1/reports/:id
 * @desc    Get a single report by ID (must belong to logged-in user)
 * @access  Private (authenticated)
 */
router.get('/:id', authenticate, validateParams(reportParamsSchema), getReportById);

export default router;
