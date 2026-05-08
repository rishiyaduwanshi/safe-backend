import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { NotFoundError } from '@/utils/appError';
import appResponse from '@/utils/appResponse';
import { HttpStatus } from '@/types/common.types';
import { ReportModel } from '@/models/report.model';
import { CommentModel } from '@/models/comment.model';
import UserModel from '@/models/user.model';
import { processReport } from '@/services/report';
import { ReportRequest } from '@/validations';

// ─── Submit a new report ────────────────────────────────────────────────────

export const submitReport = async (
  req: Request<unknown, unknown, ReportRequest>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reportText, location } = req.body;
    const userId = req.user?.id ?? null;

    // Run AI classification + severity resolution
    const processed = await processReport(reportText);

    // Auto-reject when confidence is extremely low / insufficient detail.
    // Else auto-escalate to "review" when confidence is low.
    const status = processed.autoReject
      ? 'rejected'
      : processed.needsReview
        ? 'review'
        : 'pending';

    const report = await ReportModel.create({
      submittedBy: userId,
      reportText,
      category: {
        id: processed.id,
        key: processed.key,
        type: processed.type,
      },
      severity: processed.severity,
      confidence: processed.confidence,
      needsReview: processed.needsReview,
      location,
      status,
      rejectionReason: processed.autoReject
        ? (
          processed.comments?.find((c) => c.authorRole === 'system')?.message ??
          processed.comments?.[0]?.message ??
          (processed.key === 'insufficient_detail'
            ? 'Rejected: insufficient detail'
            : 'Rejected: low confidence')
        )
        : undefined,
    });

    const comments = Array.isArray((processed as any).comments)
      ? ((processed as any).comments as Array<{ authorRole: string; message: string }>).
        filter((c) => c && typeof c.message === 'string' && c.message.trim())
      : [];

    if (comments.length > 0) {
      await CommentModel.insertMany(
        comments.map((c) => ({
          report: report._id,
          authorRole: c.authorRole,
          message: c.message,
        }))
      );
    } else if ((processed as any).comment) {
      // Backward-compat fallback
      await CommentModel.create({
        report: report._id,
        authorRole: (processed as any).commentRole ?? (processed.autoReject ? 'system' : 'ai'),
        message: (processed as any).comment,
      });
    }

    appResponse(res, {
      statusCode: HttpStatus.CREATED,
      message: 'Report submitted successfully',
      data: { report },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get all reports submitted by the logged-in user ────────────────────────

export const getMyReports = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const reports = await ReportModel.find({ submittedBy: userId })
      .sort({ createdAt: -1 })
      .select('-__v');

    appResponse(res, {
      message: 'Reports fetched successfully',
      data: { reports },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get a single report by ID (must belong to the logged-in user) ───────────

export const getReportById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const report = await ReportModel.findOne({
      _id: id,
      submittedBy: userId,
    })
      .select('-__v')
      .populate('publicComments');

    if (!report) {
      throw new NotFoundError('Report not found');
    }

    appResponse(res, {
      message: 'Report fetched successfully',
      data: { report },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get report stats + stored CSS for the logged-in user ───────────────────
//
// CSS is stored on the User document and updated by the moderator on
// approve / reject — it is NEVER recomputed here.

export const getMyStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const now = new Date();

    // Read stored CSS directly from the User document
    const user = await UserModel.findById(userId).select('css cssInitialized');
    const css = user?.css ?? 0;
    const hasCssHistory = Boolean(user?.cssInitialized || css > 0);

    // Status counts + month deltas — all in one aggregation
    const [counts, monthly] = await Promise.all([
      ReportModel.aggregate<{ _id: string; count: number }>([
        { $match: { submittedBy: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      // Last 6 months report counts
      ReportModel.aggregate<{ month: number; year: number; count: number }>([
        {
          $match: {
            submittedBy: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
          },
        },
        {
          $group: {
            _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $project: { month: '$_id.month', year: '$_id.year', count: 1, _id: 0 } },
      ]),
    ]);

    // Build counts map
    const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));
    const total = Object.values(countMap).reduce((a, b) => a + b, 0);

    // Build 6-month breakdown with zero-fill
    const monthlyBreakdown = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const m = d.getMonth() + 1; // MongoDB $month is 1-based
      const y = d.getFullYear();
      const found = monthly.find((r) => r.month === m && r.year === y);
      return {
        month: d.toLocaleString('default', { month: 'short' }),
        count: found?.count ?? 0,
      };
    });

    const thisMonthCount = monthlyBreakdown.at(-1)?.count ?? 0;
    const lastMonthCount = monthlyBreakdown.at(-2)?.count ?? 0;

    appResponse(res, {
      message: 'Stats fetched successfully',
      data: {
        css,
        hasCssHistory,
        maxCss: 1000,
        improvementFromLastMonth: thisMonthCount - lastMonthCount,
        counts: {
          total,
          approved: countMap['approved'] ?? 0,
          rejected: countMap['rejected'] ?? 0,
          pending: (countMap['pending'] ?? 0) + (countMap['review'] ?? 0),
        },
        monthlyBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};
