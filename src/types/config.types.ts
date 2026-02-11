/**
 * Configuration types for type-safe environment variables
 */

import { Environment } from './common.types';
import { Options as RateLimitOptions } from 'express-rate-limit';

// App Configuration
export interface AppConfig {
  readonly MONGO_URI: string;
  readonly PORT: number;
  readonly NODE_ENV: Environment;
  readonly APP_URL: string;
  readonly APP_NAME: string;
  readonly VERSION: string;
}

// JWT Configuration
export interface JwtConfig {
  readonly JWT_SECRET: string;
  readonly JWT_EXPIRY: string;
  readonly JWT_REFRESH_SECRET: string;
  readonly JWT_REFRESH_EXPIRY: string;
}

// Rate Limit Configuration
export interface RateLimitConfig {
  readonly GLOBAL_RATE_LIMIT_CONFIG: Partial<RateLimitOptions>;
  readonly PER_IP_RATE_LIMIT_CONFIG: Partial<RateLimitOptions>;
}

// Complete Configuration
export interface Config extends AppConfig, JwtConfig, RateLimitConfig {
  readonly ALLOWED_ORIGINS: readonly string[];
}
