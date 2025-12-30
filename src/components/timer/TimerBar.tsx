import { useState, useRef, useEffect } from 'react';
import { Play, Square, Pause, Clock, Timer, Hourglass, Check, FolderOpen, Maximize2, MoreVertical, Trash2, StickyNote, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TimerState, Project, TimerMode } from '@/types';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RichTextEditor } from '@/components/notes/RichTextEditor';

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
  notes: string;
  onNotesChange: (notes: string) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onEnterFocus?: () => void;
  onDiscard?: () => void;
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
  notes,
  onNotesChange,
  onStart,
  onPause,
  onResume,
  onStop,
  onEnterFocus,
  onDiscard,
}: TimerBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [durationInput, setDurationInput] = useState('');
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const durationInputRef = useRef<HTMLInputElement>(null);

  const getProjectById = (id: string) => projects.find(p => p.id === id);
  const selectedProject = selectedProjectIds.length > 0 ? getProjectById(selectedProjectIds[0]) : null;

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingDuration && durationInputRef.current) {
      durationInputRef.current.focus();
    }
  }, [isEditingDuration]);

  const handleDurationSubmit = () => {
    const input = durationInput.toLowerCase().trim();
    let totalSeconds = 0;

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
    <div className="space-y-4">
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

        {/* Focus View Button */}
        {onEnterFocus && (
          <button
            onClick={onEnterFocus}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm text-muted-foreground hover:text-foreground"
          >
            <Maximize2 className="h-4 w-4" />
            <span>Focus</span>
          </button>
        )}

        {/* Notes Button */}
        <button
          onClick={() => setShowNotesPanel(!showNotesPanel)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border border-border transition-colors text-sm",
            showNotesPanel
              ? "bg-primary text-primary-foreground"
              : notes
                ? "text-foreground hover:bg-muted/50"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <StickyNote className="h-4 w-4" />
          <span>Notes</span>
        </button>

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
        <div className="flex items-center gap-2 w-[140px]">
          <Clock className={cn("h-4 w-4 flex-shrink-0", isOvertime ? "text-orange-500" : "text-muted-foreground")} />
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
              className="w-full text-center font-semibold text-base border border-primary rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary tabular-nums px-2 py-1 transition-all"
              placeholder="2h, 90m..."
            />
          ) : state === 'idle' && mode === 'countdown' ? (
            <button
              onClick={() => setIsEditingDuration(true)}
              className="w-full text-center font-semibold text-base tabular-nums px-2 py-1 rounded-lg hover:bg-muted/50 transition-all cursor-text"
            >
              {duration > 0 ? formatDurationDisplay(duration) : (
                <span className="text-muted-foreground">Set time</span>
              )}
            </button>
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
              className="h-10 gap-2 px-6"
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
              <Popover open={showStopConfirm} onOpenChange={setShowStopConfirm}>
                <PopoverTrigger asChild>
                  <Button
                    variant="destructive"
                    className="h-10 w-10 p-0 rounded-full"
                  >
                    <Square className="h-4 w-4 fill-current" />
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
              <Popover open={showStopConfirm} onOpenChange={setShowStopConfirm}>
                <PopoverTrigger asChild>
                  <Button
                    variant="destructive"
                    className="h-10 w-10 p-0 rounded-full"
                  >
                    <Square className="h-4 w-4 fill-current" />
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
            </>
          )}
        </div>

        {/* More Options Menu */}
        <Popover
          open={menuOpen}
          onOpenChange={(open) => {
            setMenuOpen(open);
            if (!open) setShowDiscardConfirm(false);
          }}
        >
          <PopoverTrigger asChild>
            <button className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="end">
            {!showDiscardConfirm ? (
              <button
                onClick={() => setShowDiscardConfirm(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-destructive/10 text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Discard Task
              </button>
            ) : (
              <div className="p-2">
                <p className="text-sm font-medium mb-2">Discard this task?</p>
                <p className="text-xs text-muted-foreground mb-3">This will clear the current task without saving.</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8"
                    onClick={() => {
                      setShowDiscardConfirm(false);
                      setMenuOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1 h-8"
                    onClick={() => {
                      onDiscard?.();
                      setShowDiscardConfirm(false);
                      setMenuOpen(false);
                    }}
                  >
                    Discard
                  </Button>
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>
        </div>
      </div>

      {/* Notes Panel */}
      {showNotesPanel && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Session Notes</span>
            </div>
            <button
              onClick={() => setShowNotesPanel(false)}
              className="p-1 rounded hover:bg-muted/50 transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <RichTextEditor
            content={notes}
            onChange={onNotesChange}
            placeholder="Add notes for this task..."
            className="min-h-[150px]"
          />
        </div>
      )}
    </div>
  );
}
