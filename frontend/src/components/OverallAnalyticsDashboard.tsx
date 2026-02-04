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
} from 'recharts';
import {
  DollarSign,
  Clock,
  Users,
  CheckCircle,
  BarChart3,
  Zap,
} from 'lucide-react';

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

      {/* Token Usage Overview */}
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

      {/* Model Performance Analysis */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Model Performance Analysis
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className=" text-base">Token Consumption (Input vs Output)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.modelMetrics} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="modelName" type="category" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                    <Bar dataKey="inputTokens" stackId="a" name="Input Tokens" radius={[0, 0, 0, 4]}>
                      {data.modelMetrics.map((entry, index) => (
                        <Cell key={`cell-input-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                    <Bar dataKey="outputTokens" stackId="a" name="Output Tokens" radius={[0, 4, 4, 0]}>
                      {data.modelMetrics.map((entry, index) => (
                        <Cell key={`cell-output-${index}`} fill={entry.color} fillOpacity={0.6} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} domain={[0.8, 1]} />
                    <Tooltip content={<CustomTooltip />} />
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

          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Cost Distribution by Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.modelMetrics}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="modelName" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={formatCurrency} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                    <Bar dataKey="totalCost" name="Total Cost" radius={[4, 4, 0, 0]} barSize={40}>
                      {data.modelMetrics.map((entry, index) => (
                        <Cell key={`cell-cost-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
