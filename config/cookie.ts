import { CookieOptions } from 'express';
import { config } from './index';
import { Environment } from '@/types/common.types';

const isProduction = config.NODE_ENV === Environment.PRODUCTION;

const COOKIE_DURATION = {
  ACCESS_TOKEN_PROD: 15 * 60 * 1000,        // 15 minutes in production
  ACCESS_TOKEN_DEV: 2 * 60 * 60 * 1000,     // 2 hours in development
  REFRESH_TOKEN_PROD: 7 * 24 * 60 * 60 * 1000,   // 7 days in production
  REFRESH_TOKEN_DEV: 20 * 24 * 60 * 60 * 1000,   // 20 days in development
} as const;

interface TokenCookieOptions {
  readonly accessToken: CookieOptions;
  readonly refreshToken: CookieOptions;
}

export const cookieOptions: TokenCookieOptions = {
  accessToken: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: isProduction ? COOKIE_DURATION.ACCESS_TOKEN_PROD : COOKIE_DURATION.ACCESS_TOKEN_DEV,
    path: '/',
  } as CookieOptions,
  refreshToken: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: isProduction ? COOKIE_DURATION.REFRESH_TOKEN_PROD : COOKIE_DURATION.REFRESH_TOKEN_DEV,
    path: '/',
  } as CookieOptions,
};
