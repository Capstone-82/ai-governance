export type ModelProvider = 'anthropic' | 'google' | 'openai' | 'amazon';

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  hostPlatform: 'aws_bedrock' | 'openai' | 'gcp_vertex';
  description: string;
  contextWindow: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
  avgLatency: number;
  capabilities: string[];
  color: string;
}

export interface ModelRun {
  id: string;
  modelId: string;
  response: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  cost: number;
  contextUsage: number;
  timestamp: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  accuracy?: number; // 0-100 score from backend
  accuracyRationale?: string;
  queryCategory?: string;
  promptOptimization?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  modelRuns?: ModelRun[];
}

export interface Session {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  selectedModels: string[];
  totalTokens: number;
  totalCost: number;
  isTokenOptimized: boolean;
}

export interface Recommendation {
  id: string;
  type: 'speed' | 'cost' | 'quality' | 'context';
  modelId: string;
  title: string;
  description: string;
  metric: string;
  confidence: number;
  icon: string;
}

export interface PromptSuggestion {
  id: string;
  type: 'redundancy' | 'clarity' | 'structure' | 'length';
  original: string;
  suggested: string;
  tokenSavings: number;
  description: string;
}

export interface AnalyticsData {
  tokenComparison: {
    modelId: string;
    modelName: string;
    inputTokens: number;
    outputTokens: number;
    color: string;
  }[];
  latencyComparison: {
    modelId: string;
    modelName: string;
    latency: number;
    color: string;
  }[];
  costComparison: {
    modelId: string;
    modelName: string;
    cost: number;
    color: string;
  }[];
  contextUsage: {
    modelId: string;
    modelName: string;
    used: number;
    available: number;
    percentage: number;
    color: string;
  }[];
  efficiencyScores: {
    modelId: string;
    modelName: string;
    score: number;
    color: string;
  }[];
  accuracyComparison: {
    modelId: string;
    modelName: string;
    accuracy: number;
    color: string;
  }[];
}

export interface CumulativeAnalytics {
  totalQueries: number;
  totalTokensUsed: number;
  totalCostIncurred: number;
  averageLatency: number;
  successRate: number;
  failureRate: number;
  modelUsageDistribution: {
    modelId: string;
    modelName: string;
    queryCount: number;
    percentage: number;
    color: string;
  }[];
  timeBasedTrends: {
    daily: {
      date: string;
      queries: number;
      tokens: number;
      cost: number;
      avgLatency: number;
    }[];
    weekly: {
      week: string;
      queries: number;
      tokens: number;
      cost: number;
      avgLatency: number;
    }[];
    monthly: {
      month: string;
      queries: number;
      tokens: number;
      cost: number;
      avgLatency: number;
    }[];
  };
  performanceMetrics: {
    totalInputTokens: number;
    totalOutputTokens: number;
    averageCostPerQuery: number;
    averageTokensPerQuery: number;
    peakLatency: number;
    minLatency: number;
  };
  modelMetrics: {
    modelId: string;
    modelName: string;
    inputTokens: number;
    outputTokens: number;
    avgLatency: number;
    accuracy: number;
    totalCost: number;
    color: string;
  }[];
}

export interface DecisionConfidence {
  score: number;
  level: 'low' | 'medium' | 'high';
  factors: {
    name: string;
    score: number;
    description: string;
  }[];
}

export interface DivergenceAnalysis {
  level: 'low' | 'medium' | 'high';
  score: number;
  details: string;
  modelComparisons: {
    model1: string;
    model2: string;
    similarity: number;
  }[];
}

export type ExecutionMode = 'fast' | 'cost-optimized' | 'quality-first' | 'long-context';

export interface ExecutionConfig {
  mode: ExecutionMode;
  selectedModels: string[];
  useHistory: boolean;
  maxBudget?: number;
  guardrailId?: string;
  evaluatorModel?: string;
}
