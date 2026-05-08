import { Request, Response, NextFunction } from 'express';
import { BadRequestError, UnauthorizedError } from '@/utils/appError';
import appResponse from '@/utils/appResponse';
import UserModel, { IUser } from '@/models/user.model';
import setTokenCookies from '@/utils/setTokenCookies';
import { cookieOptions } from '@config/cookie';
import jwt, { JsonWebTokenError, SignOptions } from 'jsonwebtoken';
import { config } from '@config/index';
import mongoose from 'mongoose';
import { RegisterInput, LoginInput } from '@/validations';
import { HttpStatus, TokenPair, JwtPayload as CustomJwtPayload, UserRole } from '@/types/common.types';

// Response data interfaces
interface UserResponseData {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AuthResponseData {
  user: UserResponseData;
}

// Utility: Convert User document to safe response object
const toUserResponse = (user: IUser): UserResponseData => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive !== false,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// Generate JWT tokens
const generateTokens = (user: IUser): TokenPair => {
  const payload: CustomJwtPayload = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
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

// Register
export const register = async (
  req: Request<unknown, unknown, RegisterInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validation already done by Zod middleware
    const { email, password, name } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestError('User with this email already exists');
    }

    const user = await UserModel.create({ email, password, name });
    const tokens = generateTokens(user);
    await UserModel.updateRefreshToken(user._id, tokens.refreshToken);

    const userResponse = toUserResponse(user);
    setTokenCookies(res, tokens, userResponse);

    appResponse<AuthResponseData>(res, {
      statusCode: HttpStatus.CREATED,
      message: 'User registered successfully',
      data: { user: userResponse },
    });
  } catch (error) {
    next(error);
  }
};

// Login
export const login = async (
  req: Request<unknown, unknown, LoginInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validation already done by Zod middleware
    const { email, password } = req.body;

    // Need to explicitly select password since it's excluded by default
    const user = await UserModel.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const tokens = generateTokens(user);
    await UserModel.updateRefreshToken(user._id, tokens.refreshToken);

    const userResponse = toUserResponse(user);
    setTokenCookies(res, tokens, userResponse);

    appResponse<AuthResponseData>(res, {
      message: 'Signin successful',
      data: { user: userResponse },
    });
  } catch (error) {
    next(error);
  }
};

// Refresh Token
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.cookies as { refreshToken?: string };

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token not found in cookie');
    }

    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as CustomJwtPayload;

    const user = await UserModel.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const tokens = generateTokens(user);
    await UserModel.updateRefreshToken(user._id, tokens.refreshToken);

    setTokenCookies(res, tokens);

    appResponse(res, {
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      next(new UnauthorizedError('Invalid refresh token'));
    } else {
      next(error);
    }
  }
};

export const me = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.user!;
    const user = await UserModel.findById(id);
    if (!user) {
      throw new UnauthorizedError('Invalid user');
    }

    appResponse<AuthResponseData>(res, {
      message: 'User fetched successfully',
      data: { user: toUserResponse(user) },
    });
  } catch (error) {
    next(error);
  }
};

// Logout
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (userId) {
      await UserModel.updateRefreshToken(
        new mongoose.Types.ObjectId(userId),
        null
      );
    }

    // Must pass matching path/secure/sameSite so the browser removes the correct cookie
    const { maxAge: _a, httpOnly: _b, ...clearOpts } = cookieOptions.accessToken;
    const { maxAge: _c, httpOnly: _d, ...clearRefreshOpts } = cookieOptions.refreshToken;
    const { maxAge: _e, ...clearUserInfoOpts } = cookieOptions.userInfo;
    res.clearCookie('accessToken', clearOpts);
    res.clearCookie('refreshToken', clearRefreshOpts);
    res.clearCookie('userInfo', clearUserInfoOpts);

    appResponse(res, {
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};
