import { AIModel } from '@/types/ai-platform';

export const AI_MODELS: AIModel[] = [
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Most intelligent model, best for complex reasoning',
    contextWindow: 200000,
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
    avgLatency: 2500,
    capabilities: ['reasoning', 'code', 'analysis', 'creative'],
    color: '#D97706',
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    description: 'Fastest Claude model, great for simple tasks',
    contextWindow: 200000,
    inputCostPer1k: 0.00025,
    outputCostPer1k: 0.00125,
    avgLatency: 800,
    capabilities: ['speed', 'simple-tasks', 'classification'],
    color: '#F59E0B',
  },
  {
    id: 'gemini-2-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    description: 'Fast and efficient multimodal model',
    contextWindow: 1000000,
    inputCostPer1k: 0.0001,
    outputCostPer1k: 0.0004,
    avgLatency: 600,
    capabilities: ['multimodal', 'speed', 'long-context'],
    color: '#4285F4',
  },
  {
    id: 'gemini-2-pro',
    name: 'Gemini 2.0 Pro',
    provider: 'google',
    description: 'Best for complex reasoning and coding',
    contextWindow: 2000000,
    inputCostPer1k: 0.00125,
    outputCostPer1k: 0.005,
    avgLatency: 2000,
    capabilities: ['reasoning', 'code', 'long-context', 'multimodal'],
    color: '#34A853',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'OpenAI flagship model, balanced performance',
    contextWindow: 128000,
    inputCostPer1k: 0.0025,
    outputCostPer1k: 0.01,
    avgLatency: 1800,
    capabilities: ['reasoning', 'code', 'creative', 'vision'],
    color: '#10B981',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Cost-effective for straightforward tasks',
    contextWindow: 128000,
    inputCostPer1k: 0.00015,
    outputCostPer1k: 0.0006,
    avgLatency: 700,
    capabilities: ['speed', 'cost-effective', 'simple-tasks'],
    color: '#059669',
  },
  {
    id: 'claude-bedrock',
    name: 'Claude (Bedrock)',
    provider: 'amazon',
    description: 'Claude via AWS Bedrock integration',
    contextWindow: 200000,
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
    avgLatency: 2800,
    capabilities: ['aws-native', 'reasoning', 'enterprise'],
    color: '#FF9900',
  },
];

export const getModelById = (id: string): AIModel | undefined => {
  return AI_MODELS.find(model => model.id === id);
};

export const getModelsByProvider = (provider: string): AIModel[] => {
  return AI_MODELS.filter(model => model.provider === provider);
};
