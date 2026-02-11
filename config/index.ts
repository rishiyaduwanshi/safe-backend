import { AppError } from '@/utils/appError';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Config } from '@/types/config.types';
import { HttpStatus } from '@/types/common.types';
import { Options as RateLimitOptions } from 'express-rate-limit';
import { validateEnv } from '@/validators';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
const packageJsonPath = join(__dirname, '../package.json');
const packageJsonData = readFileSync(packageJsonPath, 'utf-8');
const packageJson = JSON.parse(packageJsonData) as { version: string };

// Validate environment variables
const env = validateEnv();

// Rate limit handler factory
function createRateLimitHandler(message: string): RateLimitOptions['handler'] {
  return (_req, _res, _next, _options) => {
    throw new AppError({
      message,
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
    });
  };
}

// ====== Configuration Object ======
export const config: Readonly<Config> = Object.freeze({
  // App Config
  MONGO_URI: env.MONGO_URI,
  PORT: env.PORT,
  NODE_ENV: env.NODE_ENV,
  APP_URL: env.APP_URL || `http://localhost:${env.PORT}`,
  APP_NAME: env.APP_NAME,
  VERSION: packageJson.version,

  // JWT Config
  JWT_SECRET: env.JWT_SECRET,
  JWT_EXPIRY: env.JWT_EXPIRY,
  JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRY: env.JWT_REFRESH_EXPIRY,

  // CORS Config
  ALLOWED_ORIGINS: Object.freeze(env.ALLOWED_ORIGINS),

  // Rate Limiting Config
  GLOBAL_RATE_LIMIT_CONFIG: Object.freeze({
    windowMs: 60 * 1000, // 1 minute
    max: env.GLOBAL_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: () => 'global',
    handler: createRateLimitHandler('Too many requests, please try again later.'),
  } as const),

  PER_IP_RATE_LIMIT_CONFIG: Object.freeze({
    windowMs: 60 * 1000, // 1 minute
    max: env.PER_IP_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler('Too many requests from this IP, please try again later.'),
  } as const),
});
