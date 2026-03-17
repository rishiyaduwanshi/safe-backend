import { Request, Response, NextFunction } from 'express';
import { ReportModel } from '@/models/report.model';
import UserModel from '@/models/user.model';
import appResponse from '@/utils/appResponse';
import { NotFoundError } from '@/utils/appError';
import { buildModerationCssUpdatePipeline } from '@/services/css';

// Allowed filters
type ReportStatus = 'pending' | 'review' | 'approved' | 'rejected';
type ReportSeverity = 'low' | 'medium' | 'high' | 'critical';

const ALLOWED_STATUSES: readonly ReportStatus[] = ['pending', 'review', 'approved', 'rejected'];
const ALLOWED_SEVERITIES: readonly ReportSeverity[] = ['low', 'medium', 'high', 'critical'];

// ─── List Reports ────────────────────────────────────────────────────────────
// GET /api/v1/moderator/reports?status=review&needsReview=true&page=1&limit=20

export const listReports = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const {
            status,
            needsReview,
            severity,
            page = '1',
            limit = '20',
        } = req.query as Record<string, string>;

        // Build filter
        const filter: Record<string, unknown> = {};

        if (status && ALLOWED_STATUSES.includes(status as ReportStatus)) {
            filter['status'] = status;
        }

        if (needsReview === 'true' || needsReview === 'false') {
            filter['needsReview'] = needsReview === 'true';
        }

        if (severity && ALLOWED_SEVERITIES.includes(severity as ReportSeverity)) {
            filter['severity'] = severity;
        }

        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;

        const [reports, total] = await Promise.all([
            ReportModel.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .select('-__v')
                .populate('submittedBy', 'name email'),
            ReportModel.countDocuments(filter),
        ]);

        appResponse(res, {
            message: 'Reports fetched successfully',
            data: {
                reports,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── Get Single Report ───────────────────────────────────────────────────────
// GET /api/v1/moderator/reports/:id

export const getReport = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const report = await ReportModel.findById(req.params.id)
            .select('-__v')
            .populate('submittedBy', 'name email');

        if (!report) throw new NotFoundError('Report not found');

        appResponse(res, {
            message: 'Report fetched successfully',
            data: { report },
        });
    } catch (error) {
        next(error);
    }
};

// ─── Approve Report ──────────────────────────────────────────────────────────
// PATCH /api/v1/moderator/reports/:id/approve

export const approveReport = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const report = await ReportModel.findById(req.params.id);
        if (!report) throw new NotFoundError('Report not found');

        // Guard: only act on reports not yet decided
        if (report.status === 'approved' || report.status === 'rejected') {
            appResponse(res, { message: 'Report already reviewed', data: { report } });
            return;
        }

        report.status = 'approved' as ReportStatus;
        report.needsReview = false;
        await report.save();

        await UserModel.findByIdAndUpdate(
            report.submittedBy,
            buildModerationCssUpdatePipeline(report.category?.id, 'approved')
        );

        appResponse(res, {
            message: 'Report approved',
            data: { report },
        });
    } catch (error) {
        next(error);
    }
};

// ─── Reject Report ───────────────────────────────────────────────────────────
// PATCH /api/v1/moderator/reports/:id/reject

export const rejectReport = async (
    req: Request<{ id: string }, unknown, { reason?: string }>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const report = await ReportModel.findById(req.params.id);
        if (!report) throw new NotFoundError('Report not found');

        // Guard: only act on reports not yet decided
        if (report.status === 'approved' || report.status === 'rejected') {
            appResponse(res, { message: 'Report already reviewed', data: { report } });
            return;
        }

        report.status = 'rejected' as ReportStatus;
        report.needsReview = false;
        await report.save();

        await UserModel.findByIdAndUpdate(
            report.submittedBy,
            buildModerationCssUpdatePipeline(report.category?.id, 'rejected')
        );

        appResponse(res, {
            message: 'Report rejected',
            data: { report },
        });
    } catch (error) {
        next(error);
    }
};

// ─── Stats ───────────────────────────────────────────────────────────────────
// GET /api/v1/moderator/stats

export const getModeratorStats = async (
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const [pending, review, approved, rejected, total] = await Promise.all([
            ReportModel.countDocuments({ status: 'pending' }),
            ReportModel.countDocuments({ status: 'review' }),
            ReportModel.countDocuments({ status: 'approved' }),
            ReportModel.countDocuments({ status: 'rejected' }),
            ReportModel.countDocuments({}),
        ]);

        appResponse(res, {
            message: 'Stats fetched',
            data: { stats: { pending, review, approved, rejected, total } },
        });
    } catch (error) {
        next(error);
    }
};
