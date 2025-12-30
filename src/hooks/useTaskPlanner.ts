import { useState, useEffect, useCallback } from 'react';
import { PlannerTask, TaskStatus, TaskView, TaskViewFilter, TaskPriority } from '@/types';
import { format, startOfWeek, endOfWeek, parseISO, isBefore, startOfDay } from 'date-fns';

const TASKS_STORAGE_KEY = 'deepwork_planner_tasks';
const STATUSES_STORAGE_KEY = 'deepwork_planner_statuses';
const VIEWS_STORAGE_KEY = 'deepwork_planner_views';

// Default statuses
const defaultStatuses: TaskStatus[] = [
  { id: 'backlog', name: 'Backlog', color: 'hsl(220, 9%, 46%)', order: 0, isDone: false },
  { id: 'todo', name: 'To Do', color: 'hsl(220, 9%, 46%)', order: 1, isDone: false },
  { id: 'in-progress', name: 'In Progress', color: 'hsl(217, 91%, 60%)', order: 2, isDone: false },
  { id: 'done', name: 'Done', color: 'hsl(142, 71%, 45%)', order: 3, isDone: true },
];

// Default views
const defaultViews: TaskView[] = [
  {
    id: 'all-tasks',
    name: 'All Tasks',
    type: 'list',
    filters: { showCompleted: false },
    sortBy: 'order',
    sortOrder: 'asc',
    isDefault: true,
  },
  {
    id: 'kanban-board',
    name: 'Kanban Board',
    type: 'kanban',
    filters: { showCompleted: true },
    groupBy: 'status',
    sortBy: 'order',
    sortOrder: 'asc',
  },
  {
    id: 'today',
    name: 'Today',
    type: 'list',
    filters: { scheduledDate: 'today', showCompleted: false },
    sortBy: 'priority',
    sortOrder: 'desc',
  },
];

