import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Recommendation,
  PromptSuggestion,
  DecisionConfidence,
  DivergenceAnalysis,
  AnalyticsData
} from '@/types/ai-platform';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Zap,
  DollarSign,
  Brain,
  BookOpen,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  GitCompareArrows
} from 'lucide-react';



interface RecommendationsPanelProps {
  recommendations: Recommendation[];
  promptSuggestions: PromptSuggestion[];
  confidence: DecisionConfidence | null;
  divergence: DivergenceAnalysis | null;
  analytics?: AnalyticsData | null;
}

const typeIcons: Record<string, React.ElementType> = {
  speed: Zap,
  cost: DollarSign,
  quality: Brain,
  context: BookOpen,
};

const typeColors: Record<string, string> = {
  speed: 'text-speed bg-info-muted',
  cost: 'text-cost bg-warning-muted',
  quality: 'text-quality bg-success-muted',
  context: 'text-context bg-purple-100 dark:bg-purple-900/30',
};

export function RecommendationsPanel({
  recommendations,
  promptSuggestions,
  confidence,
  divergence,

}: RecommendationsPanelProps) {
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


      {/* Prompt Suggestions */}
      {promptSuggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
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
                className="p-3 rounded-lg bg-warning-muted/50 border border-warning/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">{suggestion.description}</p>
                    <p className="text-xs text-muted-foreground">{suggestion.suggested}</p>
                  </div>
                  <Badge className="bg-success-muted text-success border-0 shrink-0">
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
