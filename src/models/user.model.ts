import mongoose, { Document, Model, Schema, CallbackError } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/types/common.types';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  refreshToken: string | null;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

interface IUserModel extends Model<IUser> {
  updateRefreshToken(
    userId: mongoose.Types.ObjectId, 
    refreshToken: string | null
  ): Promise<IUser | null>;
}

const userSchema = new Schema<IUser, IUserModel>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't return password in queries by default
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    refreshToken: {
      type: String,
      default: null,
      select: false, // Don't return refresh token in queries by default
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as CallbackError);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update refresh token static method
userSchema.statics.updateRefreshToken = async function (
  userId: mongoose.Types.ObjectId,
  refreshToken: string | null
): Promise<IUser | null> {
  return this.findByIdAndUpdate(
    userId, 
    { refreshToken }, 
    { new: true }
  ).select('+refreshToken');
};

const UserModel = mongoose.model<IUser, IUserModel>('User', userSchema);

export default UserModel;
