import { useState } from 'react';
import { motion } from 'framer-motion';
import { AIModel, ExecutionMode } from '@/types/ai-platform';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Send, 
  Zap, 
  DollarSign, 
  Brain, 
  BookOpen,
  Loader2,
  Sparkles,
  Info
} from 'lucide-react';

interface PromptInputProps {
  models: AIModel[];
  selectedModels: string[];
  onSelectModel: (modelId: string) => void;
  onExecute: (prompt: string, mode: ExecutionMode) => void;
  isExecuting: boolean;
  estimatedCost: number;
  isNewSession: boolean;
}

const executionModes: { id: ExecutionMode; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'fast', label: 'Fast', icon: Zap, description: 'Prioritize speed' },
  { id: 'cost-optimized', label: 'Cost', icon: DollarSign, description: 'Minimize spend' },
  { id: 'quality-first', label: 'Quality', icon: Brain, description: 'Best reasoning' },
  { id: 'long-context', label: 'Context', icon: BookOpen, description: 'Large documents' },
];

export function PromptInput({
  models,
  selectedModels,
  onSelectModel,
  onExecute,
  isExecuting,
  estimatedCost,
  isNewSession,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<ExecutionMode>('fast');

  const handleSubmit = () => {
    if (prompt.trim() && selectedModels.length > 0 && !isExecuting) {
      onExecute(prompt, mode);
      setPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl shadow-card overflow-hidden"
    >
      {/* Session Status */}
      <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isNewSession ? (
            <>
              <Sparkles className="w-4 h-4 text-info" />
              <span className="text-sm font-medium text-foreground">New Session</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-sm font-medium text-foreground">Continuing from History</span>
              <Badge variant="secondary" className="text-xs bg-success-muted text-success">
                Token Optimized
              </Badge>
            </>
          )}
        </div>
        {estimatedCost > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Info className="w-3.5 h-3.5" />
            <span>Est. cost: <span className="font-medium text-foreground">${estimatedCost.toFixed(5)}</span></span>
          </div>
        )}
      </div>

      {/* Prompt Area */}
      <div className="p-4">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your prompt to compare across AI models..."
          className="min-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 text-base placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Model Selection */}
      <div className="px-4 pb-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">Select Models</p>
        <div className="flex flex-wrap gap-2">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => onSelectModel(model.id)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all duration-200",
                "border hover:shadow-sm",
                selectedModels.includes(model.id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: model.color }}
              />
              {model.name}
            </button>
          ))}
        </div>
      </div>

      {/* Execution Modes & Submit */}
      <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {executionModes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
                mode === m.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              title={m.description}
            >
              <m.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          ))}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!prompt.trim() || selectedModels.length === 0 || isExecuting}
          className="bg-primary hover:bg-primary/90"
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Execute
              <kbd className="ml-2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-primary-foreground/20 rounded">
                ⌘↵
              </kbd>
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
