import mongoose, { Schema } from 'mongoose';

const CssEventSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      default: null,
    },
    moderator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Moderator',
      default: null,
    },
    decision: {
      type: String,
      enum: ['approved', 'rejected'],
      required: true,
    },
    categoryId: {
      type: Number,
      default: null,
    },
    delta: {
      type: Number,
      required: true,
    },
    previousCss: {
      type: Number,
      required: true,
      min: 0,
      max: 1000,
    },
    nextCss: {
      type: Number,
      required: true,
      min: 0,
      max: 1000,
    },
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

CssEventSchema.index({ user: 1, createdAt: -1 });
CssEventSchema.index({ report: 1 });

export const CssEventModel = mongoose.model('CssEvent', CssEventSchema);
