import { useState } from 'react';
import { motion } from 'framer-motion';
import { AIModel, ExecutionMode } from '@/types/ai-platform';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Send,
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
        <p className="text-xs font-medium text-muted-foreground mb-3">Select Models</p>
        <div className="space-y-4">
          {['AWS Bedrock', 'GCP Vertex AI', 'OpenAI'].map((groupName) => {
            const groupModels = models.filter(m => {
              const p = m.provider;
              if (groupName === 'AWS Bedrock') return p === 'anthropic' || p === 'amazon';
              if (groupName === 'GCP Vertex AI') return p === 'google';
              if (groupName === 'OpenAI') return p === 'openai';
              return false;
            });

            if (groupModels.length === 0) return null;

            return (
              <div key={groupName}>
                <h4 className="text-[10px] items-center gap-1.5 font-bold text-muted-foreground/70 uppercase tracking-wider mb-2 flex">
                  {groupName}
                  <div className="h-px flex-1 bg-border/60" />
                </h4>
                <div className="flex flex-wrap gap-2">
                  {groupModels.map((model) => (
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
                        className="w-2 h-2 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/20"
                        style={{ backgroundColor: model.color }}
                      />
                      {model.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-end">


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
