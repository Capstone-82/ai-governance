import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SessionSidebar } from '@/components/SessionSidebar';
import { PromptInput } from '@/components/PromptInput';
import { ResultsComparison } from '@/components/ResultsComparison';
import { AnalyticsGraphs } from '@/components/AnalyticsGraphs';

import { RecommendationsPanel } from '@/components/RecommendationsPanel';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { MessageHistory } from '@/components/MessageHistory';
import { useAIPlatform } from '@/hooks/useAIPlatform';
import { ExecutionMode } from '@/types/ai-platform';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Lightbulb, Layers, ShieldCheck } from 'lucide-react';

const Index = () => {
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
    createSession,
    renameSession,
    setCurrentSession,
    executePrompt,
    estimateCost,
    models,
  } = useAIPlatform();

  const [selectedModels, setSelectedModels] = useState<string[]>([
    'claude-3-5-sonnet',
    'gemini-2-flash',
    'gpt-4o',
  ]);
  const [guardrailsEnabled, setGuardrailsEnabled] = useState(true);

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

  // Get the latest model runs for display
  const latestRuns = currentSession?.messages
    .filter(m => m.role === 'assistant')
    .slice(-1)[0]?.modelRuns || [];

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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-pressed={guardrailsEnabled}
              onClick={() => setGuardrailsEnabled(prev => !prev)}
              className={
                guardrailsEnabled
                  ? "border-primary/30 bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-border text-muted-foreground hover:bg-muted"
              }
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              {guardrailsEnabled ? 'Guardrails On' : 'Guardrails Off'}
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <AnimatePresence mode="wait">
            {!currentSession ? (
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
