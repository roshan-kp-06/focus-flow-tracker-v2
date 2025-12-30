import { cn } from '@/lib/utils';
import { TimerState } from '@/types';

interface TimerDisplayProps {
  time: string;
  state: TimerState;
}

export function TimerDisplay({ time, state }: TimerDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 md:py-16">
      <div
        className={cn(
          'timer-display transition-all duration-500',
          state === 'running' && 'timer-active text-primary',
          state === 'paused' && 'text-muted-foreground',
          state === 'idle' && 'text-foreground'
        )}
      >
        {time}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div
          className={cn(
            'h-2 w-2 rounded-full transition-all duration-300',
            state === 'running' && 'bg-success animate-pulse',
            state === 'paused' && 'bg-primary',
            state === 'idle' && 'bg-muted-foreground'
          )}
        />
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {state === 'running' ? 'Focusing' : state === 'paused' ? 'Paused' : 'Ready'}
        </span>
      </div>
    </div>
  );
}
