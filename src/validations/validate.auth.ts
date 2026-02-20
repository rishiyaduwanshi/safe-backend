import { z } from 'zod';

/**
 * Auth Request Body Validation Schemas
 */

// Email validation
const emailSchema = z.string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must not exceed 255 characters')
  .toLowerCase()
  .trim();

// Password validation
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must not exceed 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Name validation
const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must not exceed 50 characters')
  .trim()
  .optional();

// Register Schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

// Login Schema
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Refresh Token Schema (from cookies)
export const refreshTokenSchema = z.object({
  refreshToken: z.string()
    .min(1, 'Refresh token is required'),
});

// Export types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
