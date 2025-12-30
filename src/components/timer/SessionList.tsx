import { Clock, Play, MoreHorizontal, Trash2, Check } from 'lucide-react';
import { format, parseISO, startOfWeek, isToday, isYesterday } from 'date-fns';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface SessionListProps {
  sessions: WorkSession[];
  projects: Project[];
  weekTotal: number;
  onDeleteSession: (sessionId: string) => void;
  onContinueSession: (session: WorkSession) => void;
  onUpdateSession?: (sessionId: string, updates: Partial<WorkSession>) => void;
}

export function SessionList({
  sessions,
  projects,
  weekTotal,
  onDeleteSession,
  onContinueSession,
  onUpdateSession,
}: SessionListProps) {
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [filterProjectId, setFilterProjectId] = useState<string | null>(null);

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

  const handleProjectToggle = (sessionId: string, projectId: string, currentProjectIds: string[]) => {
    if (onUpdateSession) {
      // If already selected, remove it; otherwise set it
      if (currentProjectIds.includes(projectId)) {
        onUpdateSession(sessionId, { projectIds: [] });
      } else {
        onUpdateSession(sessionId, { projectIds: [projectId] });
      }
    }
  };

  const handleInlineEdit = (sessionId: string, field: 'taskName', value: string) => {
    if (onUpdateSession) {
      onUpdateSession(sessionId, { [field]: value });
    }
  };

  const handleTimeEdit = (session: WorkSession, field: 'startTime' | 'endTime', timeValue: string) => {
    if (!onUpdateSession || !timeValue) return;

    const [hour, min] = timeValue.split(':').map(Number);
    const baseDate = parseISO(session.startTime);

    if (field === 'startTime') {
      const newStartTime = new Date(baseDate);
      newStartTime.setHours(hour, min, 0, 0);

      const endTime = parseISO(session.endTime);
      let newDuration = Math.floor((endTime.getTime() - newStartTime.getTime()) / 1000);

      // Handle case where new start is after end (adjust end to next day conceptually, or just use absolute diff)
      if (newDuration < 0) {
        newDuration = Math.abs(newDuration);
      }

      onUpdateSession(session.id, {
        startTime: newStartTime.toISOString(),
        duration: newDuration,
      });
    } else {
      const newEndTime = new Date(baseDate);
      newEndTime.setHours(hour, min, 0, 0);

      const startTime = parseISO(session.startTime);

      // If end time is before start time, assume it's the next day
      if (newEndTime < startTime) {
        newEndTime.setDate(newEndTime.getDate() + 1);
      }

      const newDuration = Math.floor((newEndTime.getTime() - startTime.getTime()) / 1000);

      onUpdateSession(session.id, {
        endTime: newEndTime.toISOString(),
        duration: newDuration,
      });
    }
  };

  const handleBulkDelete = () => {
    selectedSessions.forEach(sessionId => {
      onDeleteSession(sessionId);
    });
    setSelectedSessions(new Set());
  };

  // Filter sessions by project if filter is active
  const filteredSessions = filterProjectId
    ? sessions.filter(s => s.projectIds.includes(filterProjectId))
    : sessions;

  // Group sessions by date
  const groupedSessions = filteredSessions.reduce((acc, session) => {
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
      {/* Global filter indicator */}
      {filterProjectId && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Filtering by:</span>
          <button
            onClick={() => setFilterProjectId(null)}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium hover:opacity-80"
            style={{
              backgroundColor: `${getProjectById(filterProjectId)?.color}18`,
              color: getProjectById(filterProjectId)?.color,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: getProjectById(filterProjectId)?.color }}
            />
            {getProjectById(filterProjectId)?.name}
            <span className="ml-1">×</span>
          </button>
        </div>
      )}

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
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive ml-2"
                        onClick={handleBulkDelete}
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Total :</span>
                    <div className="flex items-center gap-2 bg-background border border-border rounded-full px-3 py-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-semibold">{formatDuration(getDateTotal(daySessions))}</span>
                    </div>
                    {/* Filter by Project */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-1" align="end">
                        <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                          Filter by Project
                        </div>
                        {filterProjectId && (
                          <button
                            onClick={() => setFilterProjectId(null)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors text-muted-foreground"
                          >
                            <span className="flex-1 text-left">Show all</span>
                          </button>
                        )}
                        {projects.map((project) => (
                          <button
                            key={project.id}
                            onClick={() => setFilterProjectId(project.id)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors"
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: project.color }}
                            />
                            <span className="flex-1 text-left">{project.name}</span>
                            {filterProjectId === project.id && (
                              <Check className="h-3.5 w-3.5 text-primary" />
                            )}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Sessions */}
                <div className="divide-y divide-border">
                  {daySessions.map((session) => (
                    <div
                      key={session.id}
                      className="grid grid-cols-[auto_1fr_140px_140px_100px_auto_auto] items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors"
                    >
                      {/* Checkbox */}
                      <Checkbox
                        checked={selectedSessions.has(session.id)}
                        onCheckedChange={() => toggleSession(session.id)}
                        className="border-muted-foreground/40"
                      />

                      {/* Task Name - Editable */}
                      <div className="min-w-0">
                        <input
                          type="text"
                          defaultValue={session.taskName || 'Untitled session'}
                          onBlur={(e) => handleInlineEdit(session.id, 'taskName', e.target.value)}
                          className="text-sm font-medium text-foreground bg-transparent border-none outline-none w-full hover:bg-muted/50 focus:bg-muted/50 rounded px-1 py-0.5 -ml-1 truncate"
                        />
                        {session.projectIds.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5 ml-0.5">
                            {session.projectIds.map(id => getProjectById(id)?.name).filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Project Badge - Click to toggle */}
                      <div className="flex items-center justify-start">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity">
                              {session.projectIds.length > 0 ? (
                                (() => {
                                  const project = getProjectById(session.projectIds[0]);
                                  if (!project) return <span className="text-muted-foreground">No project</span>;
                                  return (
                                    <span
                                      className="inline-flex items-center gap-1.5"
                                      style={{
                                        backgroundColor: `${project.color}18`,
                                        color: project.color,
                                        padding: '4px 10px',
                                        borderRadius: '9999px',
                                      }}
                                    >
                                      <span
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ backgroundColor: project.color }}
                                      />
                                      {project.name}
                                    </span>
                                  );
                                })()
                              ) : (
                                <span className="text-muted-foreground text-xs">+ Add project</span>
                              )}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-1" align="start">
                            <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                              Select Project
                            </div>
                            {projects.map((project) => (
                              <button
                                key={project.id}
                                onClick={() => handleProjectToggle(session.id, project.id, session.projectIds)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors"
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: project.color }}
                                />
                                <span className="flex-1 text-left">{project.name}</span>
                                {session.projectIds.includes(project.id) && (
                                  <Check className="h-3.5 w-3.5 text-primary" />
                                )}
                              </button>
                            ))}
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Time Range - Editable */}
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <input
                          type="time"
                          defaultValue={formatTimeOnly(session.startTime)}
                          onBlur={(e) => handleTimeEdit(session, 'startTime', e.target.value)}
                          className="bg-transparent border-none outline-none w-14 text-center hover:bg-muted/50 focus:bg-muted/50 rounded px-1 py-0.5"
                        />
                        <span>-</span>
                        <input
                          type="time"
                          defaultValue={formatTimeOnly(session.endTime)}
                          onBlur={(e) => handleTimeEdit(session, 'endTime', e.target.value)}
                          className="bg-transparent border-none outline-none w-14 text-center hover:bg-muted/50 focus:bg-muted/50 rounded px-1 py-0.5"
                        />
                      </div>

                      {/* Duration */}
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
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
