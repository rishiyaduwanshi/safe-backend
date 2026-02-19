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
  .min(6, 'Password must be at least 6 characters')
  .max(100, 'Password must not exceed 100 characters');

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
