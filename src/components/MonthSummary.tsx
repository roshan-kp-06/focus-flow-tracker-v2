import { format } from 'date-fns';
import { Calendar, Clock, Target } from 'lucide-react';

interface MonthSummaryProps {
  monthTotal: number;
  weekTotal: number;
  sessionCount: number;
}

export function MonthSummary({ monthTotal, weekTotal, sessionCount }: MonthSummaryProps) {
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const avgPerSession = sessionCount > 0 ? monthTotal / sessionCount : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {format(new Date(), 'MMMM yyyy')}
          </span>
        </div>
        <p className="text-2xl font-bold text-foreground">
          {formatDuration(monthTotal)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Total focus time
        </p>
      </div>

      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-lg bg-accent/10">
            <Clock className="h-5 w-5 text-accent" />
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            This Week
          </span>
        </div>
        <p className="text-2xl font-bold text-foreground">
          {formatDuration(weekTotal)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Weekly progress
        </p>
      </div>

      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-lg bg-success/10">
            <Target className="h-5 w-5 text-success" />
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Sessions
          </span>
        </div>
        <p className="text-2xl font-bold text-foreground">
          {sessionCount}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Avg: {formatDuration(avgPerSession)}
        </p>
      </div>
    </div>
  );
}
