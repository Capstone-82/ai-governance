
import {
    ModelRun,
    AnalyticsData,
    Recommendation,
    PromptSuggestion,
    DecisionConfidence,
    DivergenceAnalysis
} from '@/types/ai-platform';
import { getModelById } from '@/data/models';

const generateId = () => Math.random().toString(36).substring(2, 15);

export const generateAnalytics = (runs: ModelRun[]): AnalyticsData => {
    return {
        tokenComparison: runs.map(run => {
            const model = getModelById(run.modelId);
            return {
                modelId: run.modelId,
                modelName: model?.name || run.modelId,
                inputTokens: run.inputTokens,
                outputTokens: run.outputTokens,
                color: model?.color || '#888',
            };
        }),
        latencyComparison: runs.map(run => {
            const model = getModelById(run.modelId);
            return {
                modelId: run.modelId,
                modelName: model?.name || run.modelId,
                latency: run.latencyMs,
                color: model?.color || '#888',
            };
        }),
        costComparison: runs.map(run => {
            const model = getModelById(run.modelId);
            return {
                modelId: run.modelId,
                modelName: model?.name || run.modelId,
                cost: run.cost,
                color: model?.color || '#888',
            };
        }),
        contextUsage: runs.map(run => {
            const model = getModelById(run.modelId);
            return {
                modelId: run.modelId,
                modelName: model?.name || run.modelId,
                used: run.inputTokens + run.outputTokens,
                available: model?.contextWindow || 100000,
                percentage: run.contextUsage,
                color: model?.color || '#888',
            };
        }),
        efficiencyScores: runs.map(run => {
            const model = getModelById(run.modelId);
            // Efficiency = quality per cost-latency unit (higher is better)
            const score = Math.round((run.outputTokens / run.inputTokens) * (1000 / run.latencyMs) * (0.01 / run.cost) * 100);
            return {
                modelId: run.modelId,
                modelName: model?.name || run.modelId,
                score: Math.min(100, Math.max(0, score)),
                color: model?.color || '#888',
            };
        }),
        accuracyComparison: runs.map(run => {
            const model = getModelById(run.modelId);
            return {
                modelId: run.modelId,
                modelName: model?.name || run.modelId,
                accuracy: run.accuracy || 0,
                color: model?.color || '#888',
            };
        }),
    };
};

export const generateRecommendations = (runs: ModelRun[]): Recommendation[] => {
    const sorted = {
        bySpeed: [...runs].sort((a, b) => a.latencyMs - b.latencyMs),
        byCost: [...runs].sort((a, b) => a.cost - b.cost),
        byContext: [...runs].sort((a, b) => {
            const modelA = getModelById(a.modelId);
            const modelB = getModelById(b.modelId);
            return (modelB?.contextWindow || 0) - (modelA?.contextWindow || 0);
        }),
        byAccuracy: [...runs].sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0)),
    };

    const newRecs: Recommendation[] = [];

    if (sorted.bySpeed[0]) {
        const model = getModelById(sorted.bySpeed[0].modelId);
        newRecs.push({
            id: generateId(),
            type: 'speed',
            modelId: sorted.bySpeed[0].modelId,
            title: 'Fastest Response',
            description: `${model?.name} delivered the quickest response at ${sorted.bySpeed[0].latencyMs}ms`,
            metric: `${sorted.bySpeed[0].latencyMs}ms`,
            confidence: 92,
            icon: '⚡',
        });
    }

    if (sorted.byCost[0]) {
        const model = getModelById(sorted.byCost[0].modelId);
        const savings = sorted.byCost[runs.length - 1].cost - sorted.byCost[0].cost;
        newRecs.push({
            id: generateId(),
            type: 'cost',
            modelId: sorted.byCost[0].modelId,
            title: 'Most Cost Efficient',
            description: `${model?.name} offers ${Math.round((savings / sorted.byCost[runs.length - 1].cost) * 100)}% cost savings`,
            metric: `$${sorted.byCost[0].cost.toFixed(6)}`,
            confidence: 88,
            icon: '💰',
        });
    }

    if (sorted.byAccuracy[0]) {
        const model = getModelById(sorted.byAccuracy[0].modelId);
        newRecs.push({
            id: generateId(),
            type: 'quality',
            modelId: sorted.byAccuracy[0].modelId,
            title: 'Highest Accuracy',
            description: `${model?.name} achieved ${sorted.byAccuracy[0].accuracy}% accuracy score`,
            metric: `${sorted.byAccuracy[0].accuracy}%`,
            confidence: 95,
            icon: '🎯',
        });
    }

    return newRecs;
};

