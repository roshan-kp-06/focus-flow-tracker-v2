import { useState } from 'react';
import { Plus, List, Columns3, Search, Filter, Check, ChevronDown, Calendar, Flag, MoreHorizontal, X, Trash2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PlannerTask, TaskStatus, TaskView, Project, TaskPriority, TimerState } from '@/types';
import { format, parseISO, isToday, isTomorrow, isPast, startOfDay } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel';
import { KanbanView } from '@/components/tasks/KanbanView';

interface TaskPlannerHook {
  tasks: PlannerTask[];
  statuses: TaskStatus[];
  views: TaskView[];
  activeView: TaskView;
  activeViewId: string;
  createTask: (taskData: Omit<PlannerTask, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => PlannerTask;
  updateTask: (taskId: string, updates: Partial<Omit<PlannerTask, 'id' | 'createdAt'>>) => PlannerTask | null;
  deleteTask: (taskId: string) => void;
  reorderTask: (taskId: string, newStatusId: string, newOrder: number) => void;
  createStatus: (statusData: Omit<TaskStatus, 'id' | 'order'>) => TaskStatus;
  updateStatus: (statusId: string, updates: Partial<Omit<TaskStatus, 'id'>>) => TaskStatus | null;
  deleteStatus: (statusId: string) => boolean;
  reorderStatuses: (newOrder: string[]) => void;
  createView: (viewData: Omit<TaskView, 'id'>) => TaskView;
  updateView: (viewId: string, updates: Partial<Omit<TaskView, 'id'>>) => TaskView | null;
  deleteView: (viewId: string) => boolean;
  setActiveViewId: (viewId: string) => void;
  filterTasks: (filters: TaskView['filters']) => PlannerTask[];
  sortTasks: (tasks: PlannerTask[], sortBy: TaskView['sortBy'], sortOrder: TaskView['sortOrder']) => PlannerTask[];
  getTasksForView: (view: TaskView) => PlannerTask[];
  getTasksByStatus: (view?: TaskView) => Map<string, PlannerTask[]>;
  getTaskStats: () => { total: number; completed: number; pending: number; scheduledToday: number; overdue: number };
  refresh: () => void;
}

interface TasksProps {
  taskPlanner: TaskPlannerHook;
  projects: Project[];
  onStartTimer?: (task: PlannerTask) => void;
  timerState?: TimerState;
}

const priorityConfig: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  urgent: { label: 'Urgent', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  high: { label: 'High', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  medium: { label: 'Medium', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  low: { label: 'Low', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
};

export function Tasks({ taskPlanner, projects, onStartTimer, timerState }: TasksProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    statuses,
    views,
    activeView,
    activeViewId,
    createTask,
    updateTask,
    deleteTask,
    reorderTask,
    setActiveViewId,
    getTasksForView,
    getTasksByStatus,
    getTaskStats,
  } = taskPlanner;

  const stats = getTaskStats();
  const filteredTasks = getTasksForView(activeView);
  const tasksByStatus = getTasksByStatus(activeView);

  // Apply search filter
  const displayedTasks = searchQuery
    ? filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredTasks;

  const selectedTask = selectedTaskId
    ? filteredTasks.find(t => t.id === selectedTaskId) || null
    : null;

  const handleCreateTask = () => {
    if (newTaskTitle.trim()) {
      const defaultStatus = statuses.find(s => !s.isDone) || statuses[0];
      createTask({
        title: newTaskTitle.trim(),
        statusId: defaultStatus.id,
        projectIds: [],
      });
      setNewTaskTitle('');
      setIsCreatingTask(false);
    }
  };

  const handleQuickStatusChange = (taskId: string, newStatusId: string) => {
    updateTask(taskId, { statusId: newStatusId });
  };

  const formatDueDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isPast(startOfDay(date))) return format(date, 'MMM d') + ' (overdue)';
    return format(date, 'MMM d');
  };

  const isOverdue = (task: PlannerTask) => {
    if (!task.dueDate) return false;
    const status = statuses.find(s => s.id === task.statusId);
    if (status?.isDone) return false;
    return isPast(startOfDay(parseISO(task.dueDate)));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            {stats.pending} pending · {stats.scheduledToday} today · {stats.overdue > 0 && (
              <span className="text-red-500">{stats.overdue} overdue</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>

          {/* View Selector */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveViewId(view.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  activeViewId === view.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {view.type === 'list' ? (
                  <List className="h-4 w-4" />
                ) : (
                  <Columns3 className="h-4 w-4" />
                )}
                {view.name}
              </button>
            ))}
          </div>

          {/* Add Task Button */}
          <Button onClick={() => setIsCreatingTask(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex gap-4">
        {/* Task List / Kanban */}
        <div className={cn(
          "flex-1 min-w-0",
          selectedTaskId && "max-w-[calc(100%-400px)]"
        )}>
          {activeView.type === 'list' ? (
            <div className="bg-card border border-border rounded-lg overflow-hidden h-full flex flex-col">
              {/* Quick Add */}
              {isCreatingTask && (
                <div className="p-3 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Task title..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateTask();
                        if (e.key === 'Escape') {
                          setIsCreatingTask(false);
                          setNewTaskTitle('');
                        }
                      }}
                      autoFocus
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleCreateTask} disabled={!newTaskTitle.trim()}>
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsCreatingTask(false);
                        setNewTaskTitle('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Task List */}
              <div className="flex-1 overflow-auto">
                {displayedTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <p className="text-sm">No tasks yet</p>
                    <Button
                      variant="link"
                      className="text-sm"
                      onClick={() => setIsCreatingTask(true)}
                    >
                      Create your first task
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {displayedTasks.map((task) => {
                      const status = statuses.find(s => s.id === task.statusId);
                      const taskProjects = projects.filter(p => task.projectIds.includes(p.id));
                      const overdue = isOverdue(task);

                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors",
                            selectedTaskId === task.id && "bg-muted/50"
                          )}
                        >
                          {/* Status indicator / checkbox */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className={cn(
                                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                  status?.isDone
                                    ? "bg-primary border-primary"
                                    : "border-border hover:border-primary"
                                )}
                              >
                                {status?.isDone && <Check className="h-3 w-3 text-primary-foreground" />}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-1" align="start">
                              {statuses.map((s) => (
                                <button
                                  key={s.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickStatusChange(task.id, s.id);
                                  }}
                                  className={cn(
                                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors",
                                    task.statusId === s.id && "bg-muted"
                                  )}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: s.color }}
                                  />
                                  {s.name}
                                </button>
                              ))}
                            </PopoverContent>
                          </Popover>

                          {/* Task info */}
                          <div className="flex-1 min-w-0">
                            <div className={cn(
                              "text-sm font-medium truncate",
                              status?.isDone && "line-through text-muted-foreground"
                            )}>
                              {task.title}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {taskProjects.length > 0 && (
                                <div className="flex items-center gap-1">
                                  {taskProjects.map(p => (
                                    <span
                                      key={p.id}
                                      className="text-xs text-muted-foreground flex items-center gap-1"
                                    >
                                      <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: p.color }}
                                      />
                                      {p.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Meta info */}
                          <div className="flex items-center gap-2">
                            {task.priority && (
                              <span className={cn(
                                "text-xs px-1.5 py-0.5 rounded",
                                priorityConfig[task.priority].bgColor,
                                priorityConfig[task.priority].color
                              )}>
                                {priorityConfig[task.priority].label}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className={cn(
                                "text-xs flex items-center gap-1",
                                overdue ? "text-red-500" : "text-muted-foreground"
                              )}>
                                <Calendar className="h-3 w-3" />
                                {formatDueDate(task.dueDate)}
                              </span>
                            )}
                          </div>

                          {/* Start Timer */}
                          {onStartTimer && !status?.isDone && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartTimer(task);
                              }}
                              disabled={timerState !== 'idle'}
                              title={timerState !== 'idle' ? 'Stop current timer first' : 'Start timer for this task'}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {onStartTimer && !status?.isDone && (
                                <>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onStartTimer(task);
                                    }}
                                    disabled={timerState !== 'idle'}
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    Start Timer
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTaskId(task.id);
                                }}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTask(task.id);
                                  if (selectedTaskId === task.id) {
                                    setSelectedTaskId(null);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <KanbanView
              tasks={displayedTasks}
              statuses={statuses}
              projects={projects}
              onTaskClick={setSelectedTaskId}
              onStatusChange={handleQuickStatusChange}
              onReorderTask={reorderTask}
              onDeleteTask={deleteTask}
              selectedTaskId={selectedTaskId}
              isCreatingTask={isCreatingTask}
              newTaskTitle={newTaskTitle}
              onNewTaskTitleChange={setNewTaskTitle}
              onCreateTask={handleCreateTask}
              onCancelCreate={() => {
                setIsCreatingTask(false);
                setNewTaskTitle('');
              }}
              onStartTimer={onStartTimer}
              timerState={timerState}
            />
          )}
        </div>

        {/* Detail Panel */}
        {selectedTask && (
          <TaskDetailPanel
            task={selectedTask}
            statuses={statuses}
            projects={projects}
            onUpdate={(updates) => updateTask(selectedTask.id, updates)}
            onDelete={() => {
              deleteTask(selectedTask.id);
              setSelectedTaskId(null);
            }}
            onClose={() => setSelectedTaskId(null)}
          />
        )}
      </div>
    </div>
  );
}
