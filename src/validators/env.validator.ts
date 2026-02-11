import { z } from 'zod';
import { Environment } from '@/types/common.types';

/**
 * Environment Variables Validation Schema
 * This ensures all required env vars are present and valid at startup
 */
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum([Environment.DEVELOPMENT, Environment.PRODUCTION, Environment.TEST])
    .default(Environment.PRODUCTION),
  PORT: z.string()
    .regex(/^\d+$/, 'PORT must be a valid number')
    .default('4040')
    .transform(Number),
  APP_NAME: z.string().min(1).default('boiler'),
  APP_URL: z.string().url().optional(),
  
  // Database
  MONGO_URI: z.string()
    .min(1, 'MONGO_URI is required')
    .default('mongodb://localhost:27017/boiler'),
  
  // JWT Configuration
  JWT_SECRET: z.string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security')
    .default('your-super-secret-jwt-key-change-in-production-must-be-32-chars-min'),
  JWT_EXPIRY: z.string()
    .regex(/^\d+[smhd]$/, 'JWT_EXPIRY must be in format like 15m, 1h, 7d')
    .default('1d'),
  JWT_REFRESH_SECRET: z.string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters for security')
    .default('your-super-secret-refresh-key-change-in-production-must-be-32-chars'),
  JWT_REFRESH_EXPIRY: z.string()
    .regex(/^\d+[smhd]$/, 'JWT_REFRESH_EXPIRY must be in format like 15m, 1h, 7d')
    .default('7d'),
  
  // CORS
  ALLOWED_ORIGINS: z.string()
    .default('http://localhost:5173,http://localhost:3000')
    .transform(val => val.split(',').map(origin => origin.trim())),
  
  // Rate Limiting
  GLOBAL_RATE_LIMIT_MAX: z.string()
    .regex(/^\d+$/, 'GLOBAL_RATE_LIMIT_MAX must be a number')
    .default('100')
    .transform(Number),
  PER_IP_RATE_LIMIT_MAX: z.string()
    .regex(/^\d+$/, 'PER_IP_RATE_LIMIT_MAX must be a number')
    .default('10')
    .transform(Number),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates and parses environment variables
 * Throws detailed error if validation fails
 */
export function validateEnv(): EnvConfig {
  try {
    const parsed = envSchema.parse(process.env);
    
    // Success message
    console.log('✅ Environment variables validated successfully');
    
    // Warn if using default values in production
    if (parsed.NODE_ENV === Environment.PRODUCTION) {
      if (parsed.JWT_SECRET.includes('change-in-production')) {
        console.warn('⚠️  WARNING: Using default JWT_SECRET in production! Please set a secure secret.');
      }
      if (parsed.JWT_REFRESH_SECRET.includes('change-in-production')) {
        console.warn('⚠️  WARNING: Using default JWT_REFRESH_SECRET in production! Please set a secure secret.');
      }
    }
    
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:\n');
      
      error.issues.forEach((err) => {
        const path = err.path.join('.');
        console.error(`  • ${path}: ${err.message}`);
      });
      
      console.error('\n💡 Please check your environment variables and try again.\n');
      process.exit(1);
    }
    throw error;
  }
}
