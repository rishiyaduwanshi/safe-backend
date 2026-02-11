import { Request, Response, NextFunction } from 'express';
import { BadRequestError, UnauthorizedError } from '@/utils/appError';
import appResponse from '@/utils/appResponse';
import UserModel, { IUser } from '@/models/user.model';
import setTokenCookies from '@/utils/setTokenCookies';
import jwt, { JsonWebTokenError, SignOptions } from 'jsonwebtoken';
import { config } from '@config/index';
import mongoose from 'mongoose';
import { HttpStatus, TokenPair, JwtPayload as CustomJwtPayload } from '@/types/common.types';
import { RegisterInput, LoginInput } from '@/validators';

// Response data interfaces
interface UserResponseData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthResponseData {
  user: UserResponseData;
  token: string;
}

// Utility: Convert User document to safe response object
const toUserResponse = (user: IUser): UserResponseData => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// Generate JWT tokens
const generateTokens = (userId: mongoose.Types.ObjectId): TokenPair => {
  const payload: CustomJwtPayload = { id: userId.toString() };
  
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

    // Use email as default name if name is not provided
    const userName = name || email.split('@')[0];

    const user = await UserModel.create({ email, password, name: userName });
    const tokens = generateTokens(user._id);
    await UserModel.updateRefreshToken(user._id, tokens.refreshToken);

    const userResponse = toUserResponse(user);
    setTokenCookies(res, tokens);

    appResponse<AuthResponseData>(res, {
      statusCode: HttpStatus.CREATED,
      message: 'User registered successfully',
      data: { user: userResponse, token: tokens.accessToken },
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

    const tokens = generateTokens(user._id);
    await UserModel.updateRefreshToken(user._id, tokens.refreshToken);

    const userResponse = toUserResponse(user);
    setTokenCookies(res, tokens);

    appResponse<AuthResponseData>(res, {
      message: 'Login successful',
      data: { user: userResponse, token: tokens.accessToken },
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

    const tokens = generateTokens(user._id);
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

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    appResponse(res, {
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};
