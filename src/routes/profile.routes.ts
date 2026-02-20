import { Router } from 'express';
import { authenticate } from '@/middlewares/auth.mid';
import { saveProfile, getMyProfile } from '@/controllers/profile.controller';

const router = Router();

// All profile routes require authentication
router.use(authenticate);

router.get('/me', getMyProfile);
router.post('/save', saveProfile);

export default router;
