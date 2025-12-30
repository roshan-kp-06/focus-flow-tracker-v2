import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimerState } from '@/types';

interface TimerControlsProps {
  state: TimerState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
  hasElapsed: boolean;
}

export function TimerControls({
  state,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  hasElapsed,
}: TimerControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {state === 'idle' && (
        <Button
          variant="timer"
          size="xl"
          onClick={onStart}
          className="min-w-[160px]"
        >
          <Play className="h-5 w-5" />
          Start Focus
        </Button>
      )}

      {state === 'running' && (
        <>
          <Button
            variant="timerSecondary"
            size="iconLg"
            onClick={onPause}
          >
            <Pause className="h-6 w-6" />
          </Button>
          <Button
            variant="destructive"
            size="iconLg"
            onClick={onStop}
          >
            <Square className="h-5 w-5" />
          </Button>
        </>
      )}

      {state === 'paused' && (
        <>
          <Button
            variant="timer"
            size="xl"
            onClick={onResume}
            className="min-w-[140px]"
          >
            <Play className="h-5 w-5" />
            Resume
          </Button>
          <Button
            variant="destructive"
            size="iconLg"
            onClick={onStop}
          >
            <Square className="h-5 w-5" />
          </Button>
        </>
      )}

      {state === 'idle' && hasElapsed && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onReset}
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
