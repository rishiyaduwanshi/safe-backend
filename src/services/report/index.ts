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

const isLikelyVagueReport = (text: string): boolean => {
  const t = (text ?? '').trim().toLowerCase();
  if (!t) return true;

  // If it doesn't mention any concrete incident markers, treat as vague.
  // (Bias towards rejecting vague reports during development.)
  const incidentTokens = [
    'pothole',
    'gadda',
    'crack',
    'broken',
    'water',
    'logging',
    'manhole',
    'streetlight',
    'signal',
    'helmet',
    'speed',
    'drunk',
    'parking',
    'wrong side',
    'accident',
    'hit',
    'injury',
  ];

  const hasIncidentToken = incidentTokens.some((token) => t.includes(token));
  if (hasIncidentToken) return false;

  // If it looks like a generic complaint without specifics.
  if (/(problem|issue|help|bad|not good|something wrong|unsafe|danger)/.test(t)) {
    return true;
  }

  // If it has no incident token and is not long, assume vague.
  return t.length < 80;
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
        commentRole: 'system' as const,
        comment: 'Rejected: insufficient details. Please describe the issue clearly (what happened + where + any useful context).',
      };
    }

    const aiResult = await classifyWithAI(text);

    // If the text is vague and AI is unsure, do not guess a hazard — mark as insufficient detail.
    const forceInsufficient =
      aiResult.confidence < 0.35 && isLikelyVagueReport(text);

    const effectiveKey = forceInsufficient ? 'insufficient_detail' : aiResult.key;

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

    const commentRole = forceInsufficient
      ? ('system' as const)
      : effectiveKey === 'insufficient_detail'
        ? ('ai' as const)
        : autoReject
          ? ('system' as const)
          : needsReview
            ? ('system' as const)
            : null;

    const comment = commentRole
      ? effectiveKey === 'insufficient_detail'
        ? 'Not enough information to classify this report. Please add clear details (what happened + where + when) so it can be reviewed.'
        : autoReject
          ? 'Rejected: the report could not be classified confidently. Please add more details and try again.'
          : needsReview
            ? 'Needs review: low confidence classification. Please review and adjust category if needed.'
            : null
      : null;

    reportLogger.info(
      `AI raw → key: ${aiResult.key}, severity: ${aiResult.severity}, confidence: ${aiResult.confidence}`
    );

    if (forceInsufficient) {
      reportLogger.info('Override → insufficient_detail (vague text + low confidence)');
    }

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
      commentRole,
      comment,
    };
  } catch (error: any) {
    reportLogger.error(`Processing failed: ${error.message}`);
    throw error;
  }
}
