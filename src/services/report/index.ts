import type { Severity } from "@/data/category";
import { flatCategory } from '@/data/category';
import { classifyWithAI } from "./classify";
import reportLogger from "./logger";

const REVIEW_THRESHOLD = 0.55;
// Below this, we auto-reject instead of sending to manual review.
const AUTO_REJECT_THRESHOLD = 0.2;

const isInsufficientDetailText = (text: string): boolean => {
  const t = (text ?? '').trim().toLowerCase();
  if (!t) return true;

  // Very short or too few words.
  const words = t.split(/\s+/).filter(Boolean);
  if (t.length < 20 || words.length < 4) return true;

  // Common non-report phrases (extendable)
  if (/^(hi|hello|hey)(\b|\s)/.test(t)) return true;
  if (/(how are you|what's up|whats up|test message|testing)/.test(t)) return true;

  return false;
};

const severityRank: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function resolveSeverity(
  defaultSeverity: Severity,
  aiSeverity: Severity
): Severity {
  return severityRank[aiSeverity] >= severityRank[defaultSeverity]
    ? aiSeverity
    : defaultSeverity;
}

export async function processReport(text: string) {
  try {
    // Quick guard: don't even try to classify obvious non-reports.
    if (isInsufficientDetailText(text)) {
      const category = flatCategory.find((c) => c.key === 'insufficient_detail');
      if (!category) throw new Error('Missing insufficient_detail category');

      return {
        id: category.id,
        key: category.key,
        type: category.type,
        severity: 'low' as Severity,
        confidence: 0,
        needsReview: false,
        autoReject: true,
        comments: [
          {
            authorRole: 'system' as const,
            message:
              'Rejected: insufficient details. Please describe the issue clearly (what happened + where + any useful context).',
          },
        ],
      };
    }

    const aiResult = await classifyWithAI(text);

    const effectiveKey = aiResult.key;

    const category = flatCategory.find((c) => c.key === effectiveKey);

    if (!category) {
      throw new Error("Invalid category returned by AI");
    }

    const finalSeverity = resolveSeverity(
      category.severity,
      aiResult.severity
    );

    const needsReview = aiResult.confidence < REVIEW_THRESHOLD;
    const autoReject =
      aiResult.confidence < AUTO_REJECT_THRESHOLD || effectiveKey === 'insufficient_detail';

    const comments: Array<{
      authorRole: 'ai' | 'system';
      message: string;
    }> = [];

    if (typeof aiResult.comment === 'string' && aiResult.comment.trim()) {
      comments.push({
        authorRole: 'ai',
        message: aiResult.comment.trim(),
      });
    }

    if (autoReject) {
      comments.push({
        authorRole: 'system',
        message:
          effectiveKey === 'insufficient_detail'
            ? 'Rejected: not enough incident details to classify. Please add what happened + where + when.'
            : 'Rejected: the report could not be classified confidently. Please add more details and try again.',
      });
    } else if (needsReview) {
      comments.push({
        authorRole: 'system',
        message: 'Needs review: low confidence classification. Please review and adjust category if needed.',
      });
    }

    reportLogger.info(
      `AI raw → key: ${aiResult.key}, severity: ${aiResult.severity}, confidence: ${aiResult.confidence}`
    );

    reportLogger.info(
      `Final decision → id: ${category.id}, severity: ${finalSeverity}, review: ${needsReview}`
    );

    return {
      id: category.id,
      key: category.key,
      type: category.type,
      severity: finalSeverity,
      confidence: aiResult.confidence,
      needsReview,
      autoReject,
      comments,
    };
  } catch (error: any) {
    reportLogger.error(`Processing failed: ${error.message}`);
    throw error;
  }
}
