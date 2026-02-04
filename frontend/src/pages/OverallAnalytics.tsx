import { motion } from 'framer-motion';
import { OverallAnalyticsDashboard } from '@/components/OverallAnalyticsDashboard';
import { useAIPlatform } from '@/hooks/useAIPlatform';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SessionSidebar } from '@/components/SessionSidebar';
import { useNavigate } from 'react-router-dom';

const OverallAnalytics = () => {
  const navigate = useNavigate();
  const {
    cumulativeAnalytics,
    sessions,
    currentSession,
    setCurrentSession,
    createSession,
    renameSession,
  } = useAIPlatform();

  const handleNewSession = () => {
    createSession();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SessionSidebar
        sessions={sessions}
        currentSession={currentSession}
        onSelectSession={(session) => {
          setCurrentSession(session);
          navigate('/');
        }}
        onNewSession={handleNewSession}
        onRenameSession={renameSession}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <OverallAnalyticsDashboard data={cumulativeAnalytics} />
            </motion.div>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
};

export default OverallAnalytics;
