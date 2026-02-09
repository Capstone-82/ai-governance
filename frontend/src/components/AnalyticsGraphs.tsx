import { motion } from 'framer-motion';
import { AnalyticsData } from '@/types/ai-platform';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  // AreaChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend,
  Cell,
} from 'recharts';
import { Clock, Coins, FileText, Layers, Target } from 'lucide-react';

interface AnalyticsGraphsProps {
  data: AnalyticsData;
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

export function AnalyticsGraphs({ data }: AnalyticsGraphsProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Performance Analytics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Input Token Usage */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Input Token Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.tokenComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis
                    dataKey="modelName"
                    type="category"
                    width={120}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    interval={0}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="inputTokens" fill="hsl(var(--primary))" name="Input Tokens" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Output Token Usage */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Output Token Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.tokenComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis
                    dataKey="modelName"
                    type="category"
                    width={120}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    interval={0}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="outputTokens" fill="hsl(var(--primary))" fillOpacity={0.55} name="Output Tokens" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Accuracy Comparison */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Model Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.accuracyComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="modelName"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="accuracy" name="Accuracy (%)" radius={[4, 4, 0, 0]}>
                    {data.accuracyComparison.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Latency Comparison */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Response Latency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.latencyComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="modelName"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="latency" name="Latency (ms)" radius={[4, 4, 0, 0]}>
                    {data.latencyComparison.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cost Comparison */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" />
              Cost Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.costComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="modelName"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickFormatter={(value) => `$${value.toFixed(4)}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cost" name="Cost ($)" radius={[4, 4, 0, 0]}>
                    {data.costComparison.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Context Window Usage */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Context Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.contextUsage.map((item, index) => (
                <div key={item.modelId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{item.modelName}</span>
                    <span className="font-medium text-foreground">{item.percentage.toFixed(3)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, item.percentage * 100)}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
