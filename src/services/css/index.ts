import { flatCategory } from '@/data/category';

export const CSS_LIMITS = {
    MIN: 0,
    MAX: 1000,
} as const;

export const CSS_BASELINE = 500;

const CSS_FACTORS = {
    CATEGORY_WEIGHT_MULTIPLIER: 10,
    REJECT_PENALTY_MULTIPLIER: 3,
    FALLBACK_CATEGORY_WEIGHT: 3,
} as const;

interface BuildCssUpdatePipelineOptions {
    useBaselineWhenNoHistory?: boolean;
    markHistoryInitialized?: boolean;
}

type ModerationDecision = 'approved' | 'rejected';

const getCategoryWeight = (categoryId?: number | null): number => {
    const category = flatCategory.find((item) => item.id === categoryId);
    return category?.weight ?? CSS_FACTORS.FALLBACK_CATEGORY_WEIGHT;
};

export const getCssDeltaForDecision = (
    categoryId: number | undefined | null,
    decision: ModerationDecision,
): number => {
    const weightedPoints = getCategoryWeight(categoryId) * CSS_FACTORS.CATEGORY_WEIGHT_MULTIPLIER;

    if (decision === 'approved') {
        return weightedPoints;
    }

    return -(weightedPoints * CSS_FACTORS.REJECT_PENALTY_MULTIPLIER);
};

const getCurrentCssExpression = (useBaselineWhenNoHistory: boolean): unknown => {
    if (!useBaselineWhenNoHistory) {
        return '$css';
    }

    return {
        $cond: [
            {
                $or: [
                    { $eq: ['$cssInitialized', true] },
                    { $gt: ['$css', 0] },
                ],
            },
            '$css',
            CSS_BASELINE,
        ],
    };
};

export const buildCssUpdatePipeline = (
    delta: number,
    options: BuildCssUpdatePipelineOptions = {},
): Array<{ $set: { css: unknown; cssInitialized?: boolean } }> => {
    const {
        useBaselineWhenNoHistory = false,
        markHistoryInitialized = false,
    } = options;

    const currentCss = getCurrentCssExpression(useBaselineWhenNoHistory);

    const adjustedValue = delta >= 0
        ? { $add: [currentCss, delta] }
        : { $subtract: [currentCss, Math.abs(delta)] };

    const setPayload: { css: unknown; cssInitialized?: boolean } = {
        css: {
            $min: [CSS_LIMITS.MAX, { $max: [CSS_LIMITS.MIN, adjustedValue] }],
        },
    };

    if (markHistoryInitialized) {
        setPayload.cssInitialized = true;
    }

    return [
        {
            $set: setPayload,
        },
    ];
};

export const buildModerationCssUpdatePipeline = (
    categoryId: number | undefined | null,
    decision: ModerationDecision,
): Array<{ $set: { css: unknown; cssInitialized?: boolean } }> => {
    const delta = getCssDeltaForDecision(categoryId, decision);
    return buildCssUpdatePipeline(delta, {
        useBaselineWhenNoHistory: true,
        markHistoryInitialized: true,
    });
};
