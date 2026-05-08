import mongoose, { Schema } from 'mongoose';

const PushSubscriptionSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: {
      type: String,
      default: '',
      trim: true,
      maxlength: 400,
    },
    lastSeenAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

PushSubscriptionSchema.index({ user: 1, createdAt: -1 });

export const PushSubscriptionModel = mongoose.model('PushSubscription', PushSubscriptionSchema);
