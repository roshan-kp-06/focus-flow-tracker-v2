import { Clock, Play, MoreHorizontal, Trash2, ListFilter } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, isToday, isYesterday } from 'date-fns';
import { WorkSession, Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
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
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeOnly = (timeString: string) => {
    return format(parseISO(timeString), 'HH:mm');
  };

  const getProjectById = (id: string) => projects.find(p => p.id === id);

  const toggleSession = (sessionId: string) => {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
  };

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

  const formatDayLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) {
      return `Today, ${format(date, 'd MMM yyyy')}`;
    }
    if (isYesterday(date)) {
      return `Yesterday, ${format(date, 'd MMM yyyy')}`;
    }
    return `${format(date, 'EEEE')}, ${format(date, 'd MMM yyyy')}`;
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
    <div className="space-y-6">
      {weeks.map((week) => (
        <div key={format(week.weekStart, 'yyyy-MM-dd')} className="space-y-4">
          {/* Days in Week */}
          {week.dates.map((date) => {
            const daySessions = groupedSessions[date];
            const daySelectedCount = daySessions.filter(s => selectedSessions.has(s.id)).length;

            return (
              <div key={date} className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                {/* Day Header */}
                <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={daySelectedCount === daySessions.length && daySessions.length > 0}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(selectedSessions);
                        daySessions.forEach(s => {
                          if (checked) {
                            newSelected.add(s.id);
                          } else {
                            newSelected.delete(s.id);
                          }
                        });
                        setSelectedSessions(newSelected);
                      }}
                      className="border-muted-foreground/40"
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {formatDayLabel(date)}
                    </span>
                    {daySelectedCount > 0 && (
                      <span className="text-sm text-muted-foreground">
                        | {daySelectedCount} Item{daySelectedCount > 1 ? 's' : ''} Selected
                      </span>
                    )}
                    {daySelectedCount > 0 && (
                      <div className="flex items-center gap-2 ml-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Bulk Edit
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Total :</span>
                    <div className="flex items-center gap-2 bg-background border border-border rounded-full px-3 py-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-semibold">{formatDuration(getDateTotal(daySessions))}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ListFilter className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                {/* Sessions */}
                <div className="divide-y divide-border">
                  {daySessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors"
                    >
                      {/* Checkbox */}
                      <Checkbox
                        checked={selectedSessions.has(session.id)}
                        onCheckedChange={() => toggleSession(session.id)}
                        className="border-muted-foreground/40"
                      />

                      {/* Task Name & Projects */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {session.taskName || 'Untitled session'}
                        </p>
                        {session.projectIds.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {session.projectIds.map(id => getProjectById(id)?.name).filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Project Badges */}
                      <div className="flex items-center gap-1.5">
                        {session.projectIds.slice(0, 1).map((projectId) => {
                          const project = getProjectById(projectId);
                          if (!project) return null;
                          return (
                            <span
                              key={projectId}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${project.color}18`,
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

                      {/* Time Range */}
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-[120px]">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatTimeOnly(session.startTime)}</span>
                        <span>-</span>
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatTimeOnly(session.endTime)}</span>
                      </div>

                      {/* Duration */}
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-[90px]">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="font-medium text-foreground">{formatDuration(session.duration)}</span>
                      </div>

                      {/* Continue Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onContinueSession(session)}
                        className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Continue
                      </Button>

                      {/* More Actions */}
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
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
