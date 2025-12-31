import { Clock, Play, MoreHorizontal, Trash2, Check, ChevronDown, ChevronRight, StickyNote, Calendar } from 'lucide-react';
import { format, parseISO, startOfWeek, isToday, isYesterday } from 'date-fns';
import { WorkSession, Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RichTextEditor } from '@/components/notes/RichTextEditor';
import { cn } from '@/lib/utils';

// Represents a group of related sessions (via groupId) or a standalone session
interface SessionGroup {
  groupId: string | null;
  taskName: string;
  projectIds: string[];
  sessions: WorkSession[];
  totalDuration: number;
}

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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [bulkDeleteConfirmDate, setBulkDeleteConfirmDate] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const toggleNotesExpanded = (id: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNotes(newExpanded);
  };

  const toggleGroupExpanded = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // Group sessions by groupId for Clockify-style display
  const groupSessionsByGroupId = (daySessions: WorkSession[]): SessionGroup[] => {
    const groups: Map<string, SessionGroup> = new Map();
    const standaloneGroups: SessionGroup[] = [];

    // Sort sessions by start time descending first
    const sortedSessions = [...daySessions].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    sortedSessions.forEach(session => {
      if (session.groupId) {
        if (groups.has(session.groupId)) {
          const group = groups.get(session.groupId)!;
          group.sessions.push(session);
          group.totalDuration += session.duration;
        } else {
          groups.set(session.groupId, {
            groupId: session.groupId,
            taskName: session.taskName,
            projectIds: session.projectIds,
            sessions: [session],
            totalDuration: session.duration,
          });
        }
      } else {
        // Standalone session (no groupId)
        standaloneGroups.push({
          groupId: null,
          taskName: session.taskName,
          projectIds: session.projectIds,
          sessions: [session],
          totalDuration: session.duration,
        });
      }
    });

    // Sort sessions within each group by start time (oldest first for sub-sessions)
    groups.forEach(group => {
      group.sessions.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });

    // Combine grouped and standalone, maintaining time order
    const allGroups = [...groups.values(), ...standaloneGroups];

    // Sort by most recent session in each group
    return allGroups.sort((a, b) => {
      const aLatest = Math.max(...a.sessions.map(s => new Date(s.startTime).getTime()));
      const bLatest = Math.max(...b.sessions.map(s => new Date(s.startTime).getTime()));
      return bLatest - aLatest;
    });
  };

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

  const handleDateEdit = (session: WorkSession, newDateValue: string) => {
    if (!onUpdateSession || !newDateValue) return;

    const [year, month, day] = newDateValue.split('-').map(Number);

    // Update startTime with new date but keep the time
    const oldStartTime = parseISO(session.startTime);
    const newStartTime = new Date(year, month - 1, day, oldStartTime.getHours(), oldStartTime.getMinutes(), oldStartTime.getSeconds());

    // Update endTime with new date but keep the time
    const oldEndTime = parseISO(session.endTime);
    const newEndTime = new Date(year, month - 1, day, oldEndTime.getHours(), oldEndTime.getMinutes(), oldEndTime.getSeconds());

    // If end time was on a different day (session crossed midnight), adjust
    if (oldEndTime.getDate() !== oldStartTime.getDate()) {
      newEndTime.setDate(newEndTime.getDate() + 1);
    }

    onUpdateSession(session.id, {
      date: newDateValue,
      startTime: newStartTime.toISOString(),
      endTime: newEndTime.toISOString(),
    });
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
                      <Popover
                        open={bulkDeleteConfirmDate === date}
                        onOpenChange={(open) => setBulkDeleteConfirmDate(open ? date : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive ml-2"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-3" align="start">
                          <p className="text-sm font-medium mb-2">Delete {daySelectedCount} session{daySelectedCount > 1 ? 's' : ''}?</p>
                          <p className="text-xs text-muted-foreground mb-3">This action cannot be undone.</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-8"
                              onClick={() => setBulkDeleteConfirmDate(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1 h-8"
                              onClick={() => {
                                handleBulkDelete();
                                setBulkDeleteConfirmDate(null);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Total :</span>
                    <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1">
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

                {/* Sessions - grouped by groupId (Clockify-style) */}
                <div className="divide-y divide-border">
                  {groupSessionsByGroupId(daySessions).map((group) => {
                    const isGrouped = group.groupId !== null && group.sessions.length > 1;
                    const isExpanded = group.groupId ? expandedGroups.has(group.groupId) : false;
                    const primarySession = group.sessions[group.sessions.length - 1]; // Most recent

                    return (
                      <div key={group.groupId || primarySession.id}>
                        {/* Group Header / Single Session Row */}
                        <div
                          className="grid grid-cols-[auto_auto_1fr_140px_180px_100px_auto_auto] items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors"
                        >
                          {/* Expand/Collapse for groups */}
                          <div className="w-5 flex justify-center">
                            {isGrouped ? (
                              <button
                                onClick={() => toggleGroupExpanded(group.groupId!)}
                                className="p-0.5 hover:bg-muted rounded transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                            ) : null}
                          </div>

                          {/* Checkbox */}
                          <Checkbox
                            checked={group.sessions.every(s => selectedSessions.has(s.id))}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedSessions);
                              group.sessions.forEach(s => {
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

                          {/* Task Name - Editable */}
                          <div className="min-w-0 flex items-center gap-2">
                            <input
                              type="text"
                              defaultValue={group.taskName || 'Untitled session'}
                              onBlur={(e) => {
                                // Update all sessions in the group
                                group.sessions.forEach(s => {
                                  handleInlineEdit(s.id, 'taskName', e.target.value);
                                });
                              }}
                              className="text-sm font-medium text-foreground bg-transparent border border-transparent flex-1 rounded-lg px-2 py-1 -ml-2 truncate transition-all cursor-text hover:bg-muted/50 focus:bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            {isGrouped && (
                              <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                {group.sessions.length}
                              </span>
                            )}
                          </div>

                          {/* Project Badge - Click to toggle */}
                          <div className="flex items-center justify-start">
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity">
                                  {group.projectIds.length > 0 ? (
                                    (() => {
                                      const project = getProjectById(group.projectIds[0]);
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
                                    onClick={() => {
                                      // Update all sessions in the group
                                      group.sessions.forEach(s => {
                                        handleProjectToggle(s.id, project.id, s.projectIds);
                                      });
                                    }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors"
                                  >
                                    <span
                                      className="w-2.5 h-2.5 rounded-full"
                                      style={{ backgroundColor: project.color }}
                                    />
                                    <span className="flex-1 text-left">{project.name}</span>
                                    {group.projectIds.includes(project.id) && (
                                      <Check className="h-3.5 w-3.5 text-primary" />
                                    )}
                                  </button>
                                ))}
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* Time Range - Show first to last for groups */}
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                            {isGrouped ? (
                              <span>
                                {formatTimeOnly(group.sessions[0].startTime)} - {formatTimeOnly(group.sessions[group.sessions.length - 1].endTime)}
                              </span>
                            ) : (
                              <>
                                <input
                                  type="time"
                                  defaultValue={formatTimeOnly(primarySession.startTime)}
                                  onBlur={(e) => handleTimeEdit(primarySession, 'startTime', e.target.value)}
                                  className="bg-transparent border border-transparent w-[70px] rounded-lg px-1 py-0.5 transition-all cursor-text hover:bg-muted/50 focus:bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute"
                                />
                                <span>-</span>
                                <input
                                  type="time"
                                  defaultValue={formatTimeOnly(primarySession.endTime)}
                                  onBlur={(e) => handleTimeEdit(primarySession, 'endTime', e.target.value)}
                                  className="bg-transparent border border-transparent w-[70px] rounded-lg px-1 py-0.5 transition-all cursor-text hover:bg-muted/50 focus:bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute"
                                />
                              </>
                            )}
                            {/* Date picker */}
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  className="ml-1 p-1 rounded hover:bg-muted transition-colors"
                                  title="Change date"
                                >
                                  <Calendar className="h-3.5 w-3.5" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-3" align="start">
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">Change date</p>
                                  <input
                                    type="date"
                                    defaultValue={primarySession.date}
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        group.sessions.forEach(s => {
                                          handleDateEdit(s, e.target.value);
                                        });
                                      }
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* Duration - Total for groups */}
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="font-medium text-foreground">{formatDuration(group.totalDuration)}</span>
                          </div>

                          {/* Continue Button */}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onContinueSession(primarySession)}
                              className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                            >
                              <Play className="h-3.5 w-3.5" />
                              Continue
                            </Button>

                            {/* Notes indicator - always visible, highlighted if has notes */}
                            <button
                              onClick={() => toggleNotesExpanded(group.groupId || primarySession.id)}
                              className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                                expandedNotes.has(group.groupId || primarySession.id)
                                  ? "bg-primary/10 text-primary"
                                  : group.sessions.some(s => s.notes)
                                    ? "text-foreground hover:bg-muted"
                                    : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted"
                              )}
                              title={group.sessions.some(s => s.notes) ? "View notes" : "Add notes"}
                            >
                              <StickyNote className="h-4 w-4" />
                            </button>
                          </div>

                          {/* More Actions */}
                          <Popover
                            open={deleteConfirmId === (group.groupId || primarySession.id)}
                            onOpenChange={(open) => setDeleteConfirmId(open ? (group.groupId || primarySession.id) : null)}
                          >
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-1" align="end">
                              {deleteConfirmId !== (group.groupId || primarySession.id) ? (
                                <button
                                  onClick={() => setDeleteConfirmId(group.groupId || primarySession.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-destructive/10 text-destructive transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {isGrouped ? `Delete ${group.sessions.length} Sessions` : 'Delete Session'}
                                </button>
                              ) : (
                                <div className="p-2">
                                  <p className="text-sm font-medium mb-2">
                                    Delete {isGrouped ? `${group.sessions.length} sessions` : 'this session'}?
                                  </p>
                                  <p className="text-xs text-muted-foreground mb-3">This action cannot be undone.</p>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 h-8"
                                      onClick={() => setDeleteConfirmId(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="flex-1 h-8"
                                      onClick={() => {
                                        group.sessions.forEach(s => onDeleteSession(s.id));
                                        setDeleteConfirmId(null);
                                      }}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Sub-sessions (when expanded) */}
                        {isGrouped && isExpanded && (
                          <div className="bg-muted/20 border-t border-border">
                            {group.sessions.map((session, idx) => (
                              <div
                                key={session.id}
                                className="grid grid-cols-[auto_auto_1fr_140px_180px_100px_auto_auto] items-center gap-4 px-5 py-2.5 hover:bg-muted/30 transition-colors border-b border-border/50 last:border-b-0"
                              >
                                {/* Indent spacer */}
                                <div className="w-5" />

                                {/* Checkbox */}
                                <Checkbox
                                  checked={selectedSessions.has(session.id)}
                                  onCheckedChange={() => toggleSession(session.id)}
                                  className="border-muted-foreground/40"
                                />

                                {/* Sub-session indicator */}
                                <div className="min-w-0 flex items-center gap-2 pl-4">
                                  <div className="w-4 h-4 border-l-2 border-b-2 border-muted-foreground/30 rounded-bl-sm -mt-2" />
                                  <span className="text-sm text-muted-foreground">
                                    Session {idx + 1}
                                  </span>
                                </div>

                                {/* Empty project column */}
                                <div />

                                {/* Time Range - Editable */}
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                                  <input
                                    type="time"
                                    defaultValue={formatTimeOnly(session.startTime)}
                                    onBlur={(e) => handleTimeEdit(session, 'startTime', e.target.value)}
                                    className="bg-transparent border border-transparent w-[70px] rounded-lg px-1 py-0.5 transition-all cursor-text hover:bg-muted/50 focus:bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute"
                                  />
                                  <span>-</span>
                                  <input
                                    type="time"
                                    defaultValue={formatTimeOnly(session.endTime)}
                                    onBlur={(e) => handleTimeEdit(session, 'endTime', e.target.value)}
                                    className="bg-transparent border border-transparent w-[70px] rounded-lg px-1 py-0.5 transition-all cursor-text hover:bg-muted/50 focus:bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute"
                                  />
                                  {/* Date picker for sub-session */}
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button
                                        className="ml-1 p-1 rounded hover:bg-muted transition-colors"
                                        title="Change date"
                                      >
                                        <Calendar className="h-3.5 w-3.5" />
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-3" align="start">
                                      <div className="space-y-2">
                                        <p className="text-sm font-medium">Change date</p>
                                        <input
                                          type="date"
                                          defaultValue={session.date}
                                          onChange={(e) => {
                                            if (e.target.value) {
                                              handleDateEdit(session, e.target.value);
                                            }
                                          }}
                                          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>

                                {/* Duration */}
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span className="font-medium text-foreground">{formatDuration(session.duration)}</span>
                                </div>

                                {/* Empty actions columns */}
                                <div />

                                {/* Delete sub-session */}
                                <Popover
                                  open={deleteConfirmId === session.id}
                                  onOpenChange={(open) => setDeleteConfirmId(open ? session.id : null)}
                                >
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-48 p-2" align="end">
                                    <p className="text-sm font-medium mb-2">Delete this sub-session?</p>
                                    <p className="text-xs text-muted-foreground mb-3">This action cannot be undone.</p>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 h-8"
                                        onClick={() => setDeleteConfirmId(null)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="flex-1 h-8"
                                        onClick={() => {
                                          onDeleteSession(session.id);
                                          setDeleteConfirmId(null);
                                        }}
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Notes section (when expanded) - always shown when expanded */}
                        {expandedNotes.has(group.groupId || primarySession.id) && (
                          <div className="px-5 py-4 bg-muted/20 border-t border-border">
                            <div className="ml-[52px] space-y-4">
                              {group.sessions.map((session, sessionIdx) => (
                                <div key={session.id}>
                                  {group.sessions.length > 1 && (
                                    <p className="text-xs text-muted-foreground mb-2">
                                      Session {sessionIdx + 1} - {formatTimeOnly(session.startTime)}
                                    </p>
                                  )}
                                  <RichTextEditor
                                    content={session.notes || ''}
                                    onChange={(notes) => onUpdateSession?.(session.id, { notes })}
                                    placeholder="Add notes for this session..."
                                    className="min-h-[100px]"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
