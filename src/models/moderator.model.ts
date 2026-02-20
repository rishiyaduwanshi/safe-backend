import mongoose, { Document, Model, Schema, CallbackError } from 'mongoose';
import bcrypt from 'bcryptjs';
import { Permission } from '@/data/permissions';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IModerator extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    permissions: Permission[];
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId; // Admin who created this moderator
    refreshToken: string | null;
    comparePassword(candidatePassword: string): Promise<boolean>;
    hasPermission(permission: Permission): boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface IModeratorModel extends Model<IModerator> {
    updateRefreshToken(
        moderatorId: mongoose.Types.ObjectId,
        refreshToken: string | null
    ): Promise<IModerator | null>;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const moderatorSchema = new Schema<IModerator, IModeratorModel>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
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
            minlength: [8, 'Password must be at least 8 characters'],
            select: false,
        },
        permissions: {
            type: [String],
            enum: Object.values(Permission),
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User', // Admin user who created this moderator
            required: true,
        },
        refreshToken: {
            type: String,
            default: null,
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

// ─── Hooks ───────────────────────────────────────────────────────────────────

moderatorSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error as CallbackError);
    }
});

// ─── Methods ─────────────────────────────────────────────────────────────────

moderatorSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

/** Check if this moderator has a specific permission */
moderatorSchema.methods.hasPermission = function (
    permission: Permission
): boolean {
    return (this.permissions as Permission[]).includes(permission);
};

// ─── Statics ─────────────────────────────────────────────────────────────────

moderatorSchema.statics.updateRefreshToken = async function (
    moderatorId: mongoose.Types.ObjectId,
    refreshToken: string | null
): Promise<IModerator | null> {
    return this.findByIdAndUpdate(
        moderatorId,
        { refreshToken },
        { new: true }
    ).select('+refreshToken');
};

// ─── Model ───────────────────────────────────────────────────────────────────

const ModeratorModel = mongoose.model<IModerator, IModeratorModel>(
    'Moderator',
    moderatorSchema
);

export default ModeratorModel;
