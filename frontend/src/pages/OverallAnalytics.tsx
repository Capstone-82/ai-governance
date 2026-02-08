import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { OverallAnalyticsDashboard } from '@/components/OverallAnalyticsDashboard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SessionSidebar } from '@/components/SessionSidebar';
import { useNavigate } from 'react-router-dom';
import { useAIPlatform } from '@/hooks/useAIPlatform';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { CumulativeAnalytics } from '@/types/ai-platform';
import { getModelById } from '@/data/models';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const OverallAnalytics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    sessions,
    currentSession,
    setCurrentSession,
    createSession,
    renameSession,
  } = useAIPlatform();

  const [analyticsData, setAnalyticsData] = useState<CumulativeAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // Fetch all analytics data from backend
      const [modelPerformance, summary, complexityAnalysis] = await Promise.all([
        api.analytics.getModelPerformance(),
        api.analytics.getSummary(),
        api.analytics.getComplexityAnalysis(),
      ]);

      // Transform backend data to frontend format
      const modelMetrics = modelPerformance.map(perf => {
        const model = getModelById(perf.model_id);
        return {
          modelId: perf.model_id,
          modelName: model?.name || perf.model_id,
          inputTokens: perf.avg_input_tokens * perf.total_requests,
          outputTokens: perf.avg_output_tokens * perf.total_requests,
          avgLatency: perf.avg_latency_ms,
          accuracy: perf.avg_accuracy, // Already 0-100 from backend
          totalCost: perf.total_cost,
          color: model?.color || '#888',
        };
      });

      const complexityMetrics = complexityAnalysis.map(perf => {
        const model = getModelById(perf.model_id);
        return {
          queryCategory: perf.query_category,
          modelId: perf.model_id,
          modelName: model?.name || perf.model_id,
          requestCount: perf.request_count,
          avgAccuracy: perf.avg_accuracy,
          avgLatency: perf.avg_latency_ms,
          totalCost: perf.total_cost,
          color: model?.color || '#888',
        };
      }).sort((a, b) => a.queryCategory.localeCompare(b.queryCategory)); // Sort by category to group them visually

      // Calculate model usage distribution
      const totalRequests = modelPerformance.reduce((sum, m) => sum + m.total_requests, 0);
      const modelUsageDistribution = modelPerformance.map(perf => {
        const model = getModelById(perf.model_id);
        return {
          modelId: perf.model_id,
          modelName: model?.name || perf.model_id,
          queryCount: perf.total_requests,
          percentage: totalRequests > 0 ? (perf.total_requests / totalRequests) * 100 : 0,
          color: model?.color || '#888',
        };
      });

      // Calculate totals
      const totalInputTokens = modelPerformance.reduce(
        (sum, m) => sum + m.avg_input_tokens * m.total_requests,
        0
      );
      const totalOutputTokens = modelPerformance.reduce(
        (sum, m) => sum + m.avg_output_tokens * m.total_requests,
        0
      );
      const totalTokens = totalInputTokens + totalOutputTokens;

      const cumulativeData: CumulativeAnalytics = {
        totalQueries: summary.total_requests,
        totalTokensUsed: totalTokens,
        totalCostIncurred: summary.total_cost,
        averageLatency: summary.avg_latency_ms,
        successRate: 1.0, // Assuming all completed requests are successful
        failureRate: 0.0,
        modelUsageDistribution,
        timeBasedTrends: {
          daily: [],
          weekly: [],
          monthly: [],
        },
        performanceMetrics: {
          totalInputTokens,
          totalOutputTokens,
          averageCostPerQuery: totalRequests > 0 ? summary.total_cost / totalRequests : 0,
          averageTokensPerQuery: totalRequests > 0 ? totalTokens / totalRequests : 0,
          peakLatency: Math.max(...modelPerformance.map(m => m.avg_latency_ms)),
          minLatency: Math.min(...modelPerformance.map(m => m.avg_latency_ms)),
        },
        modelMetrics,
        complexityAnalysis: complexityMetrics,
      };

      setAnalyticsData(cumulativeData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = () => {
    createSession();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SessionSidebar
        sessions={sessions}
        currentSession={currentSession}
        onSelectSession={(session) => {
          setCurrentSession(session);
          navigate('/');
        }}
        onNewSession={handleNewSession}
        onRenameSession={renameSession}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Refresh Button */}
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Overall Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time metrics from all conversations
            </p>
          </div>
          <Button
            onClick={fetchAnalytics}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <BarChart3 className={cn("h-4 w-4", isLoading && "animate-spin")} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {isLoading ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-32" />
                    ))}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                  </div>
                </div>
              ) : analyticsData ? (
                <OverallAnalyticsDashboard data={analyticsData} />
              ) : (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">No analytics data available</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Run some queries to see analytics
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
};

export default OverallAnalytics;
