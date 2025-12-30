import { Clock } from 'lucide-react';

interface WeekStatsProps {
  weekTotal: number;
}

export function WeekStats({ weekTotal }: WeekStatsProps) {
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">This Week:</span>
      <div className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold text-foreground">{formatDuration(weekTotal)}</span>
      </div>
    </div>
  );
}
