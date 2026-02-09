import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Recommendation,
  PromptSuggestion,
  DecisionConfidence,
  DivergenceAnalysis,
  AnalyticsData,
  CumulativeAnalytics,
  ModelRun
} from '@/types/ai-platform';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Trophy, Layers, Lightbulb } from 'lucide-react';
import { AI_MODELS } from '@/data/models';




interface RecommendationsPanelProps {
  recommendations: Recommendation[];
  promptSuggestions: PromptSuggestion[];
  confidence: DecisionConfidence | null;
  divergence: DivergenceAnalysis | null;
  analytics?: AnalyticsData | null;
  cumulativeAnalytics?: CumulativeAnalytics | null;
  modelRuns?: ModelRun[];
}

export function RecommendationsPanel({
  recommendations,
  promptSuggestions,
  confidence,
  divergence,
  analytics,
  cumulativeAnalytics,
  modelRuns,
}: RecommendationsPanelProps) {

  const getComplexityColor = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('advanced')) return 'bg-red-500/20 text-red-500 hover:bg-red-500/30';
    if (lower.includes('mid-level') || lower.includes('mid level')) return 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30';
    return 'bg-green-500/20 text-green-500 hover:bg-green-500/30';
  };

  // Extract special insights (Category & Optimization) from the first model run that has them
  // (Since they are query-level properties, all runs likely have the same or similar values from the single evaluator call)
  const insightRun = modelRuns?.find(r => r.queryCategory || r.promptOptimization);
  const queryCategory = insightRun?.queryCategory;
  const optimizationTip = insightRun?.promptOptimization;

  const accuracyRanking = React.useMemo(() => {
    // Use ONLY current modelRuns, not historical analytics
    if (!modelRuns || modelRuns.length === 0) return [];

    // Calculate composite score for each model
    const rankedModels = modelRuns.map(run => {
      const accuracy = run.accuracy || 0;
      const cost = run.cost || 0;
      const latencyMs = run.latencyMs || 0;

      // Normalize values (0-100 scale)
      const accuracyScore = accuracy; // Already 0-100

      // Cost: Lower is better. Normalize to 0-100 (inverted)
      const maxCost = Math.max(...modelRuns.map(r => r.cost || 0));
      const costScore = maxCost > 0 ? ((maxCost - cost) / maxCost) * 100 : 100;

      // Latency: Lower is better. Normalize to 0-100 (inverted)
      const maxLatency = Math.max(...modelRuns.map(r => r.latencyMs || 0));
      const latencyScore = maxLatency > 0 ? ((maxLatency - latencyMs) / maxLatency) * 100 : 100;

      // Composite score: Weighted average
      // Accuracy: 60%, Latency: 30%, Cost: 10%
      const compositeScore = (accuracyScore * 0.6) + (latencyScore * 0.3) + (costScore * 0.1);

      return {
        modelId: run.modelId,
        modelName: run.modelId, // Will be replaced with actual name below
        accuracy: accuracy,
        cost: cost,
        latencyMs: latencyMs,
        compositeScore: compositeScore,
        color: '#888', // Will be replaced below
      };
    });

    // Get model details and sort by composite score
    const rankedWithDetails = rankedModels.map(model => {
      // Look up model in AI_MODELS
      const modelData = AI_MODELS.find(m => m.id === model.modelId);

      return {
        ...model,
        modelName: modelData?.name || model.modelId,
        color: modelData?.color || '#888',
        accuracyValue: model.accuracy,
      };
    }).sort((a, b) => b.compositeScore - a.compositeScore);

    return rankedWithDetails;
  }, [modelRuns]);

  const bestModel = accuracyRanking[0];
  const accuracyLabel = 'Ranked for this query';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >

      {/* Decision Confidence - Big Number Style */}


      {/* Divergence Analysis - Clean List Style */}


      {/* Model Recommendations */}


      {/* Query Classification */}
      {queryCategory && (
        <Card className="border border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Layers className="w-4 h-4 text-primary" />
              Query Complexity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge className={`text-sm px-3 py-1 border-0 ${getComplexityColor(queryCategory)}`}>
                {queryCategory}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Detected complexity level
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prompt Optimization from Evaluator */}
      {optimizationTip && (
        <Card className="border border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Evaluator Tip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                {optimizationTip}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Model Ranking - Current Query Only */}
      {accuracyRanking.length > 0 && bestModel && (
        <Card className="border border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Trophy className="w-4 h-4 text-primary" />
                Best Model for This Query
              </CardTitle>
              <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary">
                Current
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{accuracyLabel}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-primary/40 bg-primary/5 p-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: bestModel.color }}
                />
                <span className="text-sm font-semibold text-foreground">{bestModel.modelName}</span>
                <span className="ml-auto text-sm font-medium text-primary">
                  {bestModel.compositeScore.toFixed(1)}% overall
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Accuracy:</span>
                  <span className="ml-1 font-medium text-foreground">{bestModel.accuracy.toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="ml-1 font-medium text-foreground">${bestModel.cost.toFixed(5)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Latency:</span>
                  <span className="ml-1 font-medium text-foreground">{bestModel.latencyMs.toFixed(0)}ms</span>
                </div>
              </div>
              <Progress value={bestModel.compositeScore} size="xs" variant="info" className="mt-2" />
            </div>

            <div className="space-y-2">
              {accuracyRanking.map((model, index) => (
                <div key={model.modelId} className="rounded-lg border border-border bg-card p-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="h-5 w-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: model.color }}
                    />
                    <span className="font-medium text-foreground text-xs">{model.modelName}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {model.compositeScore.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                    <div>Acc: {model.accuracy.toFixed(0)}%</div>
                    <div>Cost: ${model.cost.toFixed(5)}</div>
                    <div>Lat: {model.latencyMs.toFixed(0)}ms</div>
                  </div>
                  <Progress value={model.compositeScore} size="xs" variant="info" className="mt-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {promptSuggestions.length > 0 && (
        <Card className="border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-4 h-4 text-primary" />
              Prompt Optimization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {promptSuggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 rounded-lg bg-muted border border-border"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">{suggestion.description}</p>
                    <p className="text-xs text-muted-foreground">{suggestion.suggested}</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-0 shrink-0">
                    ~{suggestion.tokenSavings} tokens
                  </Badge>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

    </motion.div>
  );
}
