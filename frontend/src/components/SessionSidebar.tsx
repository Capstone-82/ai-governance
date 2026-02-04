import { useState } from 'react';
import { motion } from 'framer-motion';
import { Session } from '@/types/ai-platform';
import {
  Plus,
  MessageSquare,
  Sparkles,
  Clock,
  DollarSign,
  BarChart3,
  PanelLeftClose,
  ChevronRight,
  MoreHorizontal,
  Moon,
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SessionSidebarProps {
  sessions: Session[];
  currentSession: Session | null;
  onSelectSession: (session: Session) => void;
  onNewSession: () => void;
  onRenameSession?: (sessionId: string, title: string) => void;
}

export function SessionSidebar({
  sessions,
  currentSession,
  onSelectSession,
  onNewSession,
  onRenameSession,
}: SessionSidebarProps) {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isDark = (resolvedTheme || theme) === 'dark';
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const canRename = Boolean(onRenameSession);

  const startEditing = (session: Session) => {
    if (!canRename) return;
    setEditingSessionId(session.id);
    setEditingValue(session.title);
  };

  const commitEditing = () => {
    if (!editingSessionId) return;
    const nextTitle = editingValue.trim() || 'Untitled Session';
    if (onRenameSession) onRenameSession(editingSessionId, nextTitle);
    setEditingSessionId(null);
  };

  const cancelEditing = () => {
    setEditingSessionId(null);
    setEditingValue('');
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 288 }}
      className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col h-full relative group/sidebar"
    >
      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 h-6 w-6 rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground opacity-0 group-hover/sidebar:opacity-100 transition-opacity z-10"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <PanelLeftClose className="h-3 w-3" />}
      </Button>

      {/* Header */}
      <div className={cn("flex flex-col gap-4 p-4", isCollapsed && "items-center px-2")}>
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
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
                  "shadow-none bg-primary text-primary-foreground hover:bg-primary/90 border border-primary/30",
                  isCollapsed ? "w-10 h-10 p-0 rounded-xl" : "w-full justify-start"
                )}
                variant="default"
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
                  "bg-card text-foreground border-border shadow-none hover:text-primary hover:border-primary/30 hover:bg-primary/5",
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
              <div className="w-10 h-10 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
              </div>
              {!isCollapsed && (
                <>
                  <p className="text-xs font-medium text-muted-foreground mb-1">No sessions yet</p>
                  <p className="text-[10px] text-muted-foreground">Start a new session to begin</p>
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
                      "group w-full text-left rounded-xl transition-colors duration-200 border",
                      isCollapsed ? "p-2 flex justify-center" : "px-3 py-2.5",
                      currentSession?.id === session.id
                        ? "bg-primary/10 border-primary/30 relative before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:rounded-r before:bg-primary"
                        : "bg-transparent border-transparent hover:bg-muted"
                    )}
                  >
                    <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                      <MessageSquare className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        currentSession?.id === session.id ? "text-primary" : "text-muted-foreground"
                      )} />

                      {!isCollapsed && (
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              {canRename && editingSessionId === session.id ? (
                                <input
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      commitEditing();
                                    }
                                    if (e.key === 'Escape') {
                                      e.preventDefault();
                                      cancelEditing();
                                    }
                                  }}
                                  onBlur={commitEditing}
                                  className="w-full rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  autoFocus
                                />
                              ) : (
                                <p className={cn(
                                  "text-sm font-medium truncate mb-0.5",
                                  currentSession?.id === session.id ? "text-foreground" : "text-foreground"
                                )}>
                                  {session.title}
                                </p>
                              )}
                            </div>
                            {canRename && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={(e) => e.stopPropagation()}
                                      className="h-7 w-7 rounded-md border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center"
                                      aria-label="Session options"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" side="right">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditing(session);
                                      }}
                                    >
                                      Rename
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>
                          <div className={cn(
                            "flex items-center gap-3 text-[10px]",
                            currentSession?.id === session.id ? "text-muted-foreground" : "text-muted-foreground"
                          )}>
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
        <div className={cn("w-full flex", isCollapsed ? "flex-col items-center gap-2" : "flex-col gap-2")}>
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={cn(
              "w-full flex items-center justify-between rounded-lg border border-border bg-card px-2.5 py-2 text-xs text-foreground hover:bg-muted transition-colors",
              isCollapsed && "w-10 h-10 p-0 justify-center"
            )}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4 text-primary" /> : <Moon className="h-4 w-4 text-primary" />}
            {!isCollapsed && <span className="font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-30"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="font-medium">System Operational</span>
            </div>
          ) : (
            <div className="h-2 w-2 rounded-full bg-primary ring-4 ring-border" />
          )}
        </div>
      </div>
    </motion.aside>
  );
}
