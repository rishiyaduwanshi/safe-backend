import { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, SignOptions } from 'jsonwebtoken';
import { config } from '@config/index';
import { cookieOptions } from '@config/cookie';
import { CookieOptions } from 'express';
import ModeratorModel from '@/models/moderator.model';
import appResponse from '@/utils/appResponse';
import { UnauthorizedError } from '@/utils/appError';
import { ModeratorJwtPayload, TokenPair } from '@/types/common.types';
import { Permission } from '@/data/permissions';
import { ModeratorLoginInput } from '@/validations/validate.admin';

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface ModeratorInfo {
    id: string;
    name: string;
    email: string;
    permissions: Permission[];
    isActive: boolean;
}

const generateModeratorTokens = (mod: ModeratorInfo): TokenPair => {
    const payload: ModeratorJwtPayload = {
        id: mod.id,
        name: mod.name,
        email: mod.email,
        permissions: mod.permissions,
        actorType: 'moderator',
    };

    const accessToken = jwt.sign(
        payload,
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRY } as SignOptions
    );

    const refreshToken = jwt.sign(
        payload,
        config.JWT_REFRESH_SECRET,
        { expiresIn: config.JWT_REFRESH_EXPIRY } as SignOptions
    );

    return { accessToken, refreshToken };
};

/** Sets moderator-specific cookies (separate from user cookies) */
const setModeratorCookies = (res: Response, tokens: TokenPair, mod?: ModeratorInfo): void => {
    res.cookie('moderatorAccessToken', tokens.accessToken, cookieOptions.accessToken);
    res.cookie('moderatorRefreshToken', tokens.refreshToken, cookieOptions.refreshToken);
    if (mod) {
        res.cookie('moderatorInfo', JSON.stringify({
            id: mod.id,
            name: mod.name,
            email: mod.email,
            permissions: mod.permissions,
            isActive: mod.isActive,
        }), cookieOptions.userInfo as CookieOptions);
    }
};

// ─── Sign In ─────────────────────────────────────────────────────────────────

export const modSignin = async (
    req: Request<unknown, unknown, ModeratorLoginInput>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { email, password } = req.body;

        const moderator = await ModeratorModel.findOne({ email }).select('+password');
        if (!moderator || !(await moderator.comparePassword(password))) {
            throw new UnauthorizedError('Invalid credentials');
        }

        if (!moderator.isActive) {
            throw new UnauthorizedError('Your account has been deactivated. Contact the admin.');
        }

        const modInfo: ModeratorInfo = {
            id: moderator._id.toString(),
            name: moderator.name,
            email: moderator.email,
            permissions: moderator.permissions,
            isActive: moderator.isActive,
        };

        const tokens = generateModeratorTokens(modInfo);
        await ModeratorModel.updateRefreshToken(moderator._id, tokens.refreshToken);
        setModeratorCookies(res, tokens, modInfo);

        appResponse(res, {
            message: 'Signed in successfully',
            data: { moderator: modInfo },
        });
    } catch (error) {
        next(error);
    }
};

// ─── Me ─────────────────────────────────────────────────────────────────────

export const modMe = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id, name, email, permissions } = req.moderator!;

        appResponse(res, {
            message: 'Moderator fetched successfully',
            data: { moderator: { id, name, email, permissions } },
        });
    } catch (error) {
        next(error);
    }
};

// ─── Refresh Token ───────────────────────────────────────────────────────────

export const modRefresh = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { moderatorRefreshToken } = req.cookies as { moderatorRefreshToken?: string };

        if (!moderatorRefreshToken) {
            throw new UnauthorizedError('Refresh token not found');
        }

        const decoded = jwt.verify(
            moderatorRefreshToken,
            config.JWT_REFRESH_SECRET
        ) as ModeratorJwtPayload;

        if (decoded.actorType !== 'moderator') {
            throw new UnauthorizedError('Invalid token type');
        }

        const moderator = await ModeratorModel.findById(decoded.id);
        if (!moderator || moderator.refreshToken !== moderatorRefreshToken) {
            throw new UnauthorizedError('Invalid refresh token');
        }

        if (!moderator.isActive) {
            throw new UnauthorizedError('Account deactivated');
        }

        const modInfo: ModeratorInfo = {
            id: moderator._id.toString(),
            name: moderator.name,
            email: moderator.email,
            permissions: moderator.permissions,
            isActive: moderator.isActive,
        };

        const tokens = generateModeratorTokens(modInfo);
        await ModeratorModel.updateRefreshToken(moderator._id, tokens.refreshToken);
        setModeratorCookies(res, tokens, modInfo);

        appResponse(res, { message: 'Token refreshed successfully' });
    } catch (error) {
        if (error instanceof JsonWebTokenError) {
            next(new UnauthorizedError('Invalid refresh token'));
        } else {
            next(error);
        }
    }
};

// ─── Sign Out ────────────────────────────────────────────────────────────────

export const modSignout = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const modId = req.moderator?.id;

        if (modId) {
            const mod = await ModeratorModel.findById(modId);
            if (mod) await ModeratorModel.updateRefreshToken(mod._id, null);
        }

        const { maxAge: _a, httpOnly: _b, ...clearOpts } = cookieOptions.accessToken;
        const { maxAge: _c, httpOnly: _d, ...clearRefreshOpts } = cookieOptions.refreshToken;
        const { maxAge: _e, ...clearInfoOpts } = cookieOptions.userInfo;

        res.clearCookie('moderatorAccessToken', clearOpts);
        res.clearCookie('moderatorRefreshToken', clearRefreshOpts);
        res.clearCookie('moderatorInfo', clearInfoOpts);

        appResponse(res, { message: 'Signed out successfully' });
    } catch (error) {
        next(error);
    }
};
