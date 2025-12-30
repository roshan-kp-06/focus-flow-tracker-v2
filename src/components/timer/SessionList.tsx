import { Clock, Play, MoreHorizontal, Trash2 } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { WorkSession, Project } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SessionListProps {
  sessions: WorkSession[];
  projects: Project[];
  weekTotal: number;
  onDeleteSession: (sessionId: string) => void;
  onContinueSession: (session: WorkSession) => void;
}

export function SessionList({
  sessions,
  projects,
  weekTotal,
  onDeleteSession,
  onContinueSession,
}: SessionListProps) {
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    const start = format(parseISO(startTime), 'HH:mm');
    const end = format(parseISO(endTime), 'HH:mm');
    return `${start} - ${end}`;
  };

  const getProjectById = (id: string) => projects.find(p => p.id === id);

  // Group sessions by date
  const groupedSessions = sessions.reduce((acc, session) => {
    if (!acc[session.date]) {
      acc[session.date] = [];
    }
    acc[session.date].push(session);
    return acc;
  }, {} as Record<string, WorkSession[]>);

  // Get date total
  const getDateTotal = (dateSessions: WorkSession[]) => {
    return dateSessions.reduce((acc, s) => acc + s.duration, 0);
  };

  const sortedDates = Object.keys(groupedSessions).sort((a, b) => b.localeCompare(a));

  // Group dates by week
  const groupByWeek = (dates: string[]) => {
    const weeks: { weekStart: Date; dates: string[] }[] = [];
    
    dates.forEach(dateStr => {
      const date = parseISO(dateStr);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      
      const existingWeek = weeks.find(w => 
        format(w.weekStart, 'yyyy-MM-dd') === format(weekStart, 'yyyy-MM-dd')
      );
      
      if (existingWeek) {
        existingWeek.dates.push(dateStr);
      } else {
        weeks.push({ weekStart, dates: [dateStr] });
      }
    });
    
    return weeks.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
  };

  const getWeekTotal = (weekDates: string[]) => {
    return weekDates.reduce((acc, date) => {
      return acc + getDateTotal(groupedSessions[date]);
    }, 0);
  };

  const formatWeekLabel = (weekStart: Date) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const now = new Date();
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    
    if (format(weekStart, 'yyyy-MM-dd') === format(currentWeekStart, 'yyyy-MM-dd')) {
      return 'This Week';
    }
    
    return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;
  };

  const weeks = groupByWeek(sortedDates);

  if (sessions.length === 0) {
    return (
      <div className="text-center py-16">
        <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">No sessions recorded yet.</p>
        <p className="text-sm text-muted-foreground/70">Start your first focus session!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {weeks.map((week) => (
        <div key={format(week.weekStart, 'yyyy-MM-dd')}>
          {/* Week Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              {formatWeekLabel(week.weekStart)}
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Week total:</span>
              <span className="font-semibold text-foreground">{formatDuration(getWeekTotal(week.dates))}</span>
            </div>
          </div>

          {/* Days in Week */}
          {week.dates.map((date) => (
            <div key={date} className="mb-6">
              {/* Day Header */}
              <div className="flex items-center justify-between py-2 border-b border-border mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">
                    {format(parseISO(date), 'EEE, d MMM')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">{formatDuration(getDateTotal(groupedSessions[date]))}</span>
                </div>
              </div>

              {/* Sessions */}
              <div className="space-y-1">
                {groupedSessions[date].map((session) => (
                  <div
                    key={session.id}
                    className="session-row group"
                  >
                    {/* Task Name & Projects */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {session.taskName || 'Untitled session'}
                      </p>
                      {session.projectIds.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1">
                          {session.projectIds.map((projectId) => {
                            const project = getProjectById(projectId);
                            if (!project) return null;
                            return (
                              <span
                                key={projectId}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: `${project.color}15`,
                                  color: project.color,
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: project.color }}
                                />
                                {project.name}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Time Range */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {session.startTime && session.endTime && (
                        <span>{formatTimeRange(session.startTime, session.endTime)}</span>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="w-20 text-right">
                      <span className="text-sm font-medium">{formatDuration(session.duration)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onContinueSession(session)}
                        className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Continue
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onDeleteSession(session.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
