import { useState, useRef, useEffect } from 'react';
import { X, Pause, Play, Square, Timer, Hourglass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimerState, TimerMode, Project } from '@/types';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface FocusViewProps {
  taskName: string;
  onTaskNameChange: (name: string) => void;
  projectIds: string[];
  projects: Project[];
  mode: TimerMode;
  onModeChange: (mode: TimerMode) => void;
  formattedTime: string;
  state: TimerState;
  isOvertime: boolean;
  duration: number;
  onDurationChange: (duration: number) => void;
  elapsed: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onExit: () => void;
}

export function FocusView({
  taskName,
  onTaskNameChange,
  projectIds,
  projects,
  mode,
  onModeChange,
  formattedTime,
  state,
  isOvertime,
  duration,
  onDurationChange,
  elapsed,
  onStart,
  onPause,
  onResume,
  onStop,
  onExit,
}: FocusViewProps) {
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [durationInput, setDurationInput] = useState('');
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const durationInputRef = useRef<HTMLInputElement>(null);

  const getProjectById = (id: string) => projects.find(p => p.id === id);
  const selectedProject = projectIds.length > 0 ? getProjectById(projectIds[0]) : null;

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingDuration && durationInputRef.current) {
      durationInputRef.current.focus();
    }
  }, [isEditingDuration]);

  // Calculate progress for the circular indicator (only for countdown mode)
  const progress = mode === 'countdown' && duration > 0
    ? Math.min((elapsed / duration) * 100, 100)
    : 0;

  // Calculate the stroke dash for the progress ring
  const circumference = 2 * Math.PI * 140; // radius = 140
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const handleDurationSubmit = () => {
    const input = durationInput.toLowerCase().trim();
    let totalSeconds = 0;

    // Pattern: HH:MM:SS or HH:MM or MM
    const colonParts = input.split(':').map(p => parseInt(p) || 0);
    if (colonParts.length === 3) {
      totalSeconds = colonParts[0] * 3600 + colonParts[1] * 60 + colonParts[2];
    } else if (colonParts.length === 2) {
      totalSeconds = colonParts[0] * 3600 + colonParts[1] * 60;
    } else if (colonParts.length === 1 && !input.match(/[a-z]/)) {
      totalSeconds = colonParts[0] * 60;
    } else {
      let hours = 0;
      let minutes = 0;
      let seconds = 0;

      const hourMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/);
      if (hourMatch) hours = parseFloat(hourMatch[1]);

      const minMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)\b/);
      if (minMatch) minutes = parseFloat(minMatch[1]);

      const secMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\b/);
      if (secMatch) seconds = parseFloat(secMatch[1]);

      totalSeconds = Math.round(hours * 3600 + minutes * 60 + seconds);
    }

    if (totalSeconds > 0) {
      onDurationChange(totalSeconds);
    }
    setDurationInput('');
    setIsEditingDuration(false);
  };

  const formatDurationDisplay = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
          {state !== 'idle' && (
            <h1 className="text-xl font-semibold text-foreground">
              {taskName || 'Focus Session'}
            </h1>
          )}
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
          {/* Task Name Input - Only show when idle */}
          {state === 'idle' && (
            <input
              type="text"
              value={taskName}
              onChange={(e) => onTaskNameChange(e.target.value)}
              placeholder="What are you working on?"
              className="text-base text-foreground bg-muted/30 border border-border rounded-lg px-4 py-2.5 w-[320px] text-center focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground/60 transition-all mb-6"
            />
          )}

          {/* Mode Toggle - Only show when idle */}
          {state === 'idle' && (
            <div className="flex items-center border border-border rounded-lg overflow-hidden mb-8">
              <button
                onClick={() => onModeChange('stopwatch')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors',
                  mode === 'stopwatch'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Timer className="h-4 w-4" />
                Stopwatch
              </button>
              <button
                onClick={() => onModeChange('countdown')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors',
                  mode === 'countdown'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Hourglass className="h-4 w-4" />
                Timer
              </button>
            </div>
          )}

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
              {/* Progress circle (only for countdown when running/paused) */}
              {mode === 'countdown' && state !== 'idle' && (
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
              {state === 'idle' && mode === 'countdown' && isEditingDuration ? (
                <input
                  ref={durationInputRef}
                  type="text"
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  onBlur={handleDurationSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleDurationSubmit();
                    } else if (e.key === 'Escape') {
                      setDurationInput('');
                      setIsEditingDuration(false);
                    }
                  }}
                  placeholder="e.g. 2 hours, 1h 30m, 90"
                  className="text-5xl font-bold tabular-nums tracking-tight text-center bg-transparent border-b-2 border-primary focus:outline-none w-[280px] transition-colors placeholder:text-muted-foreground/50 placeholder:text-2xl"
                />
              ) : state === 'idle' && mode === 'countdown' ? (
                <button
                  onClick={() => setIsEditingDuration(true)}
                  className="text-6xl font-bold tabular-nums tracking-tight text-center hover:text-primary transition-colors cursor-text"
                >
                  {duration > 0 ? formatDurationDisplay(duration) : (
                    <span className="text-muted-foreground/50">00:00:00</span>
                  )}
                </button>
              ) : (
                <span
                  className={cn(
                    'text-6xl font-bold tabular-nums tracking-tight',
                    isOvertime && 'text-orange-500',
                    !isOvertime && state === 'running' && 'text-foreground',
                    !isOvertime && state === 'paused' && 'text-muted-foreground',
                    state === 'idle' && 'text-muted-foreground'
                  )}
                >
                  {isOvertime && '+'}
                  {formattedTime}
                </span>
              )}
              <span className="text-sm text-muted-foreground mt-2">
                {state === 'idle'
                  ? mode === 'countdown'
                    ? isEditingDuration ? 'Type duration and press Enter' : 'Click to set duration'
                    : 'Ready to start'
                  : mode === 'countdown'
                    ? isOvertime
                      ? 'Overtime'
                      : 'Time remaining'
                    : 'Time elapsed'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mt-8">
            {state === 'idle' && (
              <Button
                onClick={onStart}
                size="lg"
                className="h-14 px-8 rounded-full gap-2"
              >
                <Play className="h-5 w-5 fill-current" />
                Start Focus
              </Button>
            )}

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

            {state !== 'idle' && (
              <Popover open={showStopConfirm} onOpenChange={setShowStopConfirm}>
                <PopoverTrigger asChild>
                  <Button
                    variant="destructive"
                    size="lg"
                    className="h-14 w-14 rounded-full p-0"
                  >
                    <Square className="h-6 w-6 fill-current" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="center">
                  <p className="text-sm font-medium mb-2 text-center">Finish this task?</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8"
                      onClick={() => setShowStopConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 h-8"
                      onClick={() => {
                        onStop();
                        setShowStopConfirm(false);
                      }}
                    >
                      Finish
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Status */}
          <p className="text-sm text-muted-foreground mt-6">
            {state === 'idle'
              ? 'Configure your focus session above'
              : state === 'running'
                ? 'Focus in progress...'
                : 'Paused'}
          </p>
        </div>
      </div>
    </div>
  );
}
