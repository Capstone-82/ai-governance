import { motion, AnimatePresence } from 'framer-motion';
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
  Copy,
  Sparkles
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
        "group overflow-hidden border transition-all duration-300",
        isRecommended ? "border-primary/40 bg-primary/5" : "hover:border-border",
        "bg-card"
      )}>
        <CardHeader className="p-4 space-y-0 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-2.5 h-2.5 rounded-full ring-4 ring-current/10"
                style={{ backgroundColor: model.color, color: model.color }}
              />
              <div>
                <h3 className="font-semibold text-sm leading-none mb-1">{model.name}</h3>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{model.provider}</p>
              </div>
            </div>
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Metrics using a Grid for better alignment */}
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-medium text-foreground/80">{run.latencyMs}ms</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Coins className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-medium text-foreground/80">${run.cost.toFixed(5)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs col-span-2">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                <span className="text-foreground/80">{run.inputTokens}</span> in · <span className="text-foreground/80">{run.outputTokens}</span> out
              </span>
            </div>
          </div>
        </CardHeader>

        {/* Integrated Response Toggle */}
        <div className="border-t border-border/50">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <span>Response</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-1">
                  <div className="bg-muted/30 rounded-lg p-3 text-sm leading-relaxed text-foreground/90 font-normal">
                    {run.response}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isRecommended && (
          <div className="absolute top-0 right-0 p-3">
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/15 border-0 flex gap-1 items-center px-2 py-0.5 text-[10px]">
              <Sparkles className="w-2.5 h-2.5" />
              {recommendationType}
            </Badge>
          </div>
        )}
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
