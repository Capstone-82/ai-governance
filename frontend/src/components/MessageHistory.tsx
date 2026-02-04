import { motion } from 'framer-motion';
import { useState } from 'react';
import { Message } from '@/types/ai-platform';
import { Clock, History, User, ChevronDown, ChevronUp } from 'lucide-react';

interface MessageHistoryProps {
  messages: Message[];
}

export function MessageHistory({ messages }: MessageHistoryProps) {
  if (messages.length === 0) return null;

  // Only show user messages in the history (responses are shown in ResultsComparison)
  const userMessages = messages.filter(m => m.role === 'user');
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setIsCollapsed(prev => !prev)}
        className="flex items-center justify-between w-full px-5 py-4 border-b border-border hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2 text-foreground">
          <History className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Conversation History</h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{userMessages.length} prompts</span>
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {!isCollapsed && (
        <div className="divide-y divide-border">
          {userMessages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="px-5 py-3 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span className="text-sm font-semibold text-foreground">You</span>
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{message.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