export const generateConfidence = (runs: ModelRun[]): DecisionConfidence => {
    const avgLatency = runs.reduce((sum, r) => sum + r.latencyMs, 0) / runs.length;
    const latencyStability = 100 - Math.min(100, (Math.max(...runs.map(r => r.latencyMs)) - Math.min(...runs.map(r => r.latencyMs))) / avgLatency * 50);

    const avgAccuracy = runs.reduce((sum, r) => sum + (r.accuracy || 0), 0) / runs.length;
    const accuracyConsistency = 100 - Math.min(100, (Math.max(...runs.map(r => r.accuracy || 0)) - Math.min(...runs.map(r => r.accuracy || 0))) / avgAccuracy * 50);

    const overallScore = Math.round((latencyStability + accuracyConsistency) / 2);

    return {
        score: overallScore,
        level: overallScore >= 75 ? 'high' : overallScore >= 50 ? 'medium' : 'low',
        factors: [
            { name: 'Latency Stability', score: Math.round(latencyStability), description: 'Consistency of response times' },
            { name: 'Accuracy Consistency', score: Math.round(accuracyConsistency), description: 'Similarity in accuracy scores' },
            { name: 'Model Agreement', score: Math.round((latencyStability + accuracyConsistency) / 2), description: 'Overall alignment between models' },
        ],
    };
};

export const generateDivergence = (runs: ModelRun[]): DivergenceAnalysis => {
    const comparisons = [];
    for (let i = 0; i < runs.length; i++) {
        for (let j = i + 1; j < runs.length; j++) {
            const model1 = getModelById(runs[i].modelId);
            const model2 = getModelById(runs[j].modelId);
            const similarity = Math.round(100 - Math.abs((runs[i].accuracy || 0) - (runs[j].accuracy || 0)));
            comparisons.push({
                model1: model1?.name || runs[i].modelId,
                model2: model2?.name || runs[j].modelId,
                similarity,
            });
        }
    }

    const avgSimilarity = comparisons.length > 0 ? comparisons.reduce((sum, c) => sum + c.similarity, 0) / comparisons.length : 100;

    return {
        level: avgSimilarity >= 80 ? 'low' : avgSimilarity >= 60 ? 'medium' : 'high',
        score: Math.round(100 - avgSimilarity),
        details: avgSimilarity >= 80
            ? 'Models show strong agreement on this response.'
            : avgSimilarity >= 60
                ? 'Some variation detected between model outputs.'
                : 'Significant differences between model responses - review recommended.',
        modelComparisons: comparisons,
    };
};

export const analyzePrompt = (prompt: string): PromptSuggestion[] => {
    const suggestions: PromptSuggestion[] = [];

    if (prompt.length > 500) {
        suggestions.push({
            id: generateId(),
            type: 'length',
            original: prompt.slice(0, 100) + '...',
            suggested: 'Consider breaking into smaller, focused prompts',
            tokenSavings: Math.round(prompt.length * 0.15 / 4),
            description: 'Long prompts can be optimized by removing redundant context',
        });
    }

    if (prompt.includes('please') || prompt.includes('kindly') || prompt.includes('would you')) {
        suggestions.push({
            id: generateId(),
            type: 'redundancy',
            original: 'Polite phrases detected',
            suggested: 'Use direct instructions for token efficiency',
            tokenSavings: Math.round(15),
            description: 'Removing conversational phrases saves tokens without affecting output',
        });
    }

    return suggestions;
};
