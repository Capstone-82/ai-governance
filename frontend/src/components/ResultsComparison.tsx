import { motion } from 'framer-motion';
import { ModelRun } from '@/types/ai-platform';
import { getModelById } from '@/data/models';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  Clock, 
  Coins, 
  FileText, 
  ChevronDown,
  ChevronUp,
  Check,
  Copy
} from 'lucide-react';
import { useState } from 'react';

interface ModelResultCardProps {
  run: ModelRun;
  index: number;
  isRecommended?: boolean;
  recommendationType?: string;
}

export function ModelResultCard({ run, index, isRecommended, recommendationType }: ModelResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const model = getModelById(run.modelId);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(run.response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!model) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-200 hover:shadow-elevated",
        isRecommended && "ring-2 ring-success/50"
      )}>
        <CardHeader className="pb-2 space-y-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: model.color }}
              />
              <div>
                <h3 className="font-semibold text-foreground">{model.name}</h3>
                <p className="text-xs text-muted-foreground">{model.provider}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isRecommended && (
                <Badge className="bg-success-muted text-success border-0">
                  ✨ {recommendationType}
                </Badge>
              )}
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-md hover:bg-accent transition-colors"
                title="Copy response"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-sm">
              <Clock className="w-3.5 h-3.5 text-speed" />
              <span className="text-muted-foreground">{run.latencyMs}ms</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Coins className="w-3.5 h-3.5 text-cost" />
              <span className="text-muted-foreground">${run.cost.toFixed(5)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <FileText className="w-3.5 h-3.5 text-info" />
              <span className="text-muted-foreground">
                {run.inputTokens} → {run.outputTokens}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
                {run.contextUsage.toFixed(2)}% context
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Hide response
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Show response
              </>
            )}
          </button>
          
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <ScrollArea className="h-[200px] rounded-lg bg-muted/30 p-3">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                  {run.response}
                </pre>
              </ScrollArea>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ResultsComparisonProps {
  runs: ModelRun[];
  recommendedModelId?: string;
  recommendationType?: string;
}

export function ResultsComparison({ runs, recommendedModelId, recommendationType }: ResultsComparisonProps) {
  if (runs.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Model Responses</h2>
        <span className="text-sm text-muted-foreground">{runs.length} models compared</span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {runs.map((run, index) => (
          <ModelResultCard
            key={run.id}
            run={run}
            index={index}
            isRecommended={run.modelId === recommendedModelId}
            recommendationType={run.modelId === recommendedModelId ? recommendationType : undefined}
          />
        ))}
      </div>
    </div>
  );
}
