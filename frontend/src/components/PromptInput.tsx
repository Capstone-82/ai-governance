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
  Check
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card ring-1 ring-primary/10 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-primary" />
      {/* Session Status */}
      <div className="px-5 py-3 border-b border-border bg-muted flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isNewSession ? (
            <>
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">New Session</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-sm font-semibold text-foreground">Continuing from History</span>
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                Token Optimized
              </Badge>
            </>
          )}
        </div>

      </div>

      {/* Prompt Area */}
      <div className="p-5">
        <div className="rounded-xl border border-border bg-card focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your prompt to compare across AI models..."
            className="min-h-[140px] resize-none border-0 bg-transparent focus-visible:ring-0 text-base text-foreground placeholder:text-muted-foreground px-4 py-3"
          />
        </div>
      </div>

      {/* Model Selection */}
      <div className="px-5 pb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">Select Models</p>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary text-white">
            {selectedModels.length} selected
          </span>
        </div>
        <div className="space-y-3">
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
              <div key={groupName} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
                    {groupName}
                  </h4>
                  <span className="text-[10px] text-muted-foreground">{groupModels.length} models</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {groupModels.map((model) => {
                    const isSelected = selectedModels.includes(model.id);
                    return (
                      <button
                        key={model.id}
                        onClick={() => onSelectModel(model.id)}
                        aria-pressed={isSelected}
                        className={cn(
                          "group relative flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          "outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                          isSelected
                            ? "bg-primary/10 text-foreground border-primary/40"
                            : "bg-card text-foreground border-border hover:border-primary/30 hover:bg-primary/5"
                        )}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/20"
                          style={{ backgroundColor: model.color }}
                        />
                        <span className="truncate">{model.name}</span>
                        {isSelected && <Check className="ml-auto h-4 w-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <div className="px-5 py-4 border-t border-border bg-muted flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Tip: Press Shift + Enter for a new line</p>


        <Button
          onClick={handleSubmit}
          disabled={!prompt.trim() || selectedModels.length === 0 || isExecuting}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
                Enter
              </kbd>
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
