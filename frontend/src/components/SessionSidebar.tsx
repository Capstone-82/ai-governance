import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Session } from '@/types/ai-platform';
import {
  Plus,
  MessageSquare,
  Sparkles,
  Clock,
  DollarSign,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 288 }}
      className="bg-sidebar border-r border-sidebar-border flex flex-col h-full relative group/sidebar"
    >
      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 h-6 w-6 rounded-full border border-border bg-background shadow-sm text-muted-foreground hover:text-foreground opacity-0 group-hover/sidebar:opacity-100 transition-opacity z-10"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <PanelLeftClose className="h-3 w-3" />}
      </Button>

      {/* Header */}
      <div className={cn("flex flex-col gap-4 p-4", isCollapsed && "items-center px-2")}>
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-info to-info/70 flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="text-sm font-semibold text-sidebar-foreground">AI Governance</h1>
              <p className="text-[10px] text-sidebar-foreground/60 font-medium">Enterprise Platform</p>
            </motion.div>
          )}
        </div>

        <div className={cn("flex flex-col gap-2 w-full", isCollapsed && "items-center")}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                onClick={onNewSession}
                className={cn(
                  "bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground border-sidebar-border shadow-sm",
                  isCollapsed ? "w-10 h-10 p-0 rounded-xl" : "w-full justify-start"
                )}
                variant="outline"
              >
                <Plus className={cn("w-4 h-4", !isCollapsed && "mr-2")} />
                {!isCollapsed && "New Session"}
              </Button>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">New Session</TooltipContent>}
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                onClick={() => navigate('/analytics')}
                className={cn(
                  "bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground border-sidebar-border shadow-sm",
                  isCollapsed ? "w-10 h-10 p-0 rounded-xl" : "w-full justify-start"
                )}
                variant="outline"
              >
                <BarChart3 className={cn("w-4 h-4", !isCollapsed && "mr-2")} />
                {!isCollapsed && "Overall Analytics"}
              </Button>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">Overall Analytics</TooltipContent>}
          </Tooltip>
        </div>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-1.5">
          {sessions.length === 0 ? (
            <div className={cn("text-center py-8", isCollapsed && "px-0")}>
              <div className="w-10 h-10 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <MessageSquare className="w-5 h-5 text-muted-foreground/40" />
              </div>
              {!isCollapsed && (
                <>
                  <p className="text-xs font-medium text-sidebar-foreground/60 mb-1">No sessions yet</p>
                  <p className="text-[10px] text-sidebar-foreground/40">Start a new session to begin</p>
                </>
              )}
            </div>
          ) : (
            sessions.map((session, index) => (
              <Tooltip key={session.id} delayDuration={0}>
                <TooltipTrigger asChild>
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onSelectSession(session)}
                    className={cn(
                      "group w-full text-left rounded-xl transition-all duration-200 border border-transparent",
                      isCollapsed ? "p-2 flex justify-center" : "px-3 py-2.5",
                      currentSession?.id === session.id
                        ? "bg-sidebar-accent border-sidebar-border/50 shadow-sm"
                        : "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                      <MessageSquare className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        currentSession?.id === session.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )} />

                      {!isCollapsed && (
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className={cn(
                            "text-sm font-medium truncate mb-0.5",
                            currentSession?.id === session.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                          )}>
                            {session.title}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                            <span className="flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(session.updatedAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-2.5 h-2.5" />
                              ${session.totalCost.toFixed(3)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="flex flex-col gap-1">
                    <p className="font-medium">{session.title}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
                      <span>${session.totalCost.toFixed(3)}</span>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className={cn("p-4 border-t border-sidebar-border", isCollapsed && "items-center flex justify-center")}>
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-sidebar-accent/50 text-xs text-sidebar-foreground/70">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span className="font-medium">System Operational</span>
          </div>
        ) : (
          <div className="h-2 w-2 rounded-full bg-success ring-4 ring-sidebar-accent/50" />
        )}
      </div>
    </motion.aside>
  );
}
