import { useState, useCallback, useMemo } from 'react';
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
import { generateMockCumulativeAnalytics } from '@/data/mockAnalyticsData';

const generateId = () => Math.random().toString(36).substring(2, 15);

const createMockResponse = (modelId: string, prompt: string): string => {
  const model = getModelById(modelId);
  const responses: Record<string, string> = {
    'claude-3-5-sonnet': `I'll provide a comprehensive analysis of your request.\n\n${prompt.slice(0, 50)}...\n\nBased on careful reasoning, here are the key points:\n\n1. **Primary Consideration**: The core issue requires careful evaluation of multiple factors.\n\n2. **Analysis**: Looking at this from different angles, we can identify several important patterns.\n\n3. **Recommendation**: Based on the evidence, I suggest a structured approach that balances efficiency with thoroughness.\n\nThis analysis considers both immediate needs and long-term implications.`,
    'claude-3-haiku': `Quick response to your query:\n\n${prompt.slice(0, 30)}...\n\n• Key point 1: Direct answer\n• Key point 2: Supporting detail\n• Key point 3: Actionable next step\n\nLet me know if you need more detail.`,
    'gemini-2-flash': `Here's a rapid analysis:\n\n${prompt.slice(0, 40)}...\n\n**Quick Summary:**\n- Efficient processing complete\n- Main findings identified\n- Ready for follow-up questions\n\nMultimodal context considered where applicable.`,
    'gemini-2-pro': `Detailed analysis with extended context:\n\n${prompt.slice(0, 50)}...\n\n## Comprehensive Review\n\nUtilizing the extended context window, I've analyzed multiple dimensions:\n\n1. **Deep Analysis**: Thorough examination of all factors\n2. **Cross-referencing**: Patterns identified across domains\n3. **Synthesis**: Integrated conclusions from multiple perspectives\n\nThis response leverages the full reasoning capabilities.`,
    'gpt-4o': `I'll address your request thoughtfully.\n\n${prompt.slice(0, 45)}...\n\n### Analysis\n\nAfter considering your query, here's my response:\n\n1. **Context Understanding**: Clear comprehension of the task\n2. **Balanced Approach**: Weighing multiple factors\n3. **Practical Output**: Actionable recommendations\n\nThis combines creative and analytical thinking.`,
    'gpt-4o-mini': `Efficient response:\n\n${prompt.slice(0, 35)}...\n\n• Answer: Direct and concise\n• Details: Essential information included\n• Next: Ready for clarification\n\nCost-effective processing complete.`,
    'claude-bedrock': `AWS Bedrock Response:\n\n${prompt.slice(0, 50)}...\n\n**Enterprise Analysis:**\n\n1. Secure processing within AWS infrastructure\n2. Compliance-ready output\n3. Integration-friendly format\n\nFull Claude capabilities via Bedrock.`,
  };
  return responses[modelId] || `Response from ${model?.name || 'Unknown Model'}...`;
};

