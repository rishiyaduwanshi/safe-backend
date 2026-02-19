import type { Severity } from "@/data/category";
import { flatCategory } from '@/data/category';
import { classifyWithAI } from "./classify";
import reportLogger from "./logger";

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
        const aiResult = await classifyWithAI(text);

        const category = flatCategory.find(
            (c) => c.key === aiResult.key
        );

        if (!category) {
            throw new Error("Invalid category returned by AI");
        }

        const finalSeverity = resolveSeverity(
            category.severity,
            aiResult.severity
        );

        const needsReview = aiResult.confidence < 0.55;

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
        };
    } catch (error: any) {
        reportLogger.error(`Processing failed: ${error.message}`);
        throw error;
    }
}
