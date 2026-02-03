import { motion } from 'framer-motion';
import { 
  Recommendation, 
  PromptSuggestion, 
  DecisionConfidence, 
  DivergenceAnalysis 
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
  GitCompareArrows,
  TrendingUp
} from 'lucide-react';

interface RecommendationsPanelProps {
  recommendations: Recommendation[];
  promptSuggestions: PromptSuggestion[];
  confidence: DecisionConfidence | null;
  divergence: DivergenceAnalysis | null;
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
      {/* Decision Confidence */}
      {confidence && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Decision Confidence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
                  confidence.level === 'high' ? 'bg-success-muted text-success' :
                  confidence.level === 'medium' ? 'bg-warning-muted text-warning' :
                  'bg-destructive/10 text-destructive'
                )}>
                  {confidence.score}
                </div>
                <div>
                  <p className="font-medium text-foreground capitalize">{confidence.level} Confidence</p>
                  <p className="text-xs text-muted-foreground">
                    {confidence.level === 'high' 
                      ? 'Results are consistent and reliable'
                      : confidence.level === 'medium'
                        ? 'Some variation detected'
                        : 'High variance - review recommended'}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {confidence.factors.map((factor, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{factor.name}</span>
                    <span className="font-medium text-foreground">{factor.score}%</span>
                  </div>
                  <Progress value={factor.score} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Divergence Analysis */}
      {divergence && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GitCompareArrows className="w-4 h-4 text-info" />
              Response Divergence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <Badge className={cn(
                "border-0",
                divergence.level === 'low' ? 'bg-success-muted text-success' :
                divergence.level === 'medium' ? 'bg-warning-muted text-warning' :
                'bg-destructive/10 text-destructive'
              )}>
                {divergence.level === 'low' ? (
                  <><CheckCircle2 className="w-3 h-3 mr-1" /> Low Divergence</>
                ) : divergence.level === 'medium' ? (
                  <><AlertTriangle className="w-3 h-3 mr-1" /> Medium Divergence</>
                ) : (
                  <><XCircle className="w-3 h-3 mr-1" /> High Divergence</>
                )}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{divergence.details}</p>
            <div className="space-y-2">
              {divergence.modelComparisons.slice(0, 3).map((comp, index) => (
                <div key={index} className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-muted/50">
                  <span className="text-muted-foreground">
                    {comp.model1} ↔ {comp.model2}
                  </span>
                  <span className={cn(
                    "font-medium",
                    comp.similarity >= 80 ? 'text-success' :
                    comp.similarity >= 60 ? 'text-warning' : 'text-destructive'
                  )}>
                    {comp.similarity}% similar
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Model Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-warning" />
              Model Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec, index) => {
              const Icon = typeIcons[rec.type] || Lightbulb;
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 rounded-lg border border-border bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      typeColors[rec.type]
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-medium text-sm text-foreground">{rec.title}</p>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {rec.metric}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{rec.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      )}

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
