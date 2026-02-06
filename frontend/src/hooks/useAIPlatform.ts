import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Session,
  Message,
  ModelRun,
  Recommendation,
  PromptSuggestion,
  AnalyticsData,
  CumulativeAnalytics,
  DecisionConfidence,
  DivergenceAnalysis,
  ExecutionConfig
} from '@/types/ai-platform';
import { AI_MODELS, getModelById } from '@/data/models';
import api, { BackendModelConfig, GovernanceLog } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const generateId = () => Math.random().toString(36).substring(2, 15);
const SESSION_STORAGE_KEY = 'ai-platform-sessions';
const CURRENT_SESSION_KEY = 'ai-platform-current-session';

const reviveSessions = (stored: Session[]): Session[] =>
  stored.map((session) => ({
    ...session,
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
    messages: (session.messages || []).map((message) => ({
      ...message,
      timestamp: new Date(message.timestamp),
      modelRuns: message.modelRuns?.map((run) => ({
        ...run,
        timestamp: new Date(run.timestamp),
      })),
    })),
  }));

const loadSessionsFromStorage = (): Session[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Session[];
    return reviveSessions(parsed);
  } catch {
    return [];
  }
};

export function useAIPlatform() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [promptSuggestions, setPromptSuggestions] = useState<PromptSuggestion[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [confidence, setConfidence] = useState<DecisionConfidence | null>(null);
  const [divergence, setDivergence] = useState<DivergenceAnalysis | null>(null);
  const [governanceContext, setGovernanceContext] = useState<'aws' | 'azure' | 'gcp'>('aws');

  useEffect(() => {
    const storedSessions = loadSessionsFromStorage();
    if (storedSessions.length > 0) {
      setSessions(storedSessions);
      const storedCurrentId = sessionStorage.getItem(CURRENT_SESSION_KEY);
      const matchedSession = storedSessions.find((session) => session.id === storedCurrentId);
      setCurrentSession(matchedSession || storedSessions[0] || null);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentSession) {
      sessionStorage.setItem(CURRENT_SESSION_KEY, currentSession.id);
    } else {
      sessionStorage.removeItem(CURRENT_SESSION_KEY);
    }
  }, [currentSession]);

  const createSession = useCallback(() => {
    const newSession: Session = {
      id: generateId(),
      title: 'New Session',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      selectedModels: [
        'anthropic.claude-3-5-sonnet-20240620-v1:0',
        'gemini-2.5-flash',
        'gpt-4o'
      ],
      totalTokens: 0,
      totalCost: 0,
      isTokenOptimized: false,
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession);
    return newSession;
  }, []);

  const renameSession = useCallback((sessionId: string, title: string) => {
    setSessions(prev =>
      prev.map(session =>
        session.id === sessionId
          ? { ...session, title, updatedAt: new Date() }
          : session
      )
    );
    setCurrentSession(prev =>
      prev && prev.id === sessionId ? { ...prev, title, updatedAt: new Date() } : prev
    );
  }, []);

  const executePrompt = useCallback(async (
    prompt: string,
    config: ExecutionConfig
  ) => {
    if (!currentSession) return;

    setIsExecuting(true);

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    try {
      // Prepare backend request
      const backendModels: BackendModelConfig[] = config.selectedModels.map(modelId => {
        const model = getModelById(modelId);
        return {
          host_platform: model?.hostPlatform || 'aws_bedrock',
          model_id: modelId,
        };
      });

      // Call real backend API
      const backendResponses: GovernanceLog[] = await api.governance.batchAnalyze({
        query: prompt,
        governance_context: governanceContext,
        models: backendModels,
      });

      // Convert backend responses to frontend ModelRun format
      const modelRuns: ModelRun[] = backendResponses.map((log) => {
        const model = getModelById(log.model_id);
        return {
          id: log.id,
          modelId: log.model_id,
          response: log.response_text,
          inputTokens: log.usage.input_tokens,
          outputTokens: log.usage.output_tokens,
          latencyMs: log.usage.latency_ms,
          cost: log.cost.total_cost,
          contextUsage: model
            ? ((log.usage.input_tokens + log.usage.output_tokens) / model.contextWindow) * 100
            : 0,
          timestamp: new Date(log.ended_at),
          status: log.success ? 'completed' : 'failed',
          error: log.error_message,
          accuracy: log.accuracy.score,
          accuracyRationale: log.accuracy.rationale,
        };
      });

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: 'Multi-model response',
        timestamp: new Date(),
        modelRuns,
      };

      // Update session
      const updatedSession: Session = {
        ...currentSession,
        title: prompt.slice(0, 40) + (prompt.length > 40 ? '...' : ''),
        updatedAt: new Date(),
        messages: [...currentSession.messages, userMessage, assistantMessage],
        totalTokens: currentSession.totalTokens + modelRuns.reduce((sum, run) => sum + run.inputTokens + run.outputTokens, 0),
        totalCost: currentSession.totalCost + modelRuns.reduce((sum, run) => sum + run.cost, 0),
        isTokenOptimized: config.useHistory && currentSession.messages.length > 0,
      };

      setCurrentSession(updatedSession);
      setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));

      // Generate analytics
      generateAnalytics(modelRuns);
      generateRecommendations(modelRuns);
      generateConfidence(modelRuns);
      generateDivergence(modelRuns);
      analyzePrompt(prompt);

      toast({
        title: "Analysis Complete",
        description: `Received responses from ${modelRuns.length} models`,
      });

    } catch (error) {
      console.error('Execution error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to execute prompt",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  }, [currentSession, governanceContext, toast]);

  const generateAnalytics = (runs: ModelRun[]) => {
    const analyticsData: AnalyticsData = {
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
    setAnalytics(analyticsData);
  };

  const generateRecommendations = (runs: ModelRun[]) => {
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

    setRecommendations(newRecs);
  };

  const generateConfidence = (runs: ModelRun[]) => {
    const avgLatency = runs.reduce((sum, r) => sum + r.latencyMs, 0) / runs.length;
    const latencyStability = 100 - Math.min(100, (Math.max(...runs.map(r => r.latencyMs)) - Math.min(...runs.map(r => r.latencyMs))) / avgLatency * 50);

    const avgAccuracy = runs.reduce((sum, r) => sum + (r.accuracy || 0), 0) / runs.length;
    const accuracyConsistency = 100 - Math.min(100, (Math.max(...runs.map(r => r.accuracy || 0)) - Math.min(...runs.map(r => r.accuracy || 0))) / avgAccuracy * 50);

    const overallScore = Math.round((latencyStability + accuracyConsistency) / 2);

    setConfidence({
      score: overallScore,
      level: overallScore >= 75 ? 'high' : overallScore >= 50 ? 'medium' : 'low',
      factors: [
        { name: 'Latency Stability', score: Math.round(latencyStability), description: 'Consistency of response times' },
        { name: 'Accuracy Consistency', score: Math.round(accuracyConsistency), description: 'Similarity in accuracy scores' },
        { name: 'Model Agreement', score: Math.round((latencyStability + accuracyConsistency) / 2), description: 'Overall alignment between models' },
      ],
    });
  };

  const generateDivergence = (runs: ModelRun[]) => {
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

    const avgSimilarity = comparisons.reduce((sum, c) => sum + c.similarity, 0) / comparisons.length;

    setDivergence({
      level: avgSimilarity >= 80 ? 'low' : avgSimilarity >= 60 ? 'medium' : 'high',
      score: Math.round(100 - avgSimilarity),
      details: avgSimilarity >= 80
        ? 'Models show strong agreement on this response.'
        : avgSimilarity >= 60
          ? 'Some variation detected between model outputs.'
          : 'Significant differences between model responses - review recommended.',
      modelComparisons: comparisons,
    });
  };

  const analyzePrompt = (prompt: string) => {
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

    setPromptSuggestions(suggestions);
  };

  const estimateCost = (prompt: string, modelIds: string[]): number => {
    const inputTokens = Math.round(prompt.length / 4);
    const estimatedOutputTokens = inputTokens * 2;

    return modelIds.reduce((total, modelId) => {
      const model = getModelById(modelId);
      if (!model) return total;
      return total + (inputTokens / 1000 * model.inputCostPer1k) +
        (estimatedOutputTokens / 1000 * model.outputCostPer1k);
    }, 0);
  };

  // Generate cumulative analytics across all sessions
  const cumulativeAnalytics = useMemo((): CumulativeAnalytics => {
    if (sessions.length === 0) {
      // Return empty state when no sessions
      return {
        totalQueries: 0,
        totalTokensUsed: 0,
        totalCostIncurred: 0,
        averageLatency: 0,
        successRate: 0,
        failureRate: 0,
        modelUsageDistribution: [],
        modelMetrics: [],
        timeBasedTrends: {
          daily: [],
          weekly: [],
          monthly: [],
        },
        performanceMetrics: {
          totalInputTokens: 0,
          totalOutputTokens: 0,
          averageCostPerQuery: 0,
          averageTokensPerQuery: 0,
          peakLatency: 0,
          minLatency: 0,
        },
      };
    }

    // Collect all model runs from all sessions
    const allRuns: ModelRun[] = [];
    sessions.forEach(session => {
      session.messages.forEach(message => {
        if (message.modelRuns) {
          allRuns.push(...message.modelRuns);
        }
      });
    });

    if (allRuns.length === 0) {
      // Return empty state when no runs
      return {
        totalQueries: 0,
        totalTokensUsed: 0,
        totalCostIncurred: 0,
        averageLatency: 0,
        successRate: 0,
        failureRate: 0,
        modelUsageDistribution: [],
        modelMetrics: [],
        timeBasedTrends: {
          daily: [],
          weekly: [],
          monthly: [],
        },
        performanceMetrics: {
          totalInputTokens: 0,
          totalOutputTokens: 0,
          averageCostPerQuery: 0,
          averageTokensPerQuery: 0,
          peakLatency: 0,
          minLatency: 0,
        },
      };
    }

    // Calculate totals
    const totalQueries = allRuns.length;
    const totalInputTokens = allRuns.reduce((sum, run) => sum + run.inputTokens, 0);
    const totalOutputTokens = allRuns.reduce((sum, run) => sum + run.outputTokens, 0);
    const totalTokensUsed = totalInputTokens + totalOutputTokens;
    const totalCostIncurred = allRuns.reduce((sum, run) => sum + run.cost, 0);
    const totalLatency = allRuns.reduce((sum, run) => sum + run.latencyMs, 0);
    const averageLatency = totalLatency / totalQueries;
    const successCount = allRuns.filter(run => run.status === 'completed').length;
    const successRate = successCount / totalQueries;
    const failureRate = 1 - successRate;

    // Group by model
    const modelGroups = new Map<string, ModelRun[]>();
    allRuns.forEach(run => {
      if (!modelGroups.has(run.modelId)) {
        modelGroups.set(run.modelId, []);
      }
      modelGroups.get(run.modelId)!.push(run);
    });

    // Calculate model metrics
    const modelMetrics = Array.from(modelGroups.entries()).map(([modelId, runs]) => {
      const model = getModelById(modelId);
      const inputTokens = runs.reduce((sum, run) => sum + run.inputTokens, 0);
      const outputTokens = runs.reduce((sum, run) => sum + run.outputTokens, 0);
      const avgLatency = runs.reduce((sum, run) => sum + run.latencyMs, 0) / runs.length;
      const accuracy = runs.reduce((sum, run) => sum + (run.accuracy || 0), 0) / runs.length;
      const totalCost = runs.reduce((sum, run) => sum + run.cost, 0);

      return {
        modelId,
        modelName: model?.name || modelId,
        inputTokens,
        outputTokens,
        avgLatency,
        accuracy,
        totalCost,
        color: model?.color || '#888',
      };
    });

    // Calculate model usage distribution
    const modelUsageDistribution = Array.from(modelGroups.entries()).map(([modelId, runs]) => {
      const model = getModelById(modelId);
      return {
        modelId,
        modelName: model?.name || modelId,
        queryCount: runs.length,
        percentage: (runs.length / totalQueries) * 100,
        color: model?.color || '#888',
      };
    });

    // Calculate time-based trends (group by date)
    const dailyMap = new Map<string, { queries: number; tokens: number; cost: number; latencies: number[] }>();

    allRuns.forEach(run => {
      const dateKey = run.timestamp.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { queries: 0, tokens: 0, cost: 0, latencies: [] });
      }
      const day = dailyMap.get(dateKey)!;
      day.queries++;
      day.tokens += run.inputTokens + run.outputTokens;
      day.cost += run.cost;
      day.latencies.push(run.latencyMs);
    });

    const daily = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        queries: data.queries,
        tokens: data.tokens,
        cost: data.cost,
        avgLatency: Math.round(data.latencies.reduce((sum, lat) => sum + lat, 0) / data.latencies.length),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalQueries,
      totalTokensUsed,
      totalCostIncurred,
      averageLatency,
      successRate,
      failureRate,
      modelUsageDistribution,
      modelMetrics,
      timeBasedTrends: {
        daily,
        weekly: [], // Can be calculated if needed
        monthly: [], // Can be calculated if needed
      },
      performanceMetrics: {
        totalInputTokens,
        totalOutputTokens,
        averageCostPerQuery: totalCostIncurred / totalQueries,
        averageTokensPerQuery: totalTokensUsed / totalQueries,
        peakLatency: Math.max(...allRuns.map(run => run.latencyMs)),
        minLatency: Math.min(...allRuns.map(run => run.latencyMs)),
      },
    };
  }, [sessions]);

  return {
    sessions,
    currentSession,
    isExecuting,
    recommendations,
    promptSuggestions,
    analytics,
    cumulativeAnalytics,
    confidence,
    divergence,
    governanceContext,
    setGovernanceContext,
    createSession,
    renameSession,
    setCurrentSession,
    executePrompt,
    estimateCost,
    models: AI_MODELS,
  };
}
