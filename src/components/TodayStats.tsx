import { Clock, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface TodayStatsProps {
  todayTotal: number;
  weekTotal: number;
  formatDuration: (seconds: number) => string;
}

export function TodayStats({ todayTotal, weekTotal, formatDuration }: TodayStatsProps) {
  const today = new Date();
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Today
            </p>
            <p className="text-lg font-semibold text-foreground">
              {format(today, 'EEE, MMM d')}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-accent/10">
            <Clock className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Focus Today
            </p>
            <p className="text-lg font-semibold text-foreground">
              {formatDuration(todayTotal)}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-success/10">
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              This Week
            </p>
            <p className="text-lg font-semibold text-foreground">
              {formatDuration(weekTotal)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
