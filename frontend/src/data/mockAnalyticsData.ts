import { CumulativeAnalytics } from '@/types/ai-platform';

// Generate mock cumulative analytics data for demonstration
export const generateMockCumulativeAnalytics = (): CumulativeAnalytics => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Generate daily data for the last 30 days
  const daily = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const isToday = date.toDateString() === now.toDateString();
    const baseQueries = isToday ? 0 : 15 + Math.floor(Math.random() * 25); // Start today at 0 for real data
    const avgTokensPerQuery = 800 + Math.random() * 400; // 800-1200 tokens per query
    const avgLatency = 1200 + Math.random() * 800; // 1200-2000ms latency
    const avgCostPerQuery = 0.008 + Math.random() * 0.012; // $0.008-0.020 per query

    daily.push({
      date: date.toISOString().split('T')[0],
      queries: baseQueries,
      tokens: Math.round(baseQueries * avgTokensPerQuery),
      cost: baseQueries * avgCostPerQuery,
      avgLatency: Math.round(avgLatency),
    });
  }

  // Generate weekly aggregations
  const weekly = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = i * 7;
    const weekEnd = Math.min((i + 1) * 7, daily.length);
    const weekData = daily.slice(weekStart, weekEnd);

    weekly.push({
      week: `Week ${i + 1}`,
      queries: weekData.reduce((sum, day) => sum + day.queries, 0),
      tokens: weekData.reduce((sum, day) => sum + day.tokens, 0),
      cost: weekData.reduce((sum, day) => sum + day.cost, 0),
      avgLatency: Math.round(weekData.reduce((sum, day) => sum + day.avgLatency, 0) / weekData.length),
    });
  }

  // Generate monthly data (last 3 months)
  const monthly = [
    {
      month: '2025-12',
      queries: 450,
      tokens: 380000,
      cost: 4.2,
      avgLatency: 1450,
    },
    {
      month: '2026-01',
      queries: 520,
      tokens: 425000,
      cost: 4.8,
      avgLatency: 1380,
    },
    {
      month: '2026-02',
      queries: daily.reduce((sum, day) => sum + day.queries, 0),
      tokens: daily.reduce((sum, day) => sum + day.tokens, 0),
      cost: daily.reduce((sum, day) => sum + day.cost, 0),
      avgLatency: Math.round(daily.reduce((sum, day) => sum + day.avgLatency, 0) / daily.length),
    },
  ];

  const totalQueries = 1200 + daily.reduce((sum, day) => sum + day.queries, 0);
  const totalTokensUsed = 950000 + daily.reduce((sum, day) => sum + day.tokens, 0);
  const totalCostIncurred = 11.5 + daily.reduce((sum, day) => sum + day.cost, 0);
  const averageLatency = 1420;

  // Calculate model-wise metrics
  const models = [
    {
      id: 'claude-3-5-sonnet',
      name: 'Claude 3.5 Sonnet',
      share: 0.35,
      color: '#D97706',
      avgInTok: 850,
      avgOutTok: 450,
      avgLat: 1500,
      baseCost: 0.015,
      acc: 0.98
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      share: 0.28,
      color: '#10B981',
      avgInTok: 900,
      avgOutTok: 500,
      avgLat: 1450,
      baseCost: 0.018,
      acc: 0.97
    },
    {
      id: 'gemini-2-flash',
      name: 'Gemini 2.0 Flash',
      share: 0.22,
      color: '#4285F4',
      avgInTok: 1200,
      avgOutTok: 600,
      avgLat: 650,
      baseCost: 0.005,
      acc: 0.95
    },
    {
      id: 'claude-3-haiku',
      name: 'Claude 3 Haiku',
      share: 0.15,
      color: '#F59E0B',
      avgInTok: 800,
      avgOutTok: 400,
      avgLat: 700,
      baseCost: 0.004,
      acc: 0.94
    },
  ];

  const modelMetrics = models.map(m => {
    const qCount = Math.round(totalQueries * m.share);
    const inTokens = qCount * m.avgInTok;
    const outTokens = qCount * m.avgOutTok;
    return {
      modelId: m.id,
      modelName: m.name,
      queryCount: qCount,
      percentage: m.share * 100,
      color: m.color,
      inputTokens: inTokens,
      outputTokens: outTokens,
      avgLatency: m.avgLat,
      accuracy: m.acc,
      totalCost: qCount * m.baseCost
    };
  });

  // Re-calculate totals based on model metrics for consistency
  const refinedTotalTokens = modelMetrics.reduce((acc, m) => acc + m.inputTokens + m.outputTokens, 0);
  const refinedTotalCost = modelMetrics.reduce((acc, m) => acc + m.totalCost, 0);
  const refinedTotalInputTokens = modelMetrics.reduce((acc, m) => acc + m.inputTokens, 0);
  const refinedTotalOutputTokens = modelMetrics.reduce((acc, m) => acc + m.outputTokens, 0);

  return {
    totalQueries,
    totalTokensUsed: refinedTotalTokens,
    totalCostIncurred: refinedTotalCost,
    averageLatency,
    successRate: 0.967,
    failureRate: 0.033,
    modelUsageDistribution: modelMetrics.map(m => ({
      modelId: m.modelId,
      modelName: m.modelName,
      queryCount: m.queryCount,
      percentage: m.percentage,
      color: m.color
    })),
    modelMetrics: modelMetrics.map(m => ({
      modelId: m.modelId,
      modelName: m.modelName,
      inputTokens: m.inputTokens,
      outputTokens: m.outputTokens,
      avgLatency: m.avgLatency,
      accuracy: m.accuracy,
      totalCost: m.totalCost,
      color: m.color
    })),
    timeBasedTrends: {
      daily,
      weekly,
      monthly,
    },
    performanceMetrics: {
      totalInputTokens: refinedTotalInputTokens,
      totalOutputTokens: refinedTotalOutputTokens,
      averageCostPerQuery: refinedTotalCost / totalQueries,
      averageTokensPerQuery: refinedTotalTokens / totalQueries,
      peakLatency: 2850,
      minLatency: 680,
    },
  };
};