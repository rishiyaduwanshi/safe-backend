import mongoose, { Schema } from 'mongoose';

export type CommentAuthorRole = 'ai' | 'system' | 'moderator' | 'admin';

const CommentSchema = new Schema(
  {
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
      index: true,
    },

    authorRole: {
      type: String,
      enum: ['ai', 'system', 'moderator', 'admin'],
      required: true,
    },

    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

export const CommentModel = mongoose.model('Comment', CommentSchema);