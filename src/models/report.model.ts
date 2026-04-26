import mongoose, { Schema } from "mongoose";

const ReportSchema = new Schema(
  {
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    reportText: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },

    category: {
      id: {
        type: Number,
        required: true,
      },
      key: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ["hazard", "violation"],
        required: true,
      },
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },

    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },

    needsReview: {
      type: Boolean,
      default: false,
    },

    location: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
      address: { type: String },
    },

    status: {
      type: String,
      enum: ["pending", "review", "approved", "rejected"],
      default: "pending",
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    clarificationAttempted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ReportSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'report',
  options: { sort: { createdAt: 1 } },
});

// User-visible comments only (no internal AI telemetry)
ReportSchema.virtual('publicComments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'report',
  match: { authorRole: { $in: ['system', 'moderator'] } },
  options: { sort: { createdAt: 1 } },
});

export const ReportModel = mongoose.model("Report", ReportSchema);
