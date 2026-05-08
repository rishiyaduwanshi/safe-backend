import { Router } from 'express';
import { authenticate } from '@/middlewares/auth.mid';
import { getPublicKey, subscribe, unsubscribe } from '@/controllers/push.controller';

const router: Router = Router();

router.get('/vapid-public-key', getPublicKey);
router.post('/subscribe', authenticate, subscribe);
router.delete('/unsubscribe', authenticate, unsubscribe);

export default router;
