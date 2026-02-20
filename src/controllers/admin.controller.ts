import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import ModeratorModel from '@/models/moderator.model';
import appResponse from '@/utils/appResponse';
import { BadRequestError, NotFoundError } from '@/utils/appError';
import { HttpStatus } from '@/types/common.types';
import { CreateModeratorInput, UpdateModeratorPermissionsInput } from '@/validations/validate.admin';

// ─── Create Moderator ────────────────────────────────────────────────────────

export const createModerator = async (
  req: Request<unknown, unknown, CreateModeratorInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, permissions } = req.body;

    const existing = await ModeratorModel.findOne({ email });
    if (existing) {
      throw new BadRequestError('A moderator with this email already exists');
    }

    const moderator = await ModeratorModel.create({
      name,
      email,
      password,       // pre-save hook hashes it
      permissions,
      createdBy: new mongoose.Types.ObjectId(req.user!.id),
    });

    appResponse(res, {
      statusCode: HttpStatus.CREATED,
      message: 'Moderator created successfully',
      data: {
        id: moderator._id,
        name: moderator.name,
        email: moderator.email,
        permissions: moderator.permissions,
        isActive: moderator.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── List All Moderators ─────────────────────────────────────────────────────

export const listModerators = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const moderators = await ModeratorModel.find()
      .select('-__v')
      .populate('createdBy', 'name email');

    appResponse(res, {
      message: 'Moderators fetched successfully',
      data: moderators,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Single Moderator ────────────────────────────────────────────────────

export const getModerator = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const moderator = await ModeratorModel.findById(req.params.id)
      .select('-__v')
      .populate('createdBy', 'name email');

    if (!moderator) throw new NotFoundError('Moderator not found');

    appResponse(res, {
      message: 'Moderator fetched successfully',
      data: moderator,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Permissions ───────────────────────────────────────────────────────

export const updateModeratorPermissions = async (
  req: Request<{ id: string }, unknown, UpdateModeratorPermissionsInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const moderator = await ModeratorModel.findByIdAndUpdate(
      req.params.id,
      { permissions: req.body.permissions },
      { new: true }
    );

    if (!moderator) throw new NotFoundError('Moderator not found');

    appResponse(res, {
      message: 'Permissions updated successfully',
      data: {
        id: moderator._id,
        permissions: moderator.permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Toggle Active Status ─────────────────────────────────────────────────────

export const toggleModeratorStatus = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const moderator = await ModeratorModel.findById(req.params.id);
    if (!moderator) throw new NotFoundError('Moderator not found');

    moderator.isActive = !moderator.isActive;
    await moderator.save();

    appResponse(res, {
      message: `Moderator ${moderator.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { id: moderator._id, isActive: moderator.isActive },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Moderator ─────────────────────────────────────────────────────────

export const deleteModerator = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const moderator = await ModeratorModel.findByIdAndDelete(req.params.id);
    if (!moderator) throw new NotFoundError('Moderator not found');

    appResponse(res, {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Moderator deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
