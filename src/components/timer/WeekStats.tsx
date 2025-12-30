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
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">This Week:</span>
      <div className="flex items-center gap-1.5 font-semibold">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span>{formatDuration(weekTotal)}</span>
      </div>
    </div>
  );
}
