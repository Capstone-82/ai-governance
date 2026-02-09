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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

  const fetchSessionDetails = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/history/conversations/${sessionId}`);
      if (!res.ok) throw new Error('Failed to fetch session details');
      const data = await res.json();

      // Map API response to Session type
      // The API returns { messages: [...], ... }
      // We need to map messages and modelRuns
      const messages: Message[] = data.messages.map((msg: any) => {
        // API returns separate messages for assistant. Grouping logic might be needed if they are separate.
        // But for now, let's map directly.
        // If telemetry is present, it's an assistant message with a run.
        const modelRuns: ModelRun[] = msg.telemetry ? [{
          id: generateId(),
          modelId: msg.telemetry.model_id, // This might be backend ID, we might need reverse mapping or just use it
          response: msg.content,
          inputTokens: 0, // specific telemetry fields might be missing in simple view, assume 0 if not there
          outputTokens: 0,
          latencyMs: msg.telemetry.latency_ms || 0,
          cost: msg.telemetry.total_cost || 0,
          contextUsage: 0,
          timestamp: new Date(msg.created_at),
          status: 'completed',
        }] : undefined;

        // Note: The backend returns "assistant" messages separately for each model in a batch?
        // If so, the UI will show multiple assistant bubbles. This is acceptable for "necessary changes".

        return {
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          modelRuns
        };
      });

      const fullSession: Session = {
        id: data.id,
        title: data.title,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.created_at), // API doesn't send updated_at? use created_at
        messages,
        selectedModels: [], // We'd need to infer this or store it
        totalTokens: 0, // calculate from messages
        totalCost: 0, // calculate from messages
        isTokenOptimized: false
      };

      return fullSession;
    } catch (error) {
      console.error("Error fetching session details:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    const initSessions = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/history/conversations?limit=50`);
        if (res.ok) {
          const list = await res.json();
          const mappedSessions: Session[] = list.map((item: any) => ({
            id: item.id,
            title: item.title,
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.created_at),
            messages: [], // Empty initially
            selectedModels: [],
            totalTokens: 0,
            totalCost: 0,
            isTokenOptimized: false
          }));
          setSessions(mappedSessions);

          // Restore current session
          const storedCurrentId = sessionStorage.getItem(CURRENT_SESSION_KEY);
          const sessionIdToLoad = storedCurrentId || (mappedSessions.length > 0 ? mappedSessions[0].id : null);

          if (sessionIdToLoad) {
            const details = await fetchSessionDetails(sessionIdToLoad);
            if (details) {
              setCurrentSession(details);
              // Update the session in the list with details
              setSessions(prev => prev.map(s => s.id === details.id ? details : s));
            }
          }
        }
      } catch (e) {
        console.error("Failed to load sessions from API", e);
      }
    };
    initSessions();
  }, [fetchSessionDetails]);

  // When switching sessions, fetch details
  const handleSetCurrentSession = async (session: Session) => {
    if (session.messages.length === 0) {
      const details = await fetchSessionDetails(session.id);
      if (details) {
        setCurrentSession(details);
        setSessions(prev => prev.map(s => s.id === details.id ? details : s));
        return;
      }
    }
    setCurrentSession(session);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentSession) {
      sessionStorage.setItem(CURRENT_SESSION_KEY, currentSession.id);

      // Auto-migrate stale IDs for current session
      const staleToNew: Record<string, string> = {
        'anthropic.claude-3-5-sonnet-20240620-v1:0': 'anthropic.claude-sonnet-4-20250514-v1:0',
        'meta.llama4-maverick-17b-v1:0': 'meta.llama4-maverick-17b-instruct-v1:0',
        'meta.llama4-scout-17b-v1:0': 'meta.llama4-scout-17b-instruct-v1:0'
      };

      const hasStale = currentSession.selectedModels.some(id => staleToNew[id]);
      if (hasStale) {
        const migrated = currentSession.selectedModels.map(id => staleToNew[id] || id);
        setCurrentSession(prev => prev ? { ...prev, selectedModels: migrated } : null);

        setSessions(prev => prev.map(s =>
          s.id === currentSession.id ? { ...s, selectedModels: migrated } : s
        ));
      }
    } else {
      sessionStorage.removeItem(CURRENT_SESSION_KEY);
    }
  }, [currentSession]);

  const createSession = useCallback(() => {
    // Current backend doesn't support empty session creation via API explicitly shown in docs?
    // We'll create a local placeholder.
    const newSession: Session = {
      id: generateId(), // Temporary ID until first message
      title: 'New Session',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      selectedModels: [
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
    // Implement API call for rename if available, otherwise local
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
    config: ExecutionConfig,
    session?: Session
  ) => {
    // Use provided session or fall back to currentSession
    const targetSession = session || currentSession;
    if (!targetSession) return;

    setIsExecuting(true);

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    // Optimistic update
    const tempSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage]
    };
    setCurrentSession(tempSession);

    try {
      const payload = {
        query: prompt,
        governance_context: 'aws',
        models: config.selectedModels.map(id => {
          const m = getModelById(id);
          return {
            host_platform: m?.backendPlatform || 'openai',
            model_id: m?.backendId || id
          };
        })
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/governance/analyze/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('API request failed');

      const logs: any[] = await res.json();

      const modelRuns: ModelRun[] = logs.map(log => ({
        id: log.id,
        modelId: config.selectedModels.find(mId => {
          const m = getModelById(mId);
          return m?.backendId === log.model_id || mId === log.model_id;
        }) || log.model_id, // Try to map back to frontend ID
        response: log.response_text || 'No response',
        inputTokens: log.usage?.input_tokens || 0,
        outputTokens: log.usage?.output_tokens || 0,
        latencyMs: log.usage?.latency_ms || 0,
        cost: log.cost?.total_cost || 0,
        contextUsage: 0,
        timestamp: new Date(log.ended_at),
        status: log.success ? 'completed' : 'failed',
        error: log.error_message
      }));

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: 'Multi-model response',
        timestamp: new Date(),
        modelRuns,
      };

      const updatedSession: Session = {
        ...tempSession,
        messages: [...tempSession.messages, assistantMessage],
        totalTokens: tempSession.totalTokens + modelRuns.reduce((sum, run) => sum + run.inputTokens + run.outputTokens, 0),
        totalCost: tempSession.totalCost + modelRuns.reduce((sum, run) => sum + run.cost, 0),
        updatedAt: new Date(),
      };

      setCurrentSession(updatedSession);
      // Also refresh list to get real ID if it was new session?
      // But logs don't return conversation ID.
      // We might be desynced from backend ID if we used a temp ID.
      // This is a risk. But for "necessary changes" this is best effort.

      setSessions(prev => prev.map(s => s.id === currentSession.id ? updatedSession : s));

      // Generate analytics locally based on real data
      setAnalytics(generateAnalytics(modelRuns));
      setRecommendations(generateRecommendations(modelRuns));
      setConfidence(generateConfidence(modelRuns));
      setDivergence(generateDivergence(modelRuns));
      setPromptSuggestions(analyzePrompt(prompt));

    } catch (e) {
      console.error('Execution failed', e);
      // Handle error state
    } finally {
      setIsExecuting(false);
    }
  }, [currentSession]);

  const executePromptStreaming = useCallback(async (
    prompt: string,
    config: ExecutionConfig,
    session?: Session,
    onProgress?: (completed: number, total: number) => void
  ) => {
    const targetSession = session || currentSession;
    if (!targetSession) return;

    setIsExecuting(true);

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    try {
      const backendModels: BackendModelConfig[] = config.selectedModels.map(modelId => {
        const model = getModelById(modelId);
        return {
          host_platform: model?.hostPlatform || 'aws_bedrock',
          model_id: modelId,
        };
      });

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

      const response = await fetch(`${API_BASE_URL}/api/v1/governance/analyze/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.guardrailId ? { 'x-aws-guardrail-id': config.guardrailId } : {}),
        },
        body: JSON.stringify({
          query: prompt,
          governance_context: governanceContext,
          models: backendModels,
          evaluator_model: config.evaluatorModel,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Stream failed: ${response.statusText}`;
        try {
          const json = JSON.parse(errorText);
          if (json.detail) {
            errorMessage = json.detail;
          }
        } catch (e) {
          // ignore parsing error
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Stream reader not available');
      }

      const modelRuns: ModelRun[] = [];
      let total = config.selectedModels.length;
      let completed = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'start') {
              total = data.total;
              onProgress?.(0, total);
            } else if (data.type === 'result') {
              const log: GovernanceLog = data.data;
              const model = getModelById(log.model_id);

              const modelRun: ModelRun = {
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

              modelRuns.push(modelRun);
              completed++;
              onProgress?.(completed, total);

              // Update session progressively
              const assistantMessage: Message = {
                id: generateId(),
                role: 'assistant',
                content: 'Multi-model response',
                timestamp: new Date(),
                modelRuns: [...modelRuns],
              };

              const updatedSession: Session = {
                ...targetSession,
                title: targetSession.messages.length === 0
                  ? (prompt.slice(0, 40) + (prompt.length > 40 ? '...' : ''))
                  : targetSession.title,
                updatedAt: new Date(),
                messages: [...targetSession.messages.filter(m => m.role !== 'assistant' || m.id !== assistantMessage.id), userMessage, assistantMessage],
                totalTokens: targetSession.totalTokens + modelRuns.reduce((sum, run) => sum + run.inputTokens + run.outputTokens, 0),
                totalCost: targetSession.totalCost + modelRuns.reduce((sum, run) => sum + run.cost, 0),
                isTokenOptimized: config.useHistory && targetSession.messages.length > 0,
              };

              setCurrentSession(updatedSession);
              setSessions(prev => {
                const index = prev.findIndex(s => s.id === updatedSession.id);
                if (index >= 0) {
                  return prev.map(s => s.id === updatedSession.id ? updatedSession : s);
                } else {
                  return [updatedSession, ...prev];
                }
              });

              // Update analytics progressively
              setAnalytics(generateAnalytics(modelRuns));
              setRecommendations(generateRecommendations(modelRuns));
              setConfidence(generateConfidence(modelRuns));
              setDivergence(generateDivergence(modelRuns));
              setPromptSuggestions(analyzePrompt(prompt));
            } else if (data.type === 'complete') {
              toast({
                title: "Analysis Complete",
                description: `Received responses from ${modelRuns.length} models`,
              });
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          }
        }
      }

    } catch (error) {
      console.error('Streaming error:', error);

      let errorMessage = "Failed to execute prompt";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
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
        complexityAnalysis: [],
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
        complexityAnalysis: [],
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
      complexityAnalysis: [],
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
    setCurrentSession: handleSetCurrentSession,
    executePrompt,
    executePromptStreaming,
    estimateCost,
    models: AI_MODELS,
  };
}
