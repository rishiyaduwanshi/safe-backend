import { Router } from 'express';
import {
  register as signup,
  login as signin,
  refreshToken,
  logout as signout,
  me,
} from '@/controllers/auth.controller';
import { authenticate } from '@/middlewares/auth.mid';
import { validateBody, validateCookies } from '@/middlewares/validate.mid';
import { loginSchema, refreshTokenSchema, registerSchema } from '@/validations';

const router: Router = Router();

router.post('/signup', validateBody(registerSchema), signup);
router.post('/signin', validateBody(loginSchema), signin);
router.post('/refresh-token', validateCookies(refreshTokenSchema), refreshToken);
router.post('/signout', authenticate, signout);
router.get('/me', authenticate, me);

export default router;
