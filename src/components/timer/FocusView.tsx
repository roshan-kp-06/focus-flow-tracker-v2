import { X, Pause, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimerState, TimerMode, Project } from '@/types';
import { cn } from '@/lib/utils';

interface FocusViewProps {
  taskName: string;
  projectIds: string[];
  projects: Project[];
  mode: TimerMode;
  formattedTime: string;
  state: TimerState;
  isOvertime: boolean;
  duration: number;
  elapsed: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onExit: () => void;
}

export function FocusView({
  taskName,
  projectIds,
  projects,
  mode,
  formattedTime,
  state,
  isOvertime,
  duration,
  elapsed,
  onPause,
  onResume,
  onStop,
  onExit,
}: FocusViewProps) {
  const getProjectById = (id: string) => projects.find(p => p.id === id);
  const selectedProject = projectIds.length > 0 ? getProjectById(projectIds[0]) : null;

  // Calculate progress for the circular indicator (only for countdown mode)
  const progress = mode === 'countdown' && duration > 0
    ? Math.min((elapsed / duration) * 100, 100)
    : 0;

  // Calculate the stroke dash for the progress ring
  const circumference = 2 * Math.PI * 140; // radius = 140
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border">
        <div className="flex items-center gap-3">
          {selectedProject && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: `${selectedProject.color}18`,
                color: selectedProject.color,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: selectedProject.color }}
              />
              {selectedProject.name}
            </span>
          )}
          <h1 className="text-xl font-semibold text-foreground">
            {taskName || 'Focus Session'}
          </h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onExit}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          Exit Focus
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center">
          {/* Circular Timer */}
          <div className="relative w-[320px] h-[320px]">
            {/* Background circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="160"
                cy="160"
                r="140"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
              />
              {/* Progress circle (only for countdown) */}
              {mode === 'countdown' && (
                <circle
                  cx="160"
                  cy="160"
                  r="140"
                  fill="none"
                  stroke={isOvertime ? 'hsl(24, 95%, 53%)' : 'hsl(var(--primary))'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-linear"
                />
              )}
              {/* Stopwatch mode - just show a subtle indicator at top */}
              {mode === 'stopwatch' && state === 'running' && (
                <circle
                  cx="160"
                  cy="20"
                  r="4"
                  fill="hsl(var(--primary))"
                  className="animate-pulse"
                />
              )}
            </svg>

            {/* Timer Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={cn(
                  'text-6xl font-bold tabular-nums tracking-tight',
                  isOvertime && 'text-orange-500',
                  !isOvertime && state === 'running' && 'text-foreground',
                  !isOvertime && state === 'paused' && 'text-muted-foreground'
                )}
              >
                {isOvertime && '+'}
                {formattedTime}
              </span>
              <span className="text-sm text-muted-foreground mt-2">
                {mode === 'countdown'
                  ? isOvertime
                    ? 'Overtime'
                    : 'Time remaining'
                  : 'Time elapsed'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mt-8">
            {state === 'running' && (
              <Button
                onClick={onPause}
                variant="outline"
                size="lg"
                className="h-14 w-14 rounded-full p-0"
              >
                <Pause className="h-6 w-6" />
              </Button>
            )}

            {state === 'paused' && (
              <Button
                onClick={onResume}
                variant="outline"
                size="lg"
                className="h-14 w-14 rounded-full p-0"
              >
                <Play className="h-6 w-6" />
              </Button>
            )}

            <Button
              onClick={onStop}
              variant="destructive"
              size="lg"
              className="h-14 w-14 rounded-full p-0"
            >
              <Square className="h-6 w-6 fill-current" />
            </Button>
          </div>

          {/* Status */}
          <p className="text-sm text-muted-foreground mt-6">
            {state === 'running' ? 'Focus in progress...' : 'Paused'}
          </p>
        </div>
      </div>
    </div>
  );
}
