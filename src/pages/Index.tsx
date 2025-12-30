import { useState, useEffect } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { useWorkSessions } from '@/hooks/useWorkSessions';
import { Sidebar } from '@/components/layout/Sidebar';
import { TimerBar } from '@/components/timer/TimerBar';
import { SessionList } from '@/components/timer/SessionList';
import { WeekStats } from '@/components/timer/WeekStats';
import { Settings } from '@/pages/Settings';
import { DailyChart } from '@/components/DailyChart';
import { ProjectBreakdown } from '@/components/ProjectBreakdown';
import { MonthSummary } from '@/components/MonthSummary';
import { WorkSession } from '@/types';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'timer' | 'reports' | 'settings'>('timer');
  const timer = useTimer();
  const sessions = useWorkSessions();

  // Refresh sessions when timer stops
  useEffect(() => {
    if (timer.config.state === 'idle') {
      sessions.refresh();
    }
  }, [timer.config.state]);

  const handleContinueSession = (session: WorkSession) => {
    timer.setTaskName(session.taskName);
    timer.setProjectIds(session.projectIds);
    timer.start();
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
              {/* Header with Week Stats */}
              <div className="flex items-center justify-end">
                <WeekStats weekTotal={sessions.getWeekTotal()} />
              </div>

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
                onStart={timer.start}
                onPause={timer.pause}
                onResume={timer.resume}
                onStop={timer.stop}
              />

              {/* Session List */}
              <SessionList
                sessions={sessions.sessions}
                projects={sessions.projects}
                weekTotal={sessions.getWeekTotal()}
                onDeleteSession={sessions.removeSession}
                onContinueSession={handleContinueSession}
              />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h1 className="text-xl font-semibold">Reports</h1>
              
              {/* Month Summary */}
              <MonthSummary
                monthTotal={sessions.getMonthTotal()}
                weekTotal={sessions.getWeekTotal()}
                sessionCount={sessions.getMonthSessions().length}
              />

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DailyChart data={sessions.getDailyBreakdown()} />
                <ProjectBreakdown
                  data={sessions.getProjectBreakdown()}
                  totalSeconds={sessions.getMonthTotal()}
                />
              </div>
            </div>
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
    </div>
  );
};

export default Index;
