import { motion } from 'framer-motion';
import { Message } from '@/types/ai-platform';
import { getModelById } from '@/data/models';
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageHistoryProps {
  messages: Message[];
}

export function MessageHistory({ messages }: MessageHistoryProps) {
  if (messages.length === 0) return null;

  // Only show user messages in the history (responses are shown in ResultsComparison)
  const userMessages = messages.filter(m => m.role === 'user');

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-sm font-medium text-muted-foreground">Conversation History</h3>
      <div className="space-y-3">
        {userMessages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">You</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{message.content}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
