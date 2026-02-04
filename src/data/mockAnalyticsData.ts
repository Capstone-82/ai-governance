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

  return {
    totalQueries,
    totalTokensUsed,
    totalCostIncurred,
    averageLatency,
    successRate: 0.967,
    failureRate: 0.033,
    modelUsageDistribution: [
      {
        modelId: 'claude-3-5-sonnet',
        modelName: 'Claude 3.5 Sonnet',
        queryCount: Math.round(totalQueries * 0.35),
        percentage: 35,
        color: 'hsl(var(--chart-1))',
      },
      {
        modelId: 'gpt-4o',
        modelName: 'GPT-4o',
        queryCount: Math.round(totalQueries * 0.28),
        percentage: 28,
        color: 'hsl(var(--chart-2))',
      },
      {
        modelId: 'gemini-2-flash',
        modelName: 'Gemini 2.0 Flash',
        queryCount: Math.round(totalQueries * 0.22),
        percentage: 22,
        color: 'hsl(var(--chart-3))',
      },
      {
        modelId: 'claude-3-haiku',
        modelName: 'Claude 3 Haiku',
        queryCount: Math.round(totalQueries * 0.15),
        percentage: 15,
        color: 'hsl(var(--chart-4))',
      },
    ],
    timeBasedTrends: {
      daily,
      weekly,
      monthly,
    },
    performanceMetrics: {
      totalInputTokens: Math.round(totalTokensUsed * 0.4),
      totalOutputTokens: Math.round(totalTokensUsed * 0.6),
      averageCostPerQuery: totalCostIncurred / totalQueries,
      averageTokensPerQuery: totalTokensUsed / totalQueries,
      peakLatency: 2850,
      minLatency: 680,
    },
  };
};