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
  const [guardrailsEnabled, setGuardrailsEnabled] = useState(true);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [loadedMessages, setLoadedMessages] = useState<Message[]>([]);
  const [conversationTitle, setConversationTitle] = useState<string>('');
  const [loadedAnalytics, setLoadedAnalytics] = useState<typeof analytics>(null);

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
        });
      }, 0);
    } else {
      executePrompt(prompt, {
        mode,
        selectedModels,
        useHistory: currentSession.messages.length > 0,
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
      const analyticsData = {
        tokenComparison: latestRuns.map(run => {
          const model = getModelById(run.modelId);
          return {
            modelId: run.modelId,
            modelName: model?.name || run.modelId,
            inputTokens: run.inputTokens,
            outputTokens: run.outputTokens,
            color: model?.color || '#888',
          };
        }),
        latencyComparison: latestRuns.map(run => {
          const model = getModelById(run.modelId);
          return {
            modelId: run.modelId,
            modelName: model?.name || run.modelId,
            latency: run.latencyMs,
            color: model?.color || '#888',
          };
        }),
        costComparison: latestRuns.map(run => {
          const model = getModelById(run.modelId);
          return {
            modelId: run.modelId,
            modelName: model?.name || run.modelId,
            cost: run.cost,
            color: model?.color || '#888',
          };
        }),
        contextUsage: latestRuns.map(run => {
          const model = getModelById(run.modelId);
          return {
            modelId: run.modelId,
            modelName: model?.name || run.modelId,
            used: run.inputTokens + run.outputTokens,
            available: model?.contextWindow || 100000,
            percentage: run.contextUsage,
            color: model?.color || '#888',
          };
        }),
        efficiencyScores: latestRuns.map(run => {
          const model = getModelById(run.modelId);
          const score = Math.round((run.outputTokens / run.inputTokens) * (1000 / run.latencyMs) * (0.01 / run.cost) * 100);
          return {
            modelId: run.modelId,
            modelName: model?.name || run.modelId,
            score: Math.min(100, Math.max(0, score)),
            color: model?.color || '#888',
          };
        }),
        accuracyComparison: latestRuns.map(run => {
          const model = getModelById(run.modelId);
          return {
            modelId: run.modelId,
            modelName: model?.name || run.modelId,
            accuracy: run.accuracy || 0,
            color: model?.color || '#888',
          };
        }),
      };
      setLoadedAnalytics(analyticsData);
    } else {
      setLoadedAnalytics(null);
    }
  }, [loadedMessages, latestRuns]);

  const displayAnalytics = loadedAnalytics || analytics;

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
            {/* Removed session stats and shortcuts */}
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
                          recommendations={recommendations}
                          promptSuggestions={promptSuggestions}
                          confidence={confidence}
                          divergence={divergence}
                          analytics={analytics}
                          cumulativeAnalytics={cumulativeAnalytics}
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
