export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface WorkSession {
  id: string;
  taskName: string;
  projectIds: string[];
  date: string; // ISO date string
  duration: number; // in seconds
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  groupId?: string; // Groups related sessions together (for "Continue" feature)
  notes?: string; // JSON string of Tiptap rich text content
}

export type TimerMode = 'countdown' | 'stopwatch';

export type TimerState = 'idle' | 'running' | 'paused';

export interface TimerConfig {
  mode: TimerMode;
  duration: number; // target duration in seconds (for countdown)
  elapsed: number; // elapsed time in seconds
  state: TimerState;
  taskName: string;
  projectIds: string[];
}