// Storage helpers
function getTasks(): PlannerTask[] {
  try {
    const stored = localStorage.getItem(TASKS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks: PlannerTask[]): void {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

function getStatuses(): TaskStatus[] {
  try {
    const stored = localStorage.getItem(STATUSES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with defaults
    saveStatuses(defaultStatuses);
    return defaultStatuses;
  } catch {
    return defaultStatuses;
  }
}

function saveStatuses(statuses: TaskStatus[]): void {
  localStorage.setItem(STATUSES_STORAGE_KEY, JSON.stringify(statuses));
}

function getViews(): TaskView[] {
  try {
    const stored = localStorage.getItem(VIEWS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with defaults
    saveViews(defaultViews);
    return defaultViews;
  } catch {
    return defaultViews;
  }
}

function saveViews(views: TaskView[]): void {
  localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(views));
}

// Priority ordering for sorting
const priorityOrder: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function useTaskPlanner() {
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [views, setViews] = useState<TaskView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string>('all-tasks');

  // Load data on mount
  useEffect(() => {
    setTasks(getTasks());
    setStatuses(getStatuses());
    setViews(getViews());
  }, []);

  const refresh = useCallback(() => {
    setTasks(getTasks());
    setStatuses(getStatuses());
    setViews(getViews());
  }, []);

  // === TASK CRUD ===

  const createTask = useCallback((taskData: Omit<PlannerTask, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
    const now = new Date().toISOString();
    const currentTasks = getTasks();

    // Calculate order (add to end of status)
    const tasksInStatus = currentTasks.filter(t => t.statusId === taskData.statusId);
    const maxOrder = tasksInStatus.length > 0
      ? Math.max(...tasksInStatus.map(t => t.order))
      : -1;

    const newTask: PlannerTask = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      order: maxOrder + 1,
    };

    const updated = [...currentTasks, newTask];
    saveTasks(updated);
    setTasks(updated);
    return newTask;
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Omit<PlannerTask, 'id' | 'createdAt'>>) => {
    const currentTasks = getTasks();
    const index = currentTasks.findIndex(t => t.id === taskId);

    if (index !== -1) {
      const task = currentTasks[index];
      const updatedTask: PlannerTask = {
        ...task,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // If status changed to a "done" status, set completedAt
      if (updates.statusId) {
        const newStatus = statuses.find(s => s.id === updates.statusId);
        if (newStatus?.isDone && !task.completedAt) {
          updatedTask.completedAt = new Date().toISOString();
        } else if (!newStatus?.isDone) {
          updatedTask.completedAt = undefined;
        }
      }

      currentTasks[index] = updatedTask;
      saveTasks(currentTasks);
      setTasks([...currentTasks]);
      return updatedTask;
    }
    return null;
  }, [statuses]);

  const deleteTask = useCallback((taskId: string) => {
    const currentTasks = getTasks();
    const updated = currentTasks.filter(t => t.id !== taskId);
    saveTasks(updated);
    setTasks(updated);
  }, []);

  const reorderTask = useCallback((taskId: string, newStatusId: string, newOrder: number) => {
    const currentTasks = getTasks();
    const taskIndex = currentTasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) return;

    const task = currentTasks[taskIndex];
    const oldStatusId = task.statusId;

    // Update task's status and order
    const updatedTask: PlannerTask = {
      ...task,
      statusId: newStatusId,
      order: newOrder,
      updatedAt: new Date().toISOString(),
    };

    // Handle completion status
    const newStatus = statuses.find(s => s.id === newStatusId);
    if (newStatus?.isDone && !task.completedAt) {
      updatedTask.completedAt = new Date().toISOString();
    } else if (!newStatus?.isDone) {
      updatedTask.completedAt = undefined;
    }

    // Reorder other tasks in the target status
    const tasksInNewStatus = currentTasks
      .filter(t => t.id !== taskId && t.statusId === newStatusId)
      .sort((a, b) => a.order - b.order);

    // Insert at new position and update orders
    tasksInNewStatus.splice(newOrder, 0, updatedTask);
    tasksInNewStatus.forEach((t, i) => {
      t.order = i;
    });

    // Update tasks in old status if different
    if (oldStatusId !== newStatusId) {
      const tasksInOldStatus = currentTasks
        .filter(t => t.id !== taskId && t.statusId === oldStatusId)
        .sort((a, b) => a.order - b.order);
      tasksInOldStatus.forEach((t, i) => {
        t.order = i;
      });
    }

    // Rebuild full task list
    const otherTasks = currentTasks.filter(
      t => t.statusId !== newStatusId && t.statusId !== oldStatusId
    );
    const tasksInOldStatusUpdated = oldStatusId !== newStatusId
      ? currentTasks
          .filter(t => t.id !== taskId && t.statusId === oldStatusId)
          .sort((a, b) => a.order - b.order)
          .map((t, i) => ({ ...t, order: i }))
      : [];

    const updated = [
      ...otherTasks,
      ...tasksInNewStatus,
      ...(oldStatusId !== newStatusId ? tasksInOldStatusUpdated : []),
    ];

    saveTasks(updated);
    setTasks(updated);
  }, [statuses]);

  // === STATUS CRUD ===

  const createStatus = useCallback((statusData: Omit<TaskStatus, 'id' | 'order'>) => {
    const currentStatuses = getStatuses();
    const maxOrder = currentStatuses.length > 0
      ? Math.max(...currentStatuses.map(s => s.order))
      : -1;

    const newStatus: TaskStatus = {
      ...statusData,
      id: crypto.randomUUID(),
      order: maxOrder + 1,
    };

    const updated = [...currentStatuses, newStatus];
    saveStatuses(updated);
    setStatuses(updated);
    return newStatus;
  }, []);

  const updateStatus = useCallback((statusId: string, updates: Partial<Omit<TaskStatus, 'id'>>) => {
    const currentStatuses = getStatuses();
    const index = currentStatuses.findIndex(s => s.id === statusId);

    if (index !== -1) {
      currentStatuses[index] = { ...currentStatuses[index], ...updates };
      saveStatuses(currentStatuses);
      setStatuses([...currentStatuses]);

      // If isDone changed, update completedAt for all tasks in this status
      if (updates.isDone !== undefined) {
        const currentTasks = getTasks();
        const now = new Date().toISOString();
        let tasksChanged = false;

        currentTasks.forEach(task => {
          if (task.statusId === statusId) {
            if (updates.isDone && !task.completedAt) {
              task.completedAt = now;
              tasksChanged = true;
            } else if (!updates.isDone && task.completedAt) {
              task.completedAt = undefined;
              tasksChanged = true;
            }
          }
        });

        if (tasksChanged) {
          saveTasks(currentTasks);
          setTasks([...currentTasks]);
        }
      }

      return currentStatuses[index];
    }
    return null;
  }, []);

  const deleteStatus = useCallback((statusId: string) => {
    const currentStatuses = getStatuses();
    // Prevent deleting if it's the only status
    if (currentStatuses.length <= 1) return false;

    // Move tasks to first available status
    const remaining = currentStatuses.filter(s => s.id !== statusId);
    const fallbackStatusId = remaining[0].id;

    const currentTasks = getTasks();
    currentTasks.forEach(task => {
      if (task.statusId === statusId) {
        task.statusId = fallbackStatusId;
      }
    });
    saveTasks(currentTasks);
    setTasks([...currentTasks]);

    // Reorder remaining statuses
    remaining.forEach((s, i) => {
      s.order = i;
    });
    saveStatuses(remaining);
    setStatuses(remaining);
    return true;
  }, []);

  const reorderStatuses = useCallback((newOrder: string[]) => {
    const currentStatuses = getStatuses();
    const reordered = newOrder
      .map((id, index) => {
        const status = currentStatuses.find(s => s.id === id);
        return status ? { ...status, order: index } : null;
      })
      .filter((s): s is TaskStatus => s !== null);

    saveStatuses(reordered);
    setStatuses(reordered);
  }, []);

  // === VIEW CRUD ===

  const createView = useCallback((viewData: Omit<TaskView, 'id'>) => {
    const newView: TaskView = {
      ...viewData,
      id: crypto.randomUUID(),
    };

    const currentViews = getViews();
    const updated = [...currentViews, newView];
    saveViews(updated);
    setViews(updated);
    return newView;
  }, []);

  const updateView = useCallback((viewId: string, updates: Partial<Omit<TaskView, 'id'>>) => {
    const currentViews = getViews();
    const index = currentViews.findIndex(v => v.id === viewId);

    if (index !== -1) {
      currentViews[index] = { ...currentViews[index], ...updates };
      saveViews(currentViews);
      setViews([...currentViews]);
      return currentViews[index];
    }
    return null;
  }, []);

  const deleteView = useCallback((viewId: string) => {
    const currentViews = getViews();
    // Prevent deleting if it's the only view or default view
    if (currentViews.length <= 1) return false;

    const viewToDelete = currentViews.find(v => v.id === viewId);
    if (viewToDelete?.isDefault) return false;

    const updated = currentViews.filter(v => v.id !== viewId);
    saveViews(updated);
    setViews(updated);

    // Switch to default view if active view was deleted
    if (activeViewId === viewId) {
      const defaultView = updated.find(v => v.isDefault) || updated[0];
      setActiveViewId(defaultView.id);
    }

    return true;
  }, [activeViewId]);

  // === FILTERING & SORTING ===

  const filterTasks = useCallback((filters: TaskViewFilter): PlannerTask[] => {
    let filtered = [...tasks];

    // Filter by status
    if (filters.statusIds && filters.statusIds.length > 0) {
      filtered = filtered.filter(t => filters.statusIds!.includes(t.statusId));
    }

    // Filter by project
    if (filters.projectIds && filters.projectIds.length > 0) {
      filtered = filtered.filter(t =>
        t.projectIds.some(pid => filters.projectIds!.includes(pid))
      );
    }

    // Filter by priority
    if (filters.priorities && filters.priorities.length > 0) {
      filtered = filtered.filter(t =>
        t.priority && filters.priorities!.includes(t.priority)
      );
    }

    // Filter by date range
    if (filters.dateRange) {
      if (filters.dateRange.start) {
        filtered = filtered.filter(t =>
          t.dueDate && t.dueDate >= filters.dateRange!.start!
        );
      }
      if (filters.dateRange.end) {
        filtered = filtered.filter(t =>
          t.dueDate && t.dueDate <= filters.dateRange!.end!
        );
      }
    }

    // Filter by scheduled date
    if (filters.scheduledDate) {
      const today = format(new Date(), 'yyyy-MM-dd');
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

      if (filters.scheduledDate === 'today') {
        filtered = filtered.filter(t => t.scheduledDate === today);
      } else if (filters.scheduledDate === 'week') {
        filtered = filtered.filter(t =>
          t.scheduledDate && t.scheduledDate >= weekStart && t.scheduledDate <= weekEnd
        );
      } else if (filters.scheduledDate === 'overdue') {
        filtered = filtered.filter(t => {
          if (!t.dueDate) return false;
          const dueDate = parseISO(t.dueDate);
          const isCompleted = statuses.find(s => s.id === t.statusId)?.isDone;
          return !isCompleted && isBefore(dueDate, startOfDay(new Date()));
        });
      } else {
        // Specific date
        filtered = filtered.filter(t => t.scheduledDate === filters.scheduledDate);
      }
    }

    // Filter completed tasks
    if (!filters.showCompleted) {
      const doneStatusIds = statuses.filter(s => s.isDone).map(s => s.id);
      filtered = filtered.filter(t => !doneStatusIds.includes(t.statusId));
    }

    return filtered;
  }, [tasks, statuses]);

  const sortTasks = useCallback((
    tasksToSort: PlannerTask[],
    sortBy: TaskView['sortBy'],
    sortOrder: TaskView['sortOrder']
  ): PlannerTask[] => {
    const sorted = [...tasksToSort];
    const multiplier = sortOrder === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'order':
          return (a.order - b.order) * multiplier;
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate) * multiplier;
        case 'priority':
          const aPriority = a.priority ? priorityOrder[a.priority] : 0;
          const bPriority = b.priority ? priorityOrder[b.priority] : 0;
          return (bPriority - aPriority) * multiplier;
        case 'createdAt':
          return a.createdAt.localeCompare(b.createdAt) * multiplier;
        case 'title':
          return a.title.localeCompare(b.title) * multiplier;
        default:
          return 0;
      }
    });

    return sorted;
  }, []);

  const getTasksForView = useCallback((view: TaskView): PlannerTask[] => {
    const filtered = filterTasks(view.filters);
    return sortTasks(filtered, view.sortBy, view.sortOrder);
  }, [filterTasks, sortTasks]);

  const getTasksByStatus = useCallback((view?: TaskView): Map<string, PlannerTask[]> => {
    const tasksToGroup = view ? getTasksForView(view) : tasks;
    const grouped = new Map<string, PlannerTask[]>();

    // Initialize all statuses with empty arrays
    statuses.forEach(status => {
      grouped.set(status.id, []);
    });

    // Group tasks by status
    tasksToGroup.forEach(task => {
      const statusTasks = grouped.get(task.statusId) || [];
      statusTasks.push(task);
      grouped.set(task.statusId, statusTasks);
    });

    // Sort tasks within each status
    grouped.forEach((statusTasks, statusId) => {
      grouped.set(statusId, statusTasks.sort((a, b) => a.order - b.order));
    });

    return grouped;
  }, [tasks, statuses, getTasksForView]);

  // === ACTIVE VIEW ===

  const activeView = views.find(v => v.id === activeViewId) || views[0];

  // === STATS ===

  const getTaskStats = useCallback(() => {
    const total = tasks.length;
    const doneStatusIds = statuses.filter(s => s.isDone).map(s => s.id);
    const completed = tasks.filter(t => doneStatusIds.includes(t.statusId)).length;
    const pending = total - completed;

    const today = format(new Date(), 'yyyy-MM-dd');
    const scheduledToday = tasks.filter(t => t.scheduledDate === today && !doneStatusIds.includes(t.statusId)).length;

    const overdue = tasks.filter(t => {
      if (!t.dueDate || doneStatusIds.includes(t.statusId)) return false;
      return isBefore(parseISO(t.dueDate), startOfDay(new Date()));
    }).length;

    return { total, completed, pending, scheduledToday, overdue };
  }, [tasks, statuses]);

  return {
    // Data
    tasks,
    statuses,
    views,
    activeView,
    activeViewId,

    // Task operations
    createTask,
    updateTask,
    deleteTask,
    reorderTask,

    // Status operations
    createStatus,
    updateStatus,
    deleteStatus,
    reorderStatuses,

    // View operations
    createView,
    updateView,
    deleteView,
    setActiveViewId,

    // Queries
    filterTasks,
    sortTasks,
    getTasksForView,
    getTasksByStatus,
    getTaskStats,

    // Utils
    refresh,
  };
}
