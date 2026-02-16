import { Router } from 'express';
import {
  register as signup,
  login as signin,
  refreshToken,
  logout as signout,
} from '@/controllers/auth.controller';
import {
  validateBody,
  validateCookies,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '@/validators';

const router: Router = Router();

router.post('/signup', validateBody(registerSchema), signup);
router.post('/signin', validateBody(loginSchema), signin);
router.post('/refresh-token', validateCookies(refreshTokenSchema), refreshToken);
router.post('/signout', signout);

export default router;
