import { Project, WorkSession } from '@/types';

const PROJECTS_KEY = 'deepwork_projects';
const SESSIONS_KEY = 'deepwork_sessions';

// Default projects
const defaultProjects: Project[] = [
  { id: '1', name: 'Development', color: 'hsl(32, 95%, 55%)' },
  { id: '2', name: 'Design', color: 'hsl(175, 60%, 45%)' },
  { id: '3', name: 'Research', color: 'hsl(280, 65%, 60%)' },
  { id: '4', name: 'Writing', color: 'hsl(200, 80%, 55%)' },
];

export function getProjects(): Project[] {
  try {
    const stored = localStorage.getItem(PROJECTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with defaults
    saveProjects(defaultProjects);
    return defaultProjects;
  } catch {
    return defaultProjects;
  }
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function addProject(project: Project): Project[] {
  const projects = getProjects();
  projects.push(project);
  saveProjects(projects);
  return projects;
}

export function deleteProject(projectId: string): Project[] {
  const projects = getProjects().filter(p => p.id !== projectId);
  saveProjects(projects);
  return projects;
}

export function getSessions(): WorkSession[] {
  try {
    const stored = localStorage.getItem(SESSIONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: WorkSession[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function addSession(session: WorkSession): WorkSession[] {
  const sessions = getSessions();
  sessions.push(session);
  saveSessions(sessions);
  return sessions;
}

export function deleteSession(sessionId: string): WorkSession[] {
  const sessions = getSessions().filter(s => s.id !== sessionId);
  saveSessions(sessions);
  return sessions;
}

export function getSessionsByDate(date: string): WorkSession[] {
  return getSessions().filter(s => s.date === date);
}

export function getSessionsInRange(startDate: string, endDate: string): WorkSession[] {
  return getSessions().filter(s => s.date >= startDate && s.date <= endDate);
}
