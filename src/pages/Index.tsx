import { useState, useEffect } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { useWorkSessions } from '@/hooks/useWorkSessions';
import { Navigation } from '@/components/Navigation';
import { TimerDisplay } from '@/components/TimerDisplay';
import { TimerControls } from '@/components/TimerControls';
import { ModeSelector } from '@/components/ModeSelector';
import { DurationPicker } from '@/components/DurationPicker';
import { TaskInput } from '@/components/TaskInput';
import { ProjectSelector } from '@/components/ProjectSelector';
import { TodayStats } from '@/components/TodayStats';
import { DailyChart } from '@/components/DailyChart';
import { ProjectBreakdown } from '@/components/ProjectBreakdown';
import { SessionHistory } from '@/components/SessionHistory';
import { MonthSummary } from '@/components/MonthSummary';
import { Focus } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'timer' | 'reports'>('timer');
  const timer = useTimer();
  const sessions = useWorkSessions();

  // Refresh sessions when timer stops
  useEffect(() => {
    if (timer.config.state === 'idle') {
      sessions.refresh();
    }
  }, [timer.config.state]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Focus className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-semibold text-foreground">DeepWork</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 pt-24 pb-28">
        {activeTab === 'timer' ? (
          <div className="space-y-8 animate-fade-in">
            {/* Timer Card */}
            <div className="glass-card rounded-2xl p-6 md:p-10">
              <div className="space-y-8">
                {/* Mode Selector */}
                <div className="flex justify-center">
                  <ModeSelector
                    mode={timer.config.mode}
                    onModeChange={timer.setMode}
                    disabled={timer.config.state !== 'idle'}
                  />
                </div>

                {/* Duration Picker (Countdown only) */}
                {timer.config.mode === 'countdown' && timer.config.state === 'idle' && (
                  <DurationPicker
                    duration={timer.config.duration}
                    onDurationChange={timer.setDuration}
                    disabled={timer.config.state !== 'idle'}
                  />
                )}

                {/* Timer Display */}
                <TimerDisplay
                  time={timer.formattedTime}
                  state={timer.config.state}
                />

                {/* Timer Controls */}
                <TimerControls
                  state={timer.config.state}
                  onStart={timer.start}
                  onPause={timer.pause}
                  onResume={timer.resume}
                  onStop={timer.stop}
                  onReset={timer.reset}
                  hasElapsed={timer.config.elapsed > 0}
                />

                {/* Task & Project Selection */}
                <div className="pt-6 border-t border-border/50 space-y-4">
                  <TaskInput
                    value={timer.config.taskName}
                    onChange={timer.setTaskName}
                  />
                  <ProjectSelector
                    projects={sessions.projects}
                    selectedIds={timer.config.projectIds}
                    onSelectionChange={timer.setProjectIds}
                    onCreateProject={sessions.createProject}
                  />
                </div>
              </div>
            </div>

            {/* Today's Stats */}
            <TodayStats
              todayTotal={sessions.getTodayTotal()}
              weekTotal={sessions.getWeekTotal()}
              formatDuration={formatDuration}
            />
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
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

            {/* Session History */}
            <SessionHistory
              sessions={sessions.sessions}
              projects={sessions.projects}
              onDeleteSession={sessions.removeSession}
            />
          </div>
        )}
      </main>

      {/* Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
