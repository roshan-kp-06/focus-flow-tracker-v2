import { useState, useEffect, useCallback } from 'react';
import { WorkSession, Project } from '@/types';
import { getSessions, getProjects, addProject, deleteProject, deleteSession } from '@/lib/storage';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, eachDayOfInterval, parseISO, isWithinInterval } from 'date-fns';

export function useWorkSessions() {
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const refresh = useCallback(() => {
    setSessions(getSessions());
    setProjects(getProjects());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createProject = useCallback((name: string, color: string) => {
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      color,
    };
    const updated = addProject(project);
    setProjects(updated);
    return project;
  }, []);

  const removeProject = useCallback((projectId: string) => {
    const updated = deleteProject(projectId);
    setProjects(updated);
  }, []);

  const removeSession = useCallback((sessionId: string) => {
    const updated = deleteSession(sessionId);
    setSessions(updated);
  }, []);

  const getTodaySessions = useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return sessions.filter(s => s.date === today);
  }, [sessions]);

  const getTodayTotal = useCallback(() => {
    return getTodaySessions().reduce((acc, s) => acc + s.duration, 0);
  }, [getTodaySessions]);

  const getWeekSessions = useCallback((date: Date = new Date()) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return sessions.filter(s => {
      const sessionDate = parseISO(s.date);
      return isWithinInterval(sessionDate, { start, end });
    });
  }, [sessions]);

  const getWeekTotal = useCallback((date: Date = new Date()) => {
    return getWeekSessions(date).reduce((acc, s) => acc + s.duration, 0);
  }, [getWeekSessions]);

  const getMonthSessions = useCallback((date: Date = new Date()) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return sessions.filter(s => {
      const sessionDate = parseISO(s.date);
      return isWithinInterval(sessionDate, { start, end });
    });
  }, [sessions]);

  const getMonthTotal = useCallback((date: Date = new Date()) => {
    return getMonthSessions(date).reduce((acc, s) => acc + s.duration, 0);
  }, [getMonthSessions]);

  const getDailyBreakdown = useCallback((date: Date = new Date()) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const daySessions = sessions.filter(s => s.date === dateStr);
      const totalSeconds = daySessions.reduce((acc, s) => acc + s.duration, 0);
      
      return {
        date: dateStr,
        dayName: format(day, 'EEE'),
        hours: totalSeconds / 3600,
        sessions: daySessions,
      };
    });
  }, [sessions]);

  const getProjectBreakdown = useCallback((date: Date = new Date()) => {
    const monthSessions = getMonthSessions(date);
    
    const breakdown: Record<string, number> = {};
    
    monthSessions.forEach(session => {
      session.projectIds.forEach(projectId => {
        if (!breakdown[projectId]) {
          breakdown[projectId] = 0;
        }
        // Divide time equally among projects
        breakdown[projectId] += session.duration / session.projectIds.length;
      });
      
      // Handle sessions without projects
      if (session.projectIds.length === 0) {
        if (!breakdown['unassigned']) {
          breakdown['unassigned'] = 0;
        }
        breakdown['unassigned'] += session.duration;
      }
    });

    return Object.entries(breakdown).map(([projectId, seconds]) => {
      const project = projects.find(p => p.id === projectId);
      return {
        projectId,
        projectName: project?.name || 'Unassigned',
        color: project?.color || 'hsl(240, 5%, 50%)',
        hours: seconds / 3600,
        seconds,
      };
    }).sort((a, b) => b.seconds - a.seconds);
  }, [getMonthSessions, projects]);

  return {
    sessions,
    projects,
    refresh,
    createProject,
    removeProject,
    removeSession,
    getTodaySessions,
    getTodayTotal,
    getWeekSessions,
    getWeekTotal,
    getMonthSessions,
    getMonthTotal,
    getDailyBreakdown,
    getProjectBreakdown,
  };
}
