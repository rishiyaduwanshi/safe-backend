import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '@/utils/appError';
import appResponse from '@/utils/appResponse';
import { HttpStatus } from '@/types/common.types';
import { ReportModel } from '@/models/report.model';
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

    // Auto-escalate to "review" queue when AI confidence is low
    const status = processed.needsReview ? 'review' : 'pending';

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
    });

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
    }).select('-__v');

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
