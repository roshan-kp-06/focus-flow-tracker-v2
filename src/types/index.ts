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
  plannerTaskId?: string; // Link to a planner task
}

// Task Planning Types
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskStatus {
  id: string;
  name: string;
  color: string;
  order: number;
  isDone: boolean; // Tasks moved here are marked as completed
}

export interface PlannerTask {
  id: string;
  title: string;
  description?: string; // Rich text JSON
  statusId: string;
  priority?: TaskPriority;
  dueDate?: string; // ISO date
  scheduledDate?: string; // ISO date - when planned to work on it
  projectIds: string[];
  completedAt?: string; // ISO datetime
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  order: number; // For manual sorting within status
}

export type TaskViewType = 'list' | 'kanban';

export interface TaskViewFilter {
  statusIds?: string[];
  projectIds?: string[];
  priorities?: TaskPriority[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  showCompleted?: boolean;
  scheduledDate?: 'today' | 'week' | 'overdue' | string;
}

export interface TaskView {
  id: string;
  name: string;
  type: TaskViewType;
  filters: TaskViewFilter;
  groupBy?: 'status' | 'project' | 'priority' | 'dueDate';
  sortBy: 'order' | 'dueDate' | 'priority' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';
  isDefault?: boolean;
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
