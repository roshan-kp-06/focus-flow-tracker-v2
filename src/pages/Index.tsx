import { useState, useEffect } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { useWorkSessions } from '@/hooks/useWorkSessions';
import { Sidebar } from '@/components/layout/Sidebar';
import { TimerBar } from '@/components/timer/TimerBar';
import { SessionList } from '@/components/timer/SessionList';
import { WeekStats } from '@/components/timer/WeekStats';
import { FocusView } from '@/components/timer/FocusView';
import { Settings } from '@/pages/Settings';
import { Reports } from '@/pages/Reports';
import { WorkSession } from '@/types';
import { List, Calendar, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'list' | 'week' | 'day';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'timer' | 'reports' | 'settings'>('timer');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const timer = useTimer();
  const sessions = useWorkSessions();

  // Refresh sessions when timer stops
  useEffect(() => {
    if (timer.config.state === 'idle') {
      sessions.refresh();
    }
  }, [timer.config.state]);

  const handleStopAndExitFocus = () => {
    timer.stop();
    setIsFocusMode(false);
  };

  const handleContinueSession = (session: WorkSession) => {
    timer.setTaskName(session.taskName);
    timer.setProjectIds(session.projectIds);

    // Handle groupId for sub-sessions (Clockify-style grouping)
    if (session.groupId) {
      // Session already belongs to a group, use that groupId
      timer.setGroupId(session.groupId);
    } else {
      // Create a new groupId and update the existing session to use it
      const newGroupId = crypto.randomUUID();
      sessions.editSession(session.id, { groupId: newGroupId });
      timer.setGroupId(newGroupId);
    }
    // Don't auto-start - just populate the task info and let user configure & start
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {activeTab === 'timer' && (
            <div className="space-y-6">
              {/* Timer Bar */}
              <TimerBar
                taskName={timer.config.taskName}
                onTaskNameChange={timer.setTaskName}
                projects={sessions.projects}
                selectedProjectIds={timer.config.projectIds}
                onProjectChange={timer.setProjectIds}
                mode={timer.config.mode}
                onModeChange={timer.setMode}
                duration={timer.config.duration}
                onDurationChange={timer.setDuration}
                formattedTime={timer.formattedTime}
                state={timer.config.state}
                isOvertime={timer.isOvertime}
                notes={timer.notes}
                onNotesChange={timer.setNotes}
                onStart={timer.start}
                onPause={timer.pause}
                onResume={timer.resume}
                onStop={timer.stop}
                onEnterFocus={() => setIsFocusMode(true)}
                onDiscard={timer.discard}
              />

              {/* View Toggle & Week Stats */}
              <div className="flex items-center justify-between">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-card border border-border rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      viewMode === 'list'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <List className="h-4 w-4" />
                    List
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      viewMode === 'week'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Calendar className="h-4 w-4" />
                    Week
                  </button>
                  <button
                    onClick={() => setViewMode('day')}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      viewMode === 'day'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <CalendarDays className="h-4 w-4" />
                    Day
                  </button>
                </div>

                {/* Week Stats */}
                <WeekStats weekTotal={sessions.getWeekTotal()} />
              </div>

              {/* Session List */}
              <SessionList
                sessions={sessions.sessions}
                projects={sessions.projects}
                weekTotal={sessions.getWeekTotal()}
                onDeleteSession={sessions.removeSession}
                onContinueSession={handleContinueSession}
                onUpdateSession={sessions.editSession}
              />
            </div>
          )}

          {activeTab === 'reports' && (
            <Reports
              sessions={sessions.sessions}
              projects={sessions.projects}
            />
          )}

          {activeTab === 'settings' && (
            <Settings
              projects={sessions.projects}
              onCreateProject={sessions.createProject}
              onUpdateProject={sessions.editProject}
              onDeleteProject={sessions.removeProject}
            />
          )}
        </div>
      </main>

      {/* Focus View Overlay */}
      {isFocusMode && (
        <FocusView
          taskName={timer.config.taskName}
          onTaskNameChange={timer.setTaskName}
          projectIds={timer.config.projectIds}
          onProjectChange={timer.setProjectIds}
          projects={sessions.projects}
          mode={timer.config.mode}
          onModeChange={timer.setMode}
          formattedTime={timer.formattedTime}
          state={timer.config.state}
          isOvertime={timer.isOvertime}
          duration={timer.config.duration}
          onDurationChange={timer.setDuration}
          elapsed={timer.config.elapsed}
          notes={timer.notes}
          onNotesChange={timer.setNotes}
          onStart={timer.start}
          onPause={timer.pause}
          onResume={timer.resume}
          onStop={handleStopAndExitFocus}
          onExit={() => setIsFocusMode(false)}
        />
      )}
    </div>
  );
};

export default Index;
