import * as React from 'react';
import { motion } from 'framer-motion';
import { CumulativeAnalytics } from '@/types/ai-platform';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  DollarSign,
  Clock,
  Users,
  CheckCircle,
  BarChart3,
  Zap,
  Activity,
  Brain,
  TrendingUp,
  FileText,
  Trophy
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OverallAnalyticsDashboardProps {
  data: CumulativeAnalytics;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-sm p-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-muted-foreground">
            {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const formatCurrency = (value: number) => `$${value.toFixed(4)}`;
const formatNumber = (value: number) => value.toLocaleString();
const formatLatency = (value: number) => `${value.toFixed(0)}ms`;

export function OverallAnalyticsDashboard({ data }: OverallAnalyticsDashboardProps) {
  // Transform data for Complexity Charts (Group by Category)
  const complexityData = React.useMemo(() => {
    if (!data.complexityAnalysis) return [];

    const categories = Array.from(new Set(data.complexityAnalysis.map(i => i.queryCategory)));
    const models = Array.from(new Set(data.complexityAnalysis.map(i => i.modelName)));

    return categories.map(cat => {
      const items = data.complexityAnalysis.filter(i => i.queryCategory === cat);
      const row: any = { name: cat };
      items.forEach(item => {
        row[item.modelName] = item; // Store whole object to access different metrics
      });
      return row;
    });
  }, [data.complexityAnalysis]);

  const uniqueModels = React.useMemo(() => {
    if (!data.complexityAnalysis) return [];
    const map = new Map();
    data.complexityAnalysis.forEach(i => {
      if (!map.has(i.modelName)) {
        map.set(i.modelName, i.color);
      }
    });
    return Array.from(map.entries()).map(([name, color]) => ({ name, color }));
  }, [data.complexityAnalysis]);

  // Calculate top 3 models for each complexity level
  const topModelsByComplexity = React.useMemo(() => {
    if (!data.complexityAnalysis || data.complexityAnalysis.length === 0) return [];

    const categories = Array.from(new Set(data.complexityAnalysis.map(i => i.queryCategory)));

    return categories.map(category => {
      const modelsForCategory = data.complexityAnalysis.filter(i => i.queryCategory === category);

      // Filter out models with too few queries (less than 3 for statistical significance)
      const validModels = modelsForCategory.filter(m => m.requestCount >= 3);

      // If no models have enough data, show all but with warning
      const modelsToRank = validModels.length > 0 ? validModels : modelsForCategory;

      // Find global min/max for normalization across ALL models in this category
      const allAccuracies = modelsToRank.map(m => m.avgAccuracy || 0);
      const allCosts = modelsToRank.map(m => m.totalCost / (m.requestCount || 1));
      const allLatencies = modelsToRank.map(m => m.avgLatency || 0);

      const minAccuracy = Math.min(...allAccuracies);
      const maxAccuracy = Math.max(...allAccuracies);
      const minCost = Math.min(...allCosts);
      const maxCost = Math.max(...allCosts);
      const minLatency = Math.min(...allLatencies);
      const maxLatency = Math.max(...allLatencies);

      // Calculate composite score for each model
      const rankedModels = modelsToRank.map(model => {
        const accuracy = model.avgAccuracy || 0;
        const avgCost = model.totalCost / (model.requestCount || 1);
        const latency = model.avgLatency || 0;
        const queryCount = model.requestCount || 1;

        // Normalize to 0-100 scale using min-max normalization
        const accuracyScore = maxAccuracy > minAccuracy
          ? ((accuracy - minAccuracy) / (maxAccuracy - minAccuracy)) * 100
          : 100;

        // Cost: Lower is better (inverted normalization)
        const costScore = maxCost > minCost
          ? ((maxCost - avgCost) / (maxCost - minCost)) * 100
          : 100;

        // Latency: Lower is better (inverted normalization)
        const latencyScore = maxLatency > minLatency
          ? ((maxLatency - latency) / (maxLatency - minLatency)) * 100
          : 100;

        // Base composite score: Accuracy 60%, Latency 30%, Cost 10%
        const baseScore = (accuracyScore * 0.6) + (latencyScore * 0.3) + (costScore * 0.1);

        // Apply confidence penalty for low query counts
        // Use Wilson score interval approach: more queries = more confidence
        // Penalty factor: sqrt(queryCount) / sqrt(maxQueryCount)
        const maxQueryCount = Math.max(...modelsToRank.map(m => m.requestCount || 1));
        const confidenceFactor = Math.sqrt(queryCount) / Math.sqrt(maxQueryCount);

        // Final score with confidence weighting
        const finalScore = baseScore * (0.5 + (0.5 * confidenceFactor));

        return {
          modelName: model.modelName,
          color: model.color,
          accuracy: accuracy,
          avgCost: avgCost,
          latency: latency,
          requestCount: model.requestCount,
          compositeScore: finalScore,
          hasLowConfidence: queryCount < 5, // Flag for UI warning
        };
      }).sort((a, b) => b.compositeScore - a.compositeScore).slice(0, 3);

      return {
        category,
        topModels: rankedModels,
        hasInsufficientData: validModels.length === 0,
      };
    });
  }, [data.complexityAnalysis]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Overview</p>
        <h1 className="text-2xl font-semibold text-foreground">Overall Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Cumulative system performance and usage insights
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            System Overview
          </TabsTrigger>
          <TabsTrigger value="complexity" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Complexity Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">Total Queries</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <BarChart3 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{formatNumber(data.totalQueries)}</div>
                <p className="text-xs text-muted-foreground">
                  Processed across all models
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">Total Cost</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <DollarSign className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{formatCurrency(data.totalCostIncurred)}</div>
                <p className="text-xs text-muted-foreground">
                  Avg {formatCurrency(data.performanceMetrics.averageCostPerQuery)} per query
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">Avg Latency</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{formatLatency(data.averageLatency)}</div>
                <p className="text-xs text-muted-foreground">
                  Range: {formatLatency(data.performanceMetrics.minLatency)} - {formatLatency(data.performanceMetrics.peakLatency)}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">Success Rate</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{(data.successRate * 100).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {(data.failureRate * 100).toFixed(1)}% failure rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Token Usage & Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Token Usage Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Tokens</span>
                    <span className="font-semibold">{formatNumber(data.totalTokensUsed)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Input Tokens</span>
                    <span className="font-semibold">{formatNumber(data.performanceMetrics.totalInputTokens)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Output Tokens</span>
                    <span className="font-semibold">{formatNumber(data.performanceMetrics.totalOutputTokens)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg per Query</span>
                    <span className="font-semibold">{formatNumber(data.performanceMetrics.averageTokensPerQuery)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Model Usage Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.modelUsageDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="percentage"
                      >
                        {data.modelUsageDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-popover border border-border rounded-lg shadow-sm p-3">
                                <p className="text-sm font-medium text-foreground">{data.modelName}</p>
                                <p className="text-sm text-muted-foreground">
                                  Queries: <span className="font-medium text-foreground">{data.queryCount}</span>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Share: <span className="font-medium text-foreground">{data.percentage.toFixed(1)}%</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Token Usage detailed charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Input Token Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.modelMetrics} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={formatNumber} />
                      <YAxis dataKey="modelName" type="category" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-popover border border-border rounded-lg shadow-sm p-3">
                                <p className="text-sm font-medium text-foreground">{data.modelName}</p>
                                <p className="text-sm text-muted-foreground">
                                  Input Tokens: <span className="font-medium text-foreground">{formatNumber(data.inputTokens)}</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="inputTokens" name="Input Tokens" radius={[0, 4, 4, 0]} barSize={30}>
                        {data.modelMetrics.map((entry, index) => (
                          <Cell key={`cell-in-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Output Token Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.modelMetrics} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={formatNumber} />
                      <YAxis dataKey="modelName" type="category" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-popover border border-border rounded-lg shadow-sm p-3">
                                <p className="text-sm font-medium text-foreground">{data.modelName}</p>
                                <p className="text-sm text-muted-foreground">
                                  Output Tokens: <span className="font-medium text-foreground">{formatNumber(data.outputTokens)}</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="outputTokens" name="Output Tokens" radius={[0, 4, 4, 0]} barSize={30}>
                        {data.modelMetrics.map((entry, index) => (
                          <Cell key={`cell-out-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">Latency Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.modelMetrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="modelName" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={formatLatency} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="avgLatency" name="Avg Latency" radius={[4, 4, 0, 0]} barSize={40}>
                        {data.modelMetrics.map((entry, index) => (
                          <Cell key={`cell-lat-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">Model Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.modelMetrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="modelName" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `${val.toFixed(0)}%`} domain={[0, 100]} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-popover border border-border rounded-lg shadow-sm p-3">
                                <p className="text-sm font-medium text-foreground">{data.modelName}</p>
                                <p className="text-sm text-muted-foreground">
                                  Accuracy: <span className="font-medium text-foreground">{data.accuracy.toFixed(1)}%</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="accuracy" name="Accuracy" radius={[4, 4, 0, 0]} barSize={40}>
                        {data.modelMetrics.map((entry, index) => (
                          <Cell key={`cell-acc-${index}`} fill={entry.color} fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="complexity" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">

            {/* Top Models by Complexity Level */}
            {topModelsByComplexity.length > 0 && (
              <Card className="border border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    Recommended Models by Complexity Level
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Top 3 models ranked by composite score (Accuracy 60%, Latency 30%, Cost 10%)
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {topModelsByComplexity.map((complexityLevel) => (
                      <div key={complexityLevel.category} className="space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-border">
                          <Brain className="w-4 h-4 text-primary" />
                          <h3 className="font-semibold text-sm text-foreground">
                            {complexityLevel.category}
                          </h3>
                        </div>
                        <div className="space-y-2">
                          {complexityLevel.topModels.map((model, index) => (
                            <div
                              key={model.modelName}
                              className={`rounded-lg p-3 ${index === 0
                                ? 'border-2 border-primary/40 bg-primary/5'
                                : 'border border-border bg-card'
                                }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                                  {index + 1}
                                </span>
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: model.color }}
                                />
                                <span className="text-xs font-medium text-foreground truncate">
                                  {model.modelName}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-muted-foreground">Score:</span>
                                  <span className={`font-semibold ${index === 0 ? 'text-primary' : 'text-foreground'}`}>
                                    {model.compositeScore.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                                  <div className="flex flex-col">
                                    <span>Acc</span>
                                    <span className="font-medium text-foreground">{model.accuracy.toFixed(0)}%</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span>Lat</span>
                                    <span className="font-medium text-foreground">{model.latency.toFixed(0)}ms</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span>Cost</span>
                                    <span className="font-medium text-foreground">${model.avgCost.toFixed(4)}</span>
                                  </div>
                                </div>
                                <div className="text-[10px] mt-1 flex items-center gap-1">
                                  <span className={model.hasLowConfidence ? 'text-yellow-500' : 'text-muted-foreground'}>
                                    {model.requestCount} {model.requestCount === 1 ? 'query' : 'queries'}
                                  </span>
                                  {model.hasLowConfidence && (
                                    <span className="text-yellow-500" title="Low confidence: fewer than 5 queries">⚠</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Accuracy by Complexity */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Accuracy by Complexity Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={complexityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border border-border rounded-lg shadow-sm p-3">
                                <p className="text-sm font-medium text-foreground mb-2">{label}</p>
                                {payload.map((entry: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between gap-4 text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                      <span className="text-muted-foreground">{entry.name}:</span>
                                    </div>
                                    <span className="font-medium text-foreground">{entry.value?.toFixed(1)}%</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      {uniqueModels.map((model, index) => (
                        <Bar
                          key={model.name}
                          dataKey={(row) => row[model.name]?.avgAccuracy}
                          name={model.name}
                          fill={model.color}
                          radius={[4, 4, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Latency by Complexity */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Latency by Complexity Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={complexityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `${val}ms`} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border border-border rounded-lg shadow-sm p-3">
                                <p className="text-sm font-medium text-foreground mb-2">{label}</p>
                                {payload.map((entry: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between gap-4 text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                      <span className="text-muted-foreground">{entry.name}:</span>
                                    </div>
                                    <span className="font-medium text-foreground">{entry.value?.toFixed(0)}ms</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      {uniqueModels.map((model, index) => (
                        <Bar
                          key={model.name}
                          dataKey={(row) => row[model.name]?.avgLatency}
                          name={model.name}
                          fill={model.color}
                          radius={[4, 4, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Cost by Complexity */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Total Cost by Complexity Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={complexityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val.toFixed(3)}`} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border border-border rounded-lg shadow-sm p-3">
                                <p className="text-sm font-medium text-foreground mb-2">{label}</p>
                                {payload.map((entry: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between gap-4 text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                      <span className="text-muted-foreground">{entry.name}:</span>
                                    </div>
                                    <span className="font-medium text-foreground">${entry.value?.toFixed(5)}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      {uniqueModels.map((model, index) => (
                        <Bar
                          key={model.name}
                          dataKey={(row) => row[model.name]?.totalCost}
                          name={model.name}
                          fill={model.color}
                          radius={[4, 4, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
