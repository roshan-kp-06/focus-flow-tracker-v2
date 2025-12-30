import { Play, Square, Pause, Clock, Timer, Hourglass, Check, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TimerState, Project, TimerMode } from '@/types';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface TimerBarProps {
  taskName: string;
  onTaskNameChange: (name: string) => void;
  projects: Project[];
  selectedProjectIds: string[];
  onProjectChange: (ids: string[]) => void;
  mode: TimerMode;
  onModeChange: (mode: TimerMode) => void;
  duration: number;
  onDurationChange: (duration: number) => void;
  formattedTime: string;
  state: TimerState;
  isOvertime?: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function TimerBar({
  taskName,
  onTaskNameChange,
  projects,
  selectedProjectIds,
  onProjectChange,
  mode,
  onModeChange,
  duration,
  onDurationChange,
  formattedTime,
  state,
  isOvertime = false,
  onStart,
  onPause,
  onResume,
  onStop,
}: TimerBarProps) {
  const getProjectById = (id: string) => projects.find(p => p.id === id);
  const selectedProject = selectedProjectIds.length > 0 ? getProjectById(selectedProjectIds[0]) : null;
  const handleDurationInput = (value: string) => {
    const input = value.toLowerCase().trim();
    let totalSeconds = 0;

    // Try parsing natural language formats
    // Match patterns like "2 hours", "2h", "90 minutes", "90m", "1h 30m", "1:30", "01:30:00"

    // Pattern: HH:MM:SS or HH:MM or MM
    const colonParts = input.split(':').map(p => parseInt(p) || 0);
    if (colonParts.length === 3) {
      totalSeconds = colonParts[0] * 3600 + colonParts[1] * 60 + colonParts[2];
    } else if (colonParts.length === 2) {
      totalSeconds = colonParts[0] * 3600 + colonParts[1] * 60; // Treat as HH:MM
    } else if (colonParts.length === 1 && !input.match(/[a-z]/)) {
      // Just a number - treat as minutes
      totalSeconds = colonParts[0] * 60;
    } else {
      // Try natural language parsing
      let hours = 0;
      let minutes = 0;
      let seconds = 0;

      // Match hours: "2 hours", "2h", "2 hr", "2hrs"
      const hourMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/);
      if (hourMatch) {
        hours = parseFloat(hourMatch[1]);
      }

      // Match minutes: "30 minutes", "30m", "30 min", "30mins"
      const minMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)\b/);
      if (minMatch) {
        minutes = parseFloat(minMatch[1]);
      }

      // Match seconds: "30 seconds", "30s", "30 sec", "30secs"
      const secMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\b/);
      if (secMatch) {
        seconds = parseFloat(secMatch[1]);
      }

      totalSeconds = Math.round(hours * 3600 + minutes * 60 + seconds);
    }

    if (totalSeconds > 0) {
      onDurationChange(totalSeconds);
    }
  };

  const formatDurationInput = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Task Name Input */}
        <Input
          placeholder="What are you working on?"
          value={taskName}
          onChange={(e) => onTaskNameChange(e.target.value)}
          className="flex-1 border border-border rounded-lg bg-background text-sm h-10 px-4 focus-visible:ring-1 focus-visible:ring-primary placeholder:text-muted-foreground"
        />

        {/* Project Selector */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm">
              {selectedProject ? (
                <>
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: selectedProject.color }}
                  />
                  <span className="font-medium">{selectedProject.name}</span>
                </>
              ) : (
                <>
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Project</span>
                </>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="start">
            <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">
              Select Project
            </div>
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  // Toggle: if already selected, deselect; otherwise select
                  if (selectedProjectIds.includes(project.id)) {
                    onProjectChange([]);
                  } else {
                    onProjectChange([project.id]);
                  }
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span className="flex-1 text-left">{project.name}</span>
                {selectedProjectIds.includes(project.id) && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Divider */}
        <div className="h-8 w-px bg-border" />

        {/* Mode Toggle */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => onModeChange('stopwatch')}
            disabled={state !== 'idle'}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
              mode === 'stopwatch'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              state !== 'idle' && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Timer className="h-3.5 w-3.5" />
            Stopwatch
          </button>
          <button
            onClick={() => onModeChange('countdown')}
            disabled={state !== 'idle'}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
              mode === 'countdown'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              state !== 'idle' && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Hourglass className="h-3.5 w-3.5" />
            Timer
          </button>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-border" />

        {/* Timer Display - Fixed width to prevent layout shift */}
        <div className="flex items-center gap-2 w-[120px]">
          <Clock className={cn("h-4 w-4 flex-shrink-0", isOvertime ? "text-orange-500" : "text-muted-foreground")} />
          {state === 'idle' && mode === 'countdown' ? (
            <input
              type="text"
              onBlur={(e) => handleDurationInput(e.target.value)}
              className="w-full text-center font-semibold text-base border border-transparent rounded-lg bg-transparent hover:bg-muted/50 focus:bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary tabular-nums px-2 py-1 transition-all cursor-pointer"
              placeholder="1h 30m"
            />
          ) : (
            <span className={cn(
              'font-semibold text-base tabular-nums w-full text-center',
              isOvertime && 'text-orange-500',
              !isOvertime && state === 'running' && 'text-primary',
              !isOvertime && state === 'paused' && 'text-muted-foreground'
            )}>
              {isOvertime && '+'}
              {formattedTime}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-border" />

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {state === 'idle' && (
            <Button
              onClick={onStart}
              className="h-10 gap-2 px-6 bg-primary hover:bg-primary/90 rounded-full"
            >
              <Play className="h-4 w-4 fill-current" />
              Start
            </Button>
          )}

          {state === 'running' && (
            <>
              <Button
                onClick={onPause}
                variant="outline"
                className="h-10 w-10 p-0 rounded-full"
              >
                <Pause className="h-4 w-4" />
              </Button>
              <Button
                onClick={onStop}
                variant="destructive"
                className="h-10 w-10 p-0 rounded-full"
              >
                <Square className="h-4 w-4 fill-current" />
              </Button>
            </>
          )}

          {state === 'paused' && (
            <>
              <Button
                onClick={onResume}
                variant="outline"
                className="h-10 w-10 p-0 rounded-full"
              >
                <Play className="h-4 w-4" />
              </Button>
              <Button
                onClick={onStop}
                variant="destructive"
                className="h-10 w-10 p-0 rounded-full"
              >
                <Square className="h-4 w-4 fill-current" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
