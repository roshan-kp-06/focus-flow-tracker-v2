import { Play, Square, Pause, Plus, Clock } from 'lucide-react';
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
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Task Name Input */}
        <div className="flex-1 flex items-center gap-3">
          <Input
            placeholder="What are you working on?"
            value={taskName}
            onChange={(e) => onTaskNameChange(e.target.value)}
            className="flex-1 border border-border rounded-lg bg-background text-sm h-10 px-4 focus-visible:ring-1 focus-visible:ring-primary placeholder:text-muted-foreground"
          />
        </div>

        {/* + Task Button */}
        <Button
          variant="outline"
          size="sm"
          className="h-10 gap-2 px-4 border-primary text-primary hover:bg-primary/5"
        >
          <Plus className="h-4 w-4" />
          Task
        </Button>

        {/* Project Selector */}
        <ProjectDropdown
          projects={projects}
          selectedIds={selectedProjectIds}
          onSelectionChange={onProjectChange}
        />

        {/* Timer Display */}
        <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {state === 'idle' && mode === 'countdown' ? (
            <Input
              defaultValue={formatDurationInput(duration)}
              onBlur={(e) => handleDurationInput(e.target.value)}
              className="w-24 text-center font-semibold text-sm border-0 shadow-none bg-transparent focus-visible:ring-0 p-0"
              placeholder="00:25:00"
            />
          ) : (
            <span className={cn(
              'font-semibold text-base tabular-nums min-w-[80px] text-center',
              state === 'running' && 'text-primary',
              state === 'paused' && 'text-muted-foreground'
            )}>
              {formattedTime}
            </span>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {state === 'idle' && (
            <Button
              onClick={onStart}
              size="sm"
              className="h-10 gap-2 px-5 bg-primary hover:bg-primary/90 rounded-full"
            >
              <Play className="h-4 w-4 fill-current" />
              Start
            </Button>
          )}

          {state === 'running' && (
            <>
              <Button
                onClick={onPause}
                size="sm"
                variant="outline"
                className="h-10 w-10 p-0 rounded-full"
              >
                <Pause className="h-4 w-4" />
              </Button>
              <Button
                onClick={onStop}
                size="sm"
                variant="destructive"
                className="h-10 gap-2 px-5 rounded-full"
              >
                <Square className="h-4 w-4 fill-current" />
                Stop
              </Button>
            </>
          )}

          {state === 'paused' && (
            <>
              <Button
                onClick={onResume}
                size="sm"
                className="h-10 gap-2 px-5 bg-primary hover:bg-primary/90 rounded-full"
              >
                <Play className="h-4 w-4 fill-current" />
                Resume
              </Button>
              <Button
                onClick={onStop}
                size="sm"
                variant="destructive"
                className="h-10 gap-2 px-5 rounded-full"
              >
                <Square className="h-4 w-4 fill-current" />
                Stop
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
