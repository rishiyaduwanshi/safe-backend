import { cookieOptions } from '@config/cookie';
import type { Response } from 'express';
import type { TokenPair } from '@/types/common.types';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Sets JWT tokens as HTTP-only cookies + a readable userInfo cookie for frontend
 */
const setTokenCookies = (res: Response, tokens: TokenPair, user?: UserInfo): void => {
  res.cookie('accessToken', tokens.accessToken, cookieOptions.accessToken);
  res.cookie('refreshToken', tokens.refreshToken, cookieOptions.refreshToken);
  if (user) {
    // Non-httpOnly: frontend JS reads this to restore user state on page refresh
    // NOT used for auth — backend always validates the httpOnly accessToken
    res.cookie('userInfo', JSON.stringify(user), cookieOptions.userInfo);
  }
};

export default setTokenCookies;
