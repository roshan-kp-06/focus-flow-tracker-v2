import { useState, useMemo } from 'react';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval, subDays, subWeeks, subMonths, subYears, addDays, addWeeks, addMonths, addYears, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Filter, Check, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { WorkSession, Project } from '@/types';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type ViewMode = 'day' | 'week' | 'month' | 'year' | 'custom';

interface ReportsProps {
  sessions: WorkSession[];
  projects: Project[];
}

export function Reports({ sessions, projects }: ReportsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [visibleProjectIds, setVisibleProjectIds] = useState<string[]>([]);

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    switch (viewMode) {
      case 'day':
        return { start: startOfDay(currentDate), end: endOfDay(currentDate) };
      case 'week':
        return { start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
      case 'year':
        return { start: startOfYear(currentDate), end: endOfYear(currentDate) };
      case 'custom':
        return {
          start: startOfDay(parseISO(customStartDate)),
          end: endOfDay(parseISO(customEndDate))
        };
      default:
        return { start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) };
    }
  }, [viewMode, currentDate, customStartDate, customEndDate]);

  // Filter sessions by date range and project
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const sessionDate = parseISO(session.date);
      const inDateRange = isWithinInterval(sessionDate, { start: dateRange.start, end: dateRange.end });

      if (!inDateRange) return false;

      if (selectedProjectIds.length > 0) {
        return session.projectIds.some(id => selectedProjectIds.includes(id)) ||
               (selectedProjectIds.includes('unassigned') && session.projectIds.length === 0);
      }

      return true;
    });
  }, [sessions, dateRange, selectedProjectIds]);

  // Calculate total time
  const totalSeconds = useMemo(() => {
    return filteredSessions.reduce((acc, s) => acc + s.duration, 0);
  }, [filteredSessions]);

  // Calculate number of days with sessions for average
  const daysWithSessions = useMemo(() => {
    const uniqueDates = new Set(filteredSessions.map(s => s.date));
    return uniqueDates.size;
  }, [filteredSessions]);

  // Average hours per day (only counting days that have sessions)
  const averageSecondsPerDay = useMemo(() => {
    if (daysWithSessions === 0) return 0;
    return totalSeconds / daysWithSessions;
  }, [totalSeconds, daysWithSessions]);

  // Get chart data based on view mode
  const chartData = useMemo(() => {
    switch (viewMode) {
      case 'day': {
        // For day view, show just the day's total as a full-width bar
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const daySessions = filteredSessions.filter(s => s.date === dateStr);
        const totalSecs = daySessions.reduce((acc, s) => acc + s.duration, 0);
        return [{
          label: format(currentDate, 'EEEE, MMMM d, yyyy'),
          shortLabel: format(currentDate, 'EEE'),
          totalSeconds: totalSecs,
        }];
      }
      case 'week': {
        // Show each day of the week
        const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
        return days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const daySessions = filteredSessions.filter(s => s.date === dateStr);
          const totalSecs = daySessions.reduce((acc, s) => acc + s.duration, 0);
          return {
            label: `${format(day, 'EEE')}, ${format(day, 'MMM d')}`,
            shortLabel: format(day, 'EEE'),
            totalSeconds: totalSecs,
          };
        });
      }
      case 'month': {
        // Show each day of the month
        const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
        return days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const daySessions = filteredSessions.filter(s => s.date === dateStr);
          const totalSecs = daySessions.reduce((acc, s) => acc + s.duration, 0);
          return {
            label: format(day, 'd'),
            shortLabel: format(day, 'd'),
            totalSeconds: totalSecs,
          };
        });
      }
      case 'year': {
        // Show each month of the year
        const months = eachMonthOfInterval({ start: dateRange.start, end: dateRange.end });
        return months.map(monthStart => {
          const monthEnd = endOfMonth(monthStart);
          const monthSessions = filteredSessions.filter(s => {
            const sessionDate = parseISO(s.date);
            return isWithinInterval(sessionDate, { start: monthStart, end: monthEnd });
          });
          const totalSecs = monthSessions.reduce((acc, s) => acc + s.duration, 0);
          return {
            label: format(monthStart, 'MMMM'),
            shortLabel: format(monthStart, 'MMM'),
            totalSeconds: totalSecs,
          };
        });
      }
      case 'custom': {
        // Show each day in the custom range
        const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
        return days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const daySessions = filteredSessions.filter(s => s.date === dateStr);
          const totalSecs = daySessions.reduce((acc, s) => acc + s.duration, 0);
          return {
            label: format(day, 'MMM d'),
            shortLabel: format(day, 'd'),
            totalSeconds: totalSecs,
          };
        });
      }
      default:
        return [];
    }
  }, [viewMode, currentDate, dateRange, filteredSessions]);

  // Project breakdown (all projects)
  const allProjectBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};

    filteredSessions.forEach(session => {
      session.projectIds.forEach(projectId => {
        if (!breakdown[projectId]) {
          breakdown[projectId] = 0;
        }
        breakdown[projectId] += session.duration / session.projectIds.length;
      });

      if (session.projectIds.length === 0) {
        if (!breakdown['unassigned']) {
          breakdown['unassigned'] = 0;
        }
        breakdown['unassigned'] += session.duration;
      }
    });

    return Object.entries(breakdown)
      .map(([projectId, seconds]) => {
        const project = projects.find(p => p.id === projectId);
        return {
          projectId,
          projectName: project?.name || 'No Project',
          color: project?.color || '#64748b',
          seconds,
        };
      })
      .sort((a, b) => b.seconds - a.seconds);
  }, [filteredSessions, projects]);

  // Filtered project breakdown (for display)
  const projectBreakdown = useMemo(() => {
    if (visibleProjectIds.length === 0) return allProjectBreakdown;
    return allProjectBreakdown.filter(p => visibleProjectIds.includes(p.projectId));
  }, [allProjectBreakdown, visibleProjectIds]);

  const toggleVisibleProject = (projectId: string) => {
    setVisibleProjectIds(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHoursDecimal = (seconds: number) => {
    const hours = seconds / 3600;
    return hours.toFixed(2);
  };

  const toggleProjectFilter = (projectId: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const navigatePrevious = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(prev => subDays(prev, 1));
        break;
      case 'week':
        setCurrentDate(prev => subWeeks(prev, 1));
        break;
      case 'month':
        setCurrentDate(prev => subMonths(prev, 1));
        break;
      case 'year':
        setCurrentDate(prev => subYears(prev, 1));
        break;
    }
  };

  const navigateNext = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(prev => addDays(prev, 1));
        break;
      case 'week':
        setCurrentDate(prev => addWeeks(prev, 1));
        break;
      case 'month':
        setCurrentDate(prev => addMonths(prev, 1));
        break;
      case 'year':
        setCurrentDate(prev => addYears(prev, 1));
        break;
    }
  };

  const getDateRangeLabel = () => {
    switch (viewMode) {
      case 'day':
        return format(currentDate, 'EEE, MMM d, yyyy');
      case 'week':
        return `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'year':
        return format(currentDate, 'yyyy');
      case 'custom':
        return `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`;
      default:
        return '';
    }
  };

  // Calculate max hours for Y-axis based on view mode
  const getYAxisMax = () => {
    const maxHours = Math.max(...chartData.map(d => d.totalSeconds / 3600), 0);
    if (viewMode === 'day' || viewMode === 'week' || viewMode === 'month' || viewMode === 'custom') {
      return maxHours > 8 ? Math.ceil(maxHours / 2) * 2 : 8;
    } else {
      // Monthly totals for year view
      return maxHours > 160 ? Math.ceil(maxHours / 40) * 40 : 160;
    }
  };

  const getYAxisSteps = () => {
    const max = getYAxisMax();
    return [max, max * 0.75, max * 0.5, max * 0.25, 0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Reports</h1>

        <div className="flex items-center gap-2">
          {/* View Mode Selector */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            {(['day', 'week', 'month', 'year'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize",
                  viewMode === mode
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Navigation - only show for non-custom modes */}
          {viewMode !== 'custom' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={navigatePrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Date Display / Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg min-w-[180px] justify-center transition-colors cursor-pointer">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{getDateRangeLabel()}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start" sideOffset={8}>
              <div className="space-y-4">
                <div className="text-sm font-medium text-foreground">Custom Date Range</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">From</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => {
                        setCustomStartDate(e.target.value);
                        setViewMode('custom');
                      }}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">To</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => {
                        setCustomEndDate(e.target.value);
                        setViewMode('custom');
                      }}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="text-xs text-muted-foreground mb-2">Quick select</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setViewMode('day');
                        setCurrentDate(new Date());
                      }}
                      className="px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => {
                        setViewMode('week');
                        setCurrentDate(new Date());
                      }}
                      className="px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      This Week
                    </button>
                    <button
                      onClick={() => {
                        setViewMode('month');
                        setCurrentDate(new Date());
                      }}
                      className="px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      This Month
                    </button>
                    <button
                      onClick={() => {
                        setViewMode('year');
                        setCurrentDate(new Date());
                      }}
                      className="px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      This Year
                    </button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Navigation - only show for non-custom modes */}
          {viewMode !== 'custom' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={navigateNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {/* Project Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                {selectedProjectIds.length > 0
                  ? `${selectedProjectIds.length} Project${selectedProjectIds.length > 1 ? 's' : ''}`
                  : 'All Projects'
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1" align="end">
              <div className="text-xs font-medium text-muted-foreground px-3 py-2">
                Filter by Project
              </div>
              {selectedProjectIds.length > 0 && (
                <button
                  onClick={() => setSelectedProjectIds([])}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-muted transition-colors text-muted-foreground"
                >
                  Clear filters
                </button>
              )}
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => toggleProjectFilter(project.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-muted transition-colors"
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="flex-1 text-left">{project.name}</span>
                  {selectedProjectIds.includes(project.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
              <button
                onClick={() => toggleProjectFilter('unassigned')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-muted transition-colors"
              >
                <span className="w-3 h-3 rounded-full bg-slate-400" />
                <span className="flex-1 text-left">No Project</span>
                {selectedProjectIds.includes('unassigned') && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Hours */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Clock className="h-4 w-4" />
            <span>Total Work Hours</span>
          </div>
          <div className="text-3xl font-bold text-foreground">{formatDuration(totalSeconds)}</div>
          <div className="text-sm text-muted-foreground mt-1">{formatHoursDecimal(totalSeconds)} hours</div>
        </div>

        {/* Average Hours per Day */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4" />
            <span>Average per Day</span>
          </div>
          <div className="text-3xl font-bold text-foreground">{formatDuration(Math.round(averageSecondsPerDay))}</div>
          <div className="text-sm text-muted-foreground mt-1">{formatHoursDecimal(averageSecondsPerDay)} hours/day</div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="text-sm font-medium text-muted-foreground mb-4">Work Hours</div>
        {(() => {
          const yAxisMax = getYAxisMax();
          const yAxisSteps = getYAxisSteps();
          const isDayView = viewMode === 'day';
          const isMonthView = viewMode === 'month';

          return (
            <div className="flex">
              {/* Y-axis labels */}
              <div className="flex flex-col justify-between pr-3 text-xs text-muted-foreground h-[200px] w-8">
                {yAxisSteps.map((val, idx) => (
                  <span key={idx} className="text-right">{Math.round(val)}</span>
                ))}
              </div>

              {/* Chart area */}
              <div className="flex-1 relative">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none h-[200px]">
                  {yAxisSteps.map((_, idx) => (
                    <div key={idx} className="border-t border-dashed border-border/50 w-full" />
                  ))}
                </div>

                {/* Bars */}
                <div className={cn(
                  "h-[200px] flex items-end relative",
                  isDayView ? "justify-center" : "gap-[2px]"
                )}>
                  {chartData.map((item, idx) => {
                    const hours = item.totalSeconds / 3600;
                    const heightPercent = yAxisMax > 0 ? (hours / yAxisMax) * 100 : 0;
                    const hasTime = item.totalSeconds > 0;

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "flex flex-col items-center h-full justify-end group",
                          isDayView ? "w-1/3" : "flex-1"
                        )}
                      >
                        {/* Tooltip on hover */}
                        {hasTime && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
                            {formatDuration(item.totalSeconds)}
                          </div>
                        )}

                        {/* Bar */}
                        <div
                          className={cn(
                            "w-full rounded-t transition-all",
                            hasTime ? "bg-[#a1a1aa] hover:bg-[#71717a]" : "bg-transparent",
                            isDayView ? "max-w-[200px]" : isMonthView ? "max-w-[20px]" : "max-w-[60px]"
                          )}
                          style={{
                            height: hasTime ? `${Math.max(heightPercent, 2)}%` : '0',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* X-axis labels */}
                <div className={cn(
                  "flex mt-3 border-t border-border pt-2",
                  isDayView ? "justify-center" : "gap-[2px]"
                )}>
                  {isDayView ? (
                    <div className="text-center">
                      <div className="text-sm text-foreground font-medium">
                        {chartData[0]?.label}
                      </div>
                    </div>
                  ) : (
                    chartData.map((item, idx) => (
                      <div key={idx} className="flex-1 text-center">
                        <div className={cn(
                          "text-muted-foreground truncate",
                          isMonthView ? "text-[10px]" : "text-xs"
                        )}>
                          {viewMode === 'year' ? item.shortLabel : item.shortLabel}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Project Breakdown */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Group by:</span>
            <span className="px-3 py-1 bg-muted rounded-lg text-foreground font-medium">Project</span>
          </div>

          {/* Project Visibility Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-3.5 w-3.5" />
                {visibleProjectIds.length > 0
                  ? `${visibleProjectIds.length} Selected`
                  : 'All Projects'
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="end">
              <div className="text-xs font-medium text-muted-foreground px-2 py-1.5 mb-1">
                Show Projects
              </div>
              {visibleProjectIds.length > 0 && (
                <button
                  onClick={() => setVisibleProjectIds([])}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors text-muted-foreground mb-1"
                >
                  Show all
                </button>
              )}
              {allProjectBreakdown.map((project) => (
                <button
                  key={project.projectId}
                  onClick={() => toggleVisibleProject(project.projectId)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors"
                >
                  <Checkbox
                    checked={visibleProjectIds.length === 0 || visibleProjectIds.includes(project.projectId)}
                    className="h-4 w-4"
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="flex-1 text-left truncate">{project.projectName}</span>
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        {projectBreakdown.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No sessions recorded for this period
          </div>
        ) : (
          <div className="flex gap-8">
            {/* Project List */}
            <div className="flex-1">
              <div className="grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-3 text-sm">
                {/* Header */}
                <div className="text-muted-foreground font-medium">#</div>
                <div className="text-muted-foreground font-medium">TITLE</div>
                <div className="text-muted-foreground font-medium text-right">DURATION</div>

                {/* Rows */}
                {projectBreakdown.map((project, index) => (
                  <>
                    <div key={`${project.projectId}-num`} className="text-muted-foreground">
                      {index + 1}
                    </div>
                    <div key={`${project.projectId}-name`} className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="text-foreground">{project.projectName}</span>
                    </div>
                    <div key={`${project.projectId}-duration`} className="text-foreground text-right font-medium">
                      {formatDuration(project.seconds)}
                    </div>
                  </>
                ))}
              </div>
            </div>

            {/* Donut Chart */}
            <div className="flex-shrink-0 w-[200px] h-[200px] relative">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  let currentAngle = 0;
                  const total = projectBreakdown.reduce((acc, p) => acc + p.seconds, 0);

                  return projectBreakdown.map((project) => {
                    const percentage = total > 0 ? (project.seconds / total) * 100 : 0;
                    const angle = (percentage / 100) * 360;
                    const startAngle = currentAngle;
                    currentAngle += angle;

                    // Calculate arc path
                    const radius = 40;
                    const strokeWidth = 20;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                    const strokeDashoffset = -(startAngle / 360) * circumference;

                    return (
                      <circle
                        key={project.projectId}
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke={project.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500"
                      />
                    );
                  });
                })()}
              </svg>

              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-foreground">
                  {formatDuration(projectBreakdown.reduce((acc, p) => acc + p.seconds, 0))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
