import { cn } from '@/lib/utils';

interface DurationPickerProps {
  duration: number;
  onDurationChange: (duration: number) => void;
  disabled?: boolean;
}

const presets = [
  { label: '25m', seconds: 25 * 60 },
  { label: '45m', seconds: 45 * 60 },
  { label: '1h', seconds: 60 * 60 },
  { label: '1.5h', seconds: 90 * 60 },
  { label: '2h', seconds: 120 * 60 },
  { label: '3h', seconds: 180 * 60 },
];

export function DurationPicker({ duration, onDurationChange, disabled }: DurationPickerProps) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Duration
      </label>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {presets.map((preset) => (
          <button
            key={preset.seconds}
            onClick={() => onDurationChange(preset.seconds)}
            disabled={disabled}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              duration === preset.seconds
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'bg-secondary text-secondary-foreground hover:bg-muted',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
