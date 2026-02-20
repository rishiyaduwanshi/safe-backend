import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { lookupLicense } from '@/services/license/lookup';
import appResponse from '@/utils/appResponse';
import { AppError } from '@/utils/appError';
import { HttpStatus } from '@/types/common.types';

// Indian Driving License format:
// <2-letter state code> optional[-] <2-digit RTO> optional[-] <4-digit year> <7-digit serial>
// Examples: HR-0619850123456, MH02 20110012345, DL-1420110012345
const DL_REGEX = /^[A-Z]{2}[-\s]?\d{2}[-\s]?\d{4}[-\s]?\d{7}$/i;

const lookupSchema = z.object({
    dlNumber: z
        .string()
        .min(8, 'DL number is too short')
        .max(25, 'DL number is too long')
        .regex(DL_REGEX, 'Invalid DL format. Expected format: HR-0619850123456'),
});

// 2% chance realistic failure messages (same as real government API behaviour)
const FAILURE_MESSAGES = [
    'License record not found in Sarathi Parivahan database. Please verify your DL number.',
    'This license is currently flagged — pending verification by the issuing RTO.',
    'License data temporarily unavailable. Sarathi Parivahan database under maintenance.',
    'Duplicate record detected. Please contact your issuing RTO office.',
    'License suspended by traffic authority. Contact your nearest RTO for details.',
];

export const licenceLookup = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const parsed = lookupSchema.safeParse(req.body);

        if (!parsed.success) {
            return next(
                new AppError({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: parsed.error.issues[0]?.message ?? 'Invalid DL number format',
                })
            );
        }

        const { dlNumber } = parsed.data;

        // Name comes from the authenticated user's JWT — no need to pass it from client
        const userName = req.user?.name;
        if (!userName) {
            return next(new AppError({ statusCode: HttpStatus.UNAUTHORIZED, message: 'User identity could not be resolved.' }));
        }

        // Simulate realistic Sarathi Parivahan API latency (400–900ms)
        await new Promise((resolve) =>
            setTimeout(resolve, Math.floor(Math.random() * 500) + 400)
        );

        // 2% realistic failure rate
        if (Math.random() < 0.02) {
            const msg = FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)]!;
            return next(new AppError({ statusCode: HttpStatus.NOT_FOUND, message: msg }));
        }

        const data = lookupLicense(dlNumber, userName);

        appResponse(res, {
            statusCode: HttpStatus.OK,
            message: 'License data fetched from Sarathi Parivahan database',
            data,
        });
    } catch (error) {
        next(error);
    }
};
