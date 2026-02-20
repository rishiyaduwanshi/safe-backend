import { z } from 'zod';
import { Permission } from '@/data/permissions';

const permissionsSchema = z
    .array(z.nativeEnum(Permission))
    .min(1, 'At least one permission is required');

export const createModeratorSchema = z.object({
    name: z.string().min(2).max(50).trim(),
    email: z.email().toLowerCase().trim(),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(100)
        .regex(/[A-Z]/, 'Must contain an uppercase letter')
        .regex(/[0-9]/, 'Must contain a number')
        .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    permissions: permissionsSchema,
});

export const updateModeratorPermissionsSchema = z.object({
    permissions: permissionsSchema,
});

export type CreateModeratorInput = z.infer<typeof createModeratorSchema>;
export type UpdateModeratorPermissionsInput = z.infer<typeof updateModeratorPermissionsSchema>;

// ─── Moderator Login ─────────────────────────────────────────────────────────

export const moderatorLoginSchema = z.object({
    email: z.email().toLowerCase().trim(),
    password: z.string().min(1, 'Password is required'),
});

export type ModeratorLoginInput = z.infer<typeof moderatorLoginSchema>;
