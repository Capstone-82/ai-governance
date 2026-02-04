import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Layers, 
  BarChart3, 
  Lightbulb, 
  ArrowRight,
  Zap,
  Shield,
  TrendingUp
} from 'lucide-react';

interface WelcomeScreenProps {
  onStartSession: () => void;
}

const features = [
  {
    icon: Layers,
    title: 'Multi-Model Execution',
    description: 'Compare Claude, Gemini, GPT, and Bedrock responses side-by-side',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description: 'Token usage, latency, cost, and efficiency metrics at a glance',
  },
  {
    icon: Lightbulb,
    title: 'Smart Recommendations',
    description: 'AI-powered suggestions for model selection and prompt optimization',
  },
  {
    icon: TrendingUp,
    title: 'Decision Confidence',
    description: 'Measure response consistency and make informed choices',
  },
];

export function WelcomeScreen({ onStartSession }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl"
      >
        {/* Hero Badge */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
        >
          <Sparkles className="w-4 h-4" />
          Enterprise AI Platform
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight"
        >
          One Prompt.
          <br />
          <span className="text-muted-foreground">Every Model.</span>
          <br />
          <span className="text-primary">Optimal Decision.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto"
        >
          Execute prompts across leading AI models, analyze performance metrics, 
          and receive explainable recommendations for cost-effective decisions.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button 
            onClick={onStartSession}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base font-medium shadow-none"
          >
            Start New Session
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-primary" />
            <span>Enterprise-grade</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-primary" />
            <span>Real-time analytics</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-16 max-w-3xl w-full"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + index * 0.1 }}
            className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <feature.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
