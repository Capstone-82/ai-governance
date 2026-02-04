import { motion } from 'framer-motion';
import { Session } from '@/types/ai-platform';
import { Plus, MessageSquare, Sparkles, Clock, DollarSign, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface SessionSidebarProps {
  sessions: Session[];
  currentSession: Session | null;
  onSelectSession: (session: Session) => void;
  onNewSession: () => void;
}

export function SessionSidebar({ 
  sessions, 
  currentSession, 
  onSelectSession, 
  onNewSession 
}: SessionSidebarProps) {
  const navigate = useNavigate();

  return (
    <aside className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-info to-info/70 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        <div>
            <h1 className="text-sm font-semibold text-sidebar-foreground">AI Cloud Governance</h1>
            <p className="text-xs text-sidebar-foreground/60">Enterprise Platform</p>
          </div>
        </div>
        <Button 
          onClick={onNewSession}
          className="w-full bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground border-sidebar-border mb-2"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Session
        </Button>
        <Button 
          onClick={() => navigate('/analytics')}
          className="w-full bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground border-sidebar-border"
          variant="outline"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Overall Analytics
        </Button>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1 px-2 py-3">
        <div className="space-y-1">
          {sessions.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <MessageSquare className="w-8 h-8 mx-auto text-sidebar-foreground/30 mb-2" />
              <p className="text-xs text-sidebar-foreground/50">No sessions yet</p>
              <p className="text-xs text-sidebar-foreground/40">Start a new session to begin</p>
            </div>
          ) : (
            sessions.map((session, index) => (
              <motion.button
                key={session.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectSession(session)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200",
                  "hover:bg-sidebar-accent group",
                  currentSession?.id === session.id 
                    ? "bg-sidebar-accent border-l-2 border-sidebar-primary" 
                    : "bg-transparent"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      currentSession?.id === session.id 
                        ? "text-sidebar-primary" 
                        : "text-sidebar-foreground/90"
                    )}>
                      {session.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-sidebar-foreground/50 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {session.isTokenOptimized && (
                    <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-success/20 text-success">
                      Optimized
                    </span>
                  )}
                </div>
                
                {/* Session Stats */}
                <div className="flex items-center gap-3 mt-2 text-xs text-sidebar-foreground/40">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {session.messages.length}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    ${session.totalCost.toFixed(4)}
                  </span>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 text-xs text-sidebar-foreground/50">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span>All systems operational</span>
        </div>
      </div>
    </aside>
  );
}
