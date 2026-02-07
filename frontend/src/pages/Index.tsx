import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SessionSidebar } from '@/components/SessionSidebar';
import { PromptInput } from '@/components/PromptInput';
import { ResultsComparison } from '@/components/ResultsComparison';
import { AnalyticsGraphs } from '@/components/AnalyticsGraphs';

import { RecommendationsPanel } from '@/components/RecommendationsPanel';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { MessageHistory } from '@/components/MessageHistory';
import { useAIPlatform } from '@/hooks/useAIPlatform';
import { ExecutionMode, Message, ModelRun } from '@/types/ai-platform';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Lightbulb, Layers, ShieldCheck, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { getModelById } from '@/data/models';
import { GUARDRAILS } from '@/data/guardrails';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  generateAnalytics,
  generateRecommendations,
  generateConfidence,
  generateDivergence
} from '@/utils/analytics';

const Index = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('conversation');

  const {
    sessions,
    currentSession,
    isExecuting,
    recommendations,
    promptSuggestions,
    analytics,
    cumulativeAnalytics,
    confidence,
    divergence,
    governanceContext,
    setGovernanceContext,
    createSession,
    renameSession,
    setCurrentSession,
    executePrompt,
    estimateCost,
    models,
  } = useAIPlatform();

  const [selectedModels, setSelectedModels] = useState<string[]>([
    'anthropic.claude-3-5-sonnet-20240620-v1:0',
    'gemini-2.5-flash',
    'gpt-4o',
  ]);
  const [guardrailsEnabled, setGuardrailsEnabled] = useState(false);
  const [selectedGuardrail, setSelectedGuardrail] = useState<string>(GUARDRAILS[0].id);
  const [selectedEvaluator, setSelectedEvaluator] = useState<string>('gemini-2.5-pro');
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  const EVALUATOR_MODELS = [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Default)' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview' },
    { id: 'gpt-5.2', name: 'GPT-5.2' },
    { id: 'gpt-5-2025-08-07', name: 'GPT-5 (Aug 2025)' },
  ];
  const [loadedMessages, setLoadedMessages] = useState<Message[]>([]);
  const [conversationTitle, setConversationTitle] = useState<string>('');

  const [loadedInsights, setLoadedInsights] = useState<{
    analytics: typeof analytics;
    recommendations: typeof recommendations;
    confidence: typeof confidence;
    divergence: typeof divergence;
  }>({
    analytics: null,
    recommendations: [],
    confidence: null,
    divergence: null
  });

  // Load conversation from backend when conversation ID is in URL
  useEffect(() => {
    const loadConversation = async () => {
      if (!conversationId) {
        setLoadedMessages([]);
        setConversationTitle('');
        return;
      }

      setIsLoadingConversation(true);
      try {
        const conversation = await api.history.getConversation(conversationId);

        // Convert backend messages to frontend format
        // Backend: user msg, assistant msg (model1), assistant msg (model2), ...
        // Frontend: user msg, assistant msg with modelRuns[]
        const messages: Message[] = [];
        let currentModelRuns: ModelRun[] = [];

        conversation.messages.forEach((msg, index) => {
          if (msg.role === 'user') {
            // If we have accumulated model runs from previous assistant messages, add them first
            if (currentModelRuns.length > 0) {
              messages.push({
                id: `assistant-${messages.length}`,
                role: 'assistant',
                content: 'Multi-model response',
                timestamp: currentModelRuns[0].timestamp,
                modelRuns: currentModelRuns,
              });
              currentModelRuns = [];
            }

            // Add user message
            messages.push({
              id: msg.id,
              role: 'user',
              content: msg.content,
              timestamp: new Date(msg.created_at),
            });
          } else if (msg.role === 'assistant') {
            // Collect assistant messages as model runs
            // Telemetry is a single object, not an array
            if (msg.telemetry) {
              const tel = msg.telemetry;
              const model = getModelById(tel.model_id);
              currentModelRuns.push({
                id: tel.id,
                modelId: tel.model_id,
                response: msg.content, // Response text is in message.content
                inputTokens: tel.input_tokens,
                outputTokens: tel.output_tokens,
                latencyMs: tel.latency_ms,
                cost: tel.total_cost,
                contextUsage: model
                  ? ((tel.input_tokens + tel.output_tokens) / model.contextWindow) * 100
                  : 0,
                timestamp: new Date(tel.timestamp),
                status: 'completed',
                accuracy: tel.accuracy_score,
                accuracyRationale: tel.accuracy_rationale,
                queryCategory: tel.query_category,
                promptOptimization: tel.prompt_optimization,
              });
            }
          }
        });

        // Add any remaining model runs at the end
        if (currentModelRuns.length > 0) {
          messages.push({
            id: `assistant-${messages.length}`,
            role: 'assistant',
            content: 'Multi-model response',
            timestamp: currentModelRuns[0].timestamp,
            modelRuns: currentModelRuns,
          });
        }

        setLoadedMessages(messages);
        setConversationTitle(conversation.title);

        toast({
          title: 'Conversation Loaded',
          description: `Loaded "${conversation.title}" with ${messages.length / 2} queries`,
        });
      } catch (error) {
        console.error('Failed to load conversation:', error);
        toast({
          title: 'Error',
          description: 'Failed to load conversation',
          variant: 'destructive',
        });
        setLoadedMessages([]);
        setConversationTitle('');
      } finally {
        setIsLoadingConversation(false);
      }
    };

    loadConversation();
  }, [conversationId, toast]);

  const handleSelectModel = (modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleExecute = async (prompt: string, mode: ExecutionMode) => {
    if (!currentSession) {
      const session = createSession();
      // Wait for session to be set
      setTimeout(() => {
        executePrompt(prompt, {
          mode,
          selectedModels,
          useHistory: false,
          guardrailId: guardrailsEnabled ? selectedGuardrail : undefined,
          evaluatorModel: selectedEvaluator,
        });
      }, 0);
    } else {
      executePrompt(prompt, {
        mode,
        selectedModels,
        useHistory: currentSession.messages.length > 0,
        guardrailId: guardrailsEnabled ? selectedGuardrail : undefined,
        evaluatorModel: selectedEvaluator,
      });
    }
  };

  const handleNewSession = () => {
    createSession();
  };

  const estimatedCost = estimateCost(
    currentSession?.messages.length ? '' : 'Sample prompt for estimation',
    selectedModels
  );

  // Get the latest model runs for display (from loaded conversation or current session)
  const displayMessages = loadedMessages.length > 0 ? loadedMessages : (currentSession?.messages || []);
  const latestRuns = displayMessages
    .filter(m => m.role === 'assistant')
    .slice(-1)[0]?.modelRuns || [];

  // Generate analytics for loaded conversation
  useEffect(() => {
    if (loadedMessages.length > 0 && latestRuns.length > 0) {
      setLoadedInsights({
        analytics: generateAnalytics(latestRuns),
        recommendations: generateRecommendations(latestRuns),
        confidence: generateConfidence(latestRuns),
        divergence: generateDivergence(latestRuns)
      });
    } else {
      setLoadedInsights({
        analytics: null,
        recommendations: [],
        confidence: null,
        divergence: null
      });
    }
  }, [loadedMessages, latestRuns]);

  const displayAnalytics = loadedInsights.analytics || analytics;

  // Find recommended model
  const speedRecommendation = recommendations.find(r => r.type === 'speed');

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <SessionSidebar
        sessions={sessions}
        currentSession={currentSession}
        onSelectSession={setCurrentSession}
        onNewSession={handleNewSession}
        onRenameSession={renameSession}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-background/80 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-foreground">
              {currentSession ? currentSession.title : 'AI Cloud Governance'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="guardrail-toggle"
                checked={guardrailsEnabled}
                onCheckedChange={setGuardrailsEnabled}
              />
              <Label htmlFor="guardrail-toggle" className="text-sm font-medium">
                Guardrails
              </Label>
            </div>

            {guardrailsEnabled && (
              <Select
                value={selectedGuardrail}
                onValueChange={setSelectedGuardrail}
              >
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="Select Guardrail" />
                </SelectTrigger>
                <SelectContent>
                  {GUARDRAILS.map((g) => (
                    <SelectItem key={g.id} value={g.id} className="text-xs">
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="h-6 w-px bg-border mx-2" />

            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-muted-foreground">Judge:</Label>
              <Select
                value={selectedEvaluator}
                onValueChange={setSelectedEvaluator}
              >
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="Evaluator Model" />
                </SelectTrigger>
                <SelectContent>
                  {EVALUATOR_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <AnimatePresence mode="wait">
            {isLoadingConversation ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full"
              >
                <div className="text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading conversation...</p>
                </div>
              </motion.div>
            ) : conversationId && loadedMessages.length > 0 ? (
              <motion.div
                key="loaded-conversation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 space-y-6"
              >
                {/* Conversation Title */}
                <div className="border-b border-border pb-4">
                  <h2 className="text-2xl font-bold text-foreground">{conversationTitle}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Viewing historical conversation
                  </p>
                </div>

                {/* Message History */}
                <MessageHistory messages={loadedMessages} />

                {/* Analytics for loaded conversation */}
                {latestRuns.length > 0 && (
                  <div className="space-y-6">
                    <Tabs defaultValue="analytics" className="w-full">
                      <TabsList className="grid w-full max-w-lg grid-cols-3">
                        <TabsTrigger value="analytics" className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Analytics
                        </TabsTrigger>
                        <TabsTrigger value="results" className="flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          Results
                        </TabsTrigger>
                        <TabsTrigger value="insights" className="flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          Insights
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="analytics" className="mt-6">
                        {displayAnalytics && <AnalyticsGraphs data={displayAnalytics} />}
                      </TabsContent>

                      <TabsContent value="results" className="mt-6">
                        <ResultsComparison
                          runs={latestRuns}
                          recommendedModelId={speedRecommendation?.modelId}
                          recommendationType={speedRecommendation?.title}
                        />
                      </TabsContent>

                      <TabsContent value="insights" className="mt-6">
                        <div className="grid gap-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 border border-border rounded-lg">
                              <div className="text-sm text-muted-foreground mb-1">Total Cost</div>
                              <div className="text-2xl font-bold">
                                ${latestRuns.reduce((sum, run) => sum + run.cost, 0).toFixed(6)}
                              </div>
                            </div>
                            <div className="p-4 border border-border rounded-lg">
                              <div className="text-sm text-muted-foreground mb-1">Avg Latency</div>
                              <div className="text-2xl font-bold">
                                {Math.round(latestRuns.reduce((sum, run) => sum + run.latencyMs, 0) / latestRuns.length)}ms
                              </div>
                            </div>
                            <div className="p-4 border border-border rounded-lg">
                              <div className="text-sm text-muted-foreground mb-1">Avg Accuracy</div>
                              <div className="text-2xl font-bold">
                                {Math.round(latestRuns.reduce((sum, run) => sum + (run.accuracy || 0), 0) / latestRuns.length)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </motion.div>
            ) : !currentSession ? (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <WelcomeScreen onStartSession={handleNewSession} />
              </motion.div>
            ) : (
              <motion.div
                key="session"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 space-y-6"
              >
                {/* Message History */}
                {currentSession.messages.length > 0 && (
                  <MessageHistory messages={currentSession.messages} />
                )}

                {/* Prompt Input */}
                <PromptInput
                  models={models}
                  selectedModels={selectedModels}
                  onSelectModel={handleSelectModel}
                  onExecute={handleExecute}
                  isExecuting={isExecuting}
                  estimatedCost={estimatedCost}
                  isNewSession={currentSession.messages.length === 0}
                />

                {/* Results & Analytics */}
                {latestRuns.length > 0 && (
                  <div className="space-y-6">
                    <Tabs defaultValue="results" className="w-full">
                      <TabsList className="grid w-full max-w-lg grid-cols-4">
                        <TabsTrigger value="results" className="flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          Results
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Analytics
                        </TabsTrigger>

                        <TabsTrigger value="insights" className="flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          Insights
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="results" className="mt-6">
                        <ResultsComparison
                          runs={latestRuns}
                          recommendedModelId={speedRecommendation?.modelId}
                          recommendationType={speedRecommendation?.title}
                        />
                      </TabsContent>

                      <TabsContent value="analytics" className="mt-6">
                        {analytics && <AnalyticsGraphs data={analytics} />}
                      </TabsContent>



                      <TabsContent value="insights" className="mt-6">
                        <RecommendationsPanel
                          recommendations={loadedInsights.recommendations.length > 0 ? loadedInsights.recommendations : recommendations}
                          promptSuggestions={promptSuggestions}
                          confidence={loadedInsights.confidence || confidence}
                          divergence={loadedInsights.divergence || divergence}
                          analytics={loadedInsights.analytics || analytics}
                          cumulativeAnalytics={cumulativeAnalytics}
                          modelRuns={latestRuns}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                {/* Empty State for Active Session */}
                {latestRuns.length === 0 && currentSession.messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                      <Layers className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Ready to Compare
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Enter a prompt above and select the AI models you want to compare.
                      Results will appear here with detailed analytics.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </main>
    </div >
  );
};

export default Index;
