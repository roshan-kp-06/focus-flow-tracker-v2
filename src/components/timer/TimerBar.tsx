import { Play, Square, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TimerState, Project, TimerMode } from '@/types';
import { ProjectDropdown } from './ProjectDropdown';
import { cn } from '@/lib/utils';

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
  onStart,
  onPause,
  onResume,
  onStop,
}: TimerBarProps) {
  const handleDurationInput = (value: string) => {
    // Parse HH:MM:SS or MM:SS format
    const parts = value.split(':').map(p => parseInt(p) || 0);
    let totalSeconds = 0;
    if (parts.length === 3) {
      totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      totalSeconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
      totalSeconds = parts[0] * 60;
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
    <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Task Name */}
        <Input
          placeholder="What are you working on?"
          value={taskName}
          onChange={(e) => onTaskNameChange(e.target.value)}
          className="flex-1 border-0 shadow-none bg-transparent text-sm focus-visible:ring-0 placeholder:text-muted-foreground"
        />

        {/* Project Selector */}
        <ProjectDropdown
          projects={projects}
          selectedIds={selectedProjectIds}
          onSelectionChange={onProjectChange}
        />

        {/* Mode Toggle */}
        <div className="flex items-center border border-border rounded-md overflow-hidden">
          <button
            onClick={() => onModeChange('stopwatch')}
            disabled={state !== 'idle'}
            className={cn(
              'px-2.5 py-1.5 text-xs font-medium transition-colors',
              mode === 'stopwatch' 
                ? 'bg-muted text-foreground' 
                : 'text-muted-foreground hover:text-foreground',
              state !== 'idle' && 'opacity-50 cursor-not-allowed'
            )}
          >
            Stopwatch
          </button>
          <button
            onClick={() => onModeChange('countdown')}
            disabled={state !== 'idle'}
            className={cn(
              'px-2.5 py-1.5 text-xs font-medium transition-colors',
              mode === 'countdown' 
                ? 'bg-muted text-foreground' 
                : 'text-muted-foreground hover:text-foreground',
              state !== 'idle' && 'opacity-50 cursor-not-allowed'
            )}
          >
            Timer
          </button>
        </div>

        {/* Duration Input (countdown mode) or Timer Display */}
        <div className="w-28 text-center">
          {state === 'idle' && mode === 'countdown' ? (
            <Input
              defaultValue={formatDurationInput(duration)}
              onBlur={(e) => handleDurationInput(e.target.value)}
              className="text-center font-medium text-sm border-0 shadow-none bg-transparent focus-visible:ring-0"
              placeholder="00:25:00"
            />
          ) : (
            <span className={cn(
              'timer-display',
              state === 'running' && 'text-primary',
              state === 'paused' && 'text-muted-foreground'
            )}>
              {formattedTime}
            </span>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-1.5">
          {state === 'idle' && (
            <Button
              onClick={onStart}
              size="sm"
              className="gap-1.5 bg-primary hover:bg-primary/90"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Start
            </Button>
          )}
          
          {state === 'running' && (
            <>
              <Button
                onClick={onPause}
                size="sm"
                variant="outline"
                className="gap-1.5"
              >
                <Pause className="h-3.5 w-3.5" />
              </Button>
              <Button
                onClick={onStop}
                size="sm"
                variant="destructive"
                className="gap-1.5"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                Stop
              </Button>
            </>
          )}

          {state === 'paused' && (
            <>
              <Button
                onClick={onResume}
                size="sm"
                className="gap-1.5 bg-primary hover:bg-primary/90"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
              </Button>
              <Button
                onClick={onStop}
                size="sm"
                variant="destructive"
                className="gap-1.5"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                Stop
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
