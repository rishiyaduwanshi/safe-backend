import { Response } from 'express';
import { cookieOptions } from '@config/cookie';
import { TokenPair } from '@/types/common.types';

/**
 * Sets JWT tokens as HTTP-only cookies
 * @param res - Express response object
 * @param tokens - Access and refresh tokens
 */
const setTokenCookies = (res: Response, tokens: TokenPair): void => {
  res.cookie('accessToken', tokens.accessToken, cookieOptions.accessToken);
  res.cookie('refreshToken', tokens.refreshToken, cookieOptions.refreshToken);
};

export default setTokenCookies;
