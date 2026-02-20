import { Router } from 'express';
import { licenceLookup } from '@/controllers/license.controller';
import { authenticate } from '@/middlewares/auth.mid';

const router: Router = Router();

/**
 * @route   POST /api/v1/license/lookup
 * @desc    Fetch driving license + personal info from Sarathi Parivahan DB
 * @access  Private (authenticated users only)
 * @body    { dlNumber: string, name?: string }
 */
router.post('/lookup', authenticate, licenceLookup);

export default router;
