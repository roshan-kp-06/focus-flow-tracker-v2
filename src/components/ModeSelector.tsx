import { Timer, Hourglass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimerMode } from '@/types';

interface ModeSelectorProps {
  mode: TimerMode;
  onModeChange: (mode: TimerMode) => void;
  disabled?: boolean;
}

export function ModeSelector({ mode, onModeChange, disabled }: ModeSelectorProps) {
  return (
    <div className="flex items-center justify-center gap-2 p-1 bg-secondary/50 rounded-xl">
      <button
        onClick={() => onModeChange('countdown')}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
          mode === 'countdown'
            ? 'bg-card text-foreground shadow-md'
            : 'text-muted-foreground hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Hourglass className="h-4 w-4" />
        Countdown
      </button>
      <button
        onClick={() => onModeChange('stopwatch')}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
          mode === 'stopwatch'
            ? 'bg-card text-foreground shadow-md'
            : 'text-muted-foreground hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Timer className="h-4 w-4" />
        Stopwatch
      </button>
    </div>
  );
}
