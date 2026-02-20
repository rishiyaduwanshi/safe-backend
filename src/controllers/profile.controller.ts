import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Profile from '@/models/profile.model';
import User from '@/models/user.model';
import { AppError } from '@/utils/appError';
import appResponse from '@/utils/appResponse';
import { HttpStatus } from '@/types/common.types';

// ─── Validation ──────────────────────────────────────────────────────────────
// Mirrors the LicenseData shape returned by the license lookup service.
// When the real Sarathi API is wired in, the shape stays the same — only
// the lookup service changes.

const profileSaveSchema = z.object({
    name: z.string().min(1).transform((value : string) => {
        value
            .trim()
            .toLowerCase()
            .split(" ")
            .filter(Boolean)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }),
    licenseNumber: z.string().min(1),
    driverId: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email(),
    address: z.string().min(1),
    vehicleType: z.string().min(1),
    emergencyContact: z.object({ name: z.string(), phone: z.string() }),
    issueDate: z.string().min(1),
    expiryDate: z.string().min(1),
    status: z.enum(['Valid', 'Expired', 'Suspended']),
    state: z.string().min(1),
    city: z.string().min(1),
    pincode: z.string().min(1),
});

// ─── Save / Update Profile ───────────────────────────────────────────────────
// Called after the user confirms the license lookup preview.
// Uses upsert so re-fetching with a corrected DL stays clean.

export const saveProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(new AppError({ statusCode: HttpStatus.UNAUTHORIZED, message: 'Not authenticated.' }));
        }

        const parsed = profileSaveSchema.safeParse(req.body);
        if (!parsed.success) {
            return next(new AppError({
                statusCode: HttpStatus.BAD_REQUEST,
                message: parsed.error.issues[0]?.message ?? 'Invalid profile data',
            }));
        }

        // Upsert — if user re-fetches their DL they get updated data
        const profile = await Profile.findOneAndUpdate(
            { userId },
            { ...parsed.data, userId },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Link profile to user if not already linked
        await User.findByIdAndUpdate(userId, { profileId: profile._id });

        appResponse(res, {
            statusCode: HttpStatus.OK,
            message: 'Profile saved successfully',
            data: { profile },
        });
    } catch (error) {
        next(error);
    }
};

// ─── Get My Profile ──────────────────────────────────────────────────────────

export const getMyProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(new AppError({ statusCode: HttpStatus.UNAUTHORIZED, message: 'Not authenticated.' }));
        }

        const profile = await Profile.findOne({ userId });

        appResponse(res, {
            statusCode: HttpStatus.OK,
            message: profile ? 'Profile fetched' : 'No profile set up yet',
            data: { profile }, // null if not set up yet — frontend handles this
        });
    } catch (error) {
        next(error);
    }
};
