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
import {
  generateAnalytics,
  generateRecommendations,
  generateConfidence,
  generateDivergence,
  analyzePrompt
} from '@/utils/analytics';

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
        guardrailId: config.guardrailId,
        evaluatorModel: config.evaluatorModel,
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
          queryCategory: log.accuracy.query_category,
          promptOptimization: log.accuracy.prompt_optimization,
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
      setAnalytics(generateAnalytics(modelRuns));
      setRecommendations(generateRecommendations(modelRuns));
      setConfidence(generateConfidence(modelRuns));
      setDivergence(generateDivergence(modelRuns));
      setPromptSuggestions(analyzePrompt(prompt));

      toast({
        title: "Analysis Complete",
        description: `Received responses from ${modelRuns.length} models`,
      });

    } catch (error) {
      console.error('Execution error:', error);

      let errorMessage = "Failed to execute prompt";
      let errorTitle = "Error";

      if (error instanceof Error) {
        // Check if it's a JSON error string from our API wrapper
        // e.g. "Guardrail Violation: ..." or explicit JSON format
        errorMessage = error.message;

        // 1. Clean up "API Error (400): " prefix from api.ts
        if (errorMessage.includes("API Error")) {
          const parts = errorMessage.split("): ");
          if (parts.length > 1) {
            errorMessage = parts[1];
          }
        }

        // 2. Parse JSON content if present (e.g. {"detail": "..."})
        try {
          if (errorMessage.trim().startsWith("{")) {
            const json = JSON.parse(errorMessage);
            if (json.detail) {
              errorMessage = json.detail;
            }
          }
        } catch (e) {
          // Not valid JSON, keep original string
        }

        // 3. Specialized handling for Guardrail Violations
        if (errorMessage.includes("Guardrail Violation")) {
          errorTitle = "Blocked by Guardrail";
          // Remove the technical prefix if present
          errorMessage = errorMessage.replace("Guardrail Violation:", "").trim();
        }
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  }, [currentSession, governanceContext, toast]);





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
