import { useState, useCallback } from 'react';
import { 
  Session, 
  Message, 
  ModelRun, 
  Recommendation, 
  PromptSuggestion,
  AnalyticsData,
  DecisionConfidence,
  DivergenceAnalysis,
  ExecutionConfig 
} from '@/types/ai-platform';
import { AI_MODELS, getModelById } from '@/data/models';

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

  return {
    sessions,
    currentSession,
    isExecuting,
    recommendations,
    promptSuggestions,
    analytics,
    confidence,
    divergence,
    createSession,
    setCurrentSession,
    executePrompt,
    estimateCost,
    models: AI_MODELS,
  };
}