export function useAIPlatform() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [promptSuggestions, setPromptSuggestions] = useState<PromptSuggestion[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [confidence, setConfidence] = useState<DecisionConfidence | null>(null);
  const [divergence, setDivergence] = useState<DivergenceAnalysis | null>(null);

  const createSession = useCallback(() => {
    const newSession: Session = {
      id: generateId(),
      title: 'New Session',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      selectedModels: ['claude-3-5-sonnet', 'gemini-2-flash', 'gpt-4o'],
      totalTokens: 0,
      totalCost: 0,
      isTokenOptimized: false,
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession);
    return newSession;
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

    // Simulate parallel model execution
    const modelRuns: ModelRun[] = await Promise.all(
      config.selectedModels.map(async (modelId) => {
        const model = getModelById(modelId);
        if (!model) throw new Error(`Model ${modelId} not found`);

        // Simulate variable latency
        const latencyVariation = 0.7 + Math.random() * 0.6;
        const simulatedLatency = Math.round(model.avgLatency * latencyVariation);
        
        await new Promise(resolve => setTimeout(resolve, simulatedLatency));

        const response = createMockResponse(modelId, prompt);
        const inputTokens = Math.round(prompt.length / 4);
        const outputTokens = Math.round(response.length / 4);
        const cost = (inputTokens / 1000 * model.inputCostPer1k) + 
                    (outputTokens / 1000 * model.outputCostPer1k);

        return {
          id: generateId(),
          modelId,
          response,
          inputTokens,
          outputTokens,
          latencyMs: simulatedLatency,
          cost,
          contextUsage: ((inputTokens + outputTokens) / model.contextWindow) * 100,
          timestamp: new Date(),
          status: 'completed' as const,
        };
      })
    );

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

    setIsExecuting(false);
  }, [currentSession]);

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
      byQuality: [...runs].sort((a, b) => b.outputTokens - a.outputTokens),
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

    if (sorted.byContext[0]) {
      const model = getModelById(sorted.byContext[0].modelId);
      newRecs.push({
        id: generateId(),
        type: 'context',
        modelId: sorted.byContext[0].modelId,
        title: 'Best for Long Context',
        description: `${model?.name} supports up to ${(model?.contextWindow || 0).toLocaleString()} tokens`,
        metric: `${((model?.contextWindow || 0) / 1000).toFixed(0)}K`,
        confidence: 95,
        icon: '📚',
      });
    }

    if (sorted.byQuality[0]) {
      const model = getModelById(sorted.byQuality[0].modelId);
      newRecs.push({
        id: generateId(),
        type: 'quality',
        modelId: sorted.byQuality[0].modelId,
        title: 'Best for Quality',
        description: `${model?.name} provides most comprehensive responses`,
        metric: `${sorted.byQuality[0].outputTokens} tokens`,
        confidence: 85,
        icon: '🧠',
      });
    }

    setRecommendations(newRecs);
  };

  const generateConfidence = (runs: ModelRun[]) => {
    // Calculate similarity between outputs
    const avgLatency = runs.reduce((sum, r) => sum + r.latencyMs, 0) / runs.length;
    const latencyStability = 100 - Math.min(100, (Math.max(...runs.map(r => r.latencyMs)) - Math.min(...runs.map(r => r.latencyMs))) / avgLatency * 50);
    
    const avgTokens = runs.reduce((sum, r) => sum + r.outputTokens, 0) / runs.length;
    const outputConsistency = 100 - Math.min(100, (Math.max(...runs.map(r => r.outputTokens)) - Math.min(...runs.map(r => r.outputTokens))) / avgTokens * 50);
    
    const overallScore = Math.round((latencyStability + outputConsistency) / 2);
    
    setConfidence({
      score: overallScore,
      level: overallScore >= 75 ? 'high' : overallScore >= 50 ? 'medium' : 'low',
      factors: [
        { name: 'Latency Stability', score: Math.round(latencyStability), description: 'Consistency of response times' },
        { name: 'Output Consistency', score: Math.round(outputConsistency), description: 'Similarity in response lengths' },
        { name: 'Model Agreement', score: Math.round((latencyStability + outputConsistency) / 2), description: 'Overall alignment between models' },
      ],
    });
  };

  const generateDivergence = (runs: ModelRun[]) => {
    const comparisons = [];
    for (let i = 0; i < runs.length; i++) {
      for (let j = i + 1; j < runs.length; j++) {
        const model1 = getModelById(runs[i].modelId);
        const model2 = getModelById(runs[j].modelId);
        // Simplified similarity based on output length ratio
        const similarity = Math.round(100 - Math.abs(runs[i].outputTokens - runs[j].outputTokens) / Math.max(runs[i].outputTokens, runs[j].outputTokens) * 100);
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
    // Get base mock data and merge with real data
    const mockData = generateMockCumulativeAnalytics();
    
    // If no sessions exist, return mock data for demonstration
    if (sessions.length === 0) {
      return mockData;
    }

    const allRuns: ModelRun[] = [];
    const allMessages: Message[] = [];
    
    sessions.forEach(session => {
      session.messages.forEach(message => {
        allMessages.push(message);
        if (message.modelRuns) {
          allRuns.push(...message.modelRuns);
        }
      });
    });

    const totalQueries = sessions.reduce((sum, session) => 
      sum + session.messages.filter(m => m.role === 'user').length, 0);
    
    const totalTokensUsed = allRuns.reduce((sum, run) => 
      sum + run.inputTokens + run.outputTokens, 0);
    
    const totalCostIncurred = allRuns.reduce((sum, run) => sum + run.cost, 0);
    
    const averageLatency = allRuns.length > 0 
      ? allRuns.reduce((sum, run) => sum + run.latencyMs, 0) / allRuns.length 
      : 0;
    
    const successfulRuns = allRuns.filter(run => run.status === 'completed');
    const failedRuns = allRuns.filter(run => run.status === 'failed');
    const successRate = allRuns.length > 0 ? successfulRuns.length / allRuns.length : 0;
    const failureRate = allRuns.length > 0 ? failedRuns.length / allRuns.length : 0;

    // Model usage distribution
    const modelUsage = new Map<string, number>();
    allRuns.forEach(run => {
      modelUsage.set(run.modelId, (modelUsage.get(run.modelId) || 0) + 1);
    });

    const modelUsageDistribution = Array.from(modelUsage.entries()).map(([modelId, count]) => {
      const model = getModelById(modelId);
      return {
        modelId,
        modelName: model?.name || modelId,
        queryCount: count,
        percentage: (count / allRuns.length) * 100,
        color: model?.color || '#888',
      };
    });

    // Time-based trends (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const dailyData = new Map<string, { queries: number; tokens: number; cost: number; latencies: number[] }>();
    
    sessions.forEach(session => {
      session.messages.forEach(message => {
        if (message.role === 'user') {
          const dateKey = message.timestamp.toISOString().split('T')[0];
          if (!dailyData.has(dateKey)) {
            dailyData.set(dateKey, { queries: 0, tokens: 0, cost: 0, latencies: [] });
          }
          const dayData = dailyData.get(dateKey)!;
          dayData.queries += 1;
          
          // Find corresponding assistant message with model runs
          const assistantMessage = session.messages.find(m => 
            m.role === 'assistant' && m.timestamp > message.timestamp && m.modelRuns
          );
          
          if (assistantMessage?.modelRuns) {
            assistantMessage.modelRuns.forEach(run => {
              dayData.tokens += run.inputTokens + run.outputTokens;
              dayData.cost += run.cost;
              dayData.latencies.push(run.latencyMs);
            });
          }
        }
      });
    });

    const daily = Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date,
        queries: data.queries,
        tokens: data.tokens,
        cost: data.cost,
        avgLatency: data.latencies.length > 0 
          ? data.latencies.reduce((sum, l) => sum + l, 0) / data.latencies.length 
          : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Generate weekly and monthly aggregations
    const weekly = daily.reduce((weeks: any[], day, index) => {
      const weekIndex = Math.floor(index / 7);
      if (!weeks[weekIndex]) {
        weeks[weekIndex] = {
          week: `Week ${weekIndex + 1}`,
          queries: 0,
          tokens: 0,
          cost: 0,
          avgLatency: 0,
          latencySum: 0,
          latencyCount: 0,
        };
      }
      weeks[weekIndex].queries += day.queries;
      weeks[weekIndex].tokens += day.tokens;
      weeks[weekIndex].cost += day.cost;
      if (day.avgLatency > 0) {
        weeks[weekIndex].latencySum += day.avgLatency;
        weeks[weekIndex].latencyCount += 1;
      }
      return weeks;
    }, []).map(week => ({
      ...week,
      avgLatency: week.latencyCount > 0 ? week.latencySum / week.latencyCount : 0,
    }));

    const monthly = daily.reduce((months: any[], day) => {
      const monthKey = day.date.substring(0, 7); // YYYY-MM
      let month = months.find(m => m.month === monthKey);
      if (!month) {
        month = {
          month: monthKey,
          queries: 0,
          tokens: 0,
          cost: 0,
          avgLatency: 0,
          latencySum: 0,
          latencyCount: 0,
        };
        months.push(month);
      }
      month.queries += day.queries;
      month.tokens += day.tokens;
      month.cost += day.cost;
      if (day.avgLatency > 0) {
        month.latencySum += day.avgLatency;
        month.latencyCount += 1;
      }
      return months;
    }, []).map(month => ({
      ...month,
      avgLatency: month.latencyCount > 0 ? month.latencySum / month.latencyCount : 0,
    }));

    const totalInputTokens = allRuns.reduce((sum, run) => sum + run.inputTokens, 0);
    const totalOutputTokens = allRuns.reduce((sum, run) => sum + run.outputTokens, 0);
    const averageCostPerQuery = totalQueries > 0 ? totalCostIncurred / totalQueries : 0;
    const averageTokensPerQuery = totalQueries > 0 ? totalTokensUsed / totalQueries : 0;
    const peakLatency = allRuns.length > 0 ? Math.max(...allRuns.map(r => r.latencyMs)) : 0;
    const minLatency = allRuns.length > 0 ? Math.min(...allRuns.map(r => r.latencyMs)) : 0;

    // Merge with mock data for comprehensive view
    const mergedData: CumulativeAnalytics = {
      totalQueries: mockData.totalQueries + totalQueries,
      totalTokensUsed: mockData.totalTokensUsed + totalTokensUsed,
      totalCostIncurred: mockData.totalCostIncurred + totalCostIncurred,
      averageLatency: allRuns.length > 0 
        ? (mockData.averageLatency + averageLatency) / 2 
        : mockData.averageLatency,
      successRate: allRuns.length > 0 
        ? (mockData.successRate + successRate) / 2 
        : mockData.successRate,
      failureRate: allRuns.length > 0 
        ? (mockData.failureRate + failureRate) / 2 
        : mockData.failureRate,
      modelUsageDistribution: [
        ...mockData.modelUsageDistribution.map(model => ({
          ...model,
          queryCount: model.queryCount + (modelUsageDistribution.find(m => m.modelId === model.modelId)?.queryCount || 0),
        })),
        ...modelUsageDistribution.filter(model => 
          !mockData.modelUsageDistribution.find(m => m.modelId === model.modelId)
        ),
      ].map(model => ({
        ...model,
        percentage: (model.queryCount / (mockData.totalQueries + totalQueries)) * 100,
      })),
      timeBasedTrends: {
        daily: mockData.timeBasedTrends.daily.map(mockDay => {
          const realDay = daily.find(d => d.date === mockDay.date);
          if (realDay) {
            return {
              date: mockDay.date,
              queries: mockDay.queries + realDay.queries,
              tokens: mockDay.tokens + realDay.tokens,
              cost: mockDay.cost + realDay.cost,
              avgLatency: realDay.avgLatency > 0 
                ? Math.round((mockDay.avgLatency + realDay.avgLatency) / 2)
                : mockDay.avgLatency,
            };
          }
          return mockDay;
        }),
        weekly: [...mockData.timeBasedTrends.weekly, ...weekly].slice(-8), // Keep last 8 weeks
        monthly: [...mockData.timeBasedTrends.monthly, ...monthly].slice(-12), // Keep last 12 months
      },
      performanceMetrics: {
        totalInputTokens: mockData.performanceMetrics.totalInputTokens + totalInputTokens,
        totalOutputTokens: mockData.performanceMetrics.totalOutputTokens + totalOutputTokens,
        averageCostPerQuery: (mockData.performanceMetrics.averageCostPerQuery + averageCostPerQuery) / 2,
        averageTokensPerQuery: (mockData.performanceMetrics.averageTokensPerQuery + averageTokensPerQuery) / 2,
        peakLatency: Math.max(mockData.performanceMetrics.peakLatency, peakLatency),
        minLatency: Math.min(mockData.performanceMetrics.minLatency, minLatency || mockData.performanceMetrics.minLatency),
      },
    };

    return mergedData;
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
    createSession,
    setCurrentSession,
    executePrompt,
    estimateCost,
    models: AI_MODELS,
  };
}
