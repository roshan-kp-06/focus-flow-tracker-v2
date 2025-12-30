import { useState, useRef } from 'react';
import { Plus, MoreHorizontal, Trash2, Calendar, Flag, Check, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PlannerTask, TaskStatus, Project, TaskPriority, TimerState } from '@/types';
import { format, parseISO, isToday, isTomorrow, isPast, startOfDay } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface KanbanViewProps {
  tasks: PlannerTask[];
  statuses: TaskStatus[];
  projects: Project[];
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatusId: string) => void;
  onReorderTask: (taskId: string, newStatusId: string, newOrder: number) => void;
  onDeleteTask: (taskId: string) => void;
  selectedTaskId: string | null;
  isCreatingTask: boolean;
  newTaskTitle: string;
  onNewTaskTitleChange: (title: string) => void;
  onCreateTask: () => void;
  onCancelCreate: () => void;
  onStartTimer?: (task: PlannerTask) => void;
  timerState?: TimerState;
}

const priorityConfig: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  urgent: { label: 'Urgent', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  high: { label: 'High', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  medium: { label: 'Medium', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  low: { label: 'Low', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
};

export function KanbanView({
  tasks,
  statuses,
  projects,
  onTaskClick,
  onStatusChange,
  onReorderTask,
  onDeleteTask,
  selectedTaskId,
  isCreatingTask,
  newTaskTitle,
  onNewTaskTitleChange,
  onCreateTask,
  onCancelCreate,
  onStartTimer,
  timerState,
}: KanbanViewProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatusId, setDragOverStatusId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [addingToStatusId, setAddingToStatusId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');

  // Group tasks by status
  const tasksByStatus = new Map<string, PlannerTask[]>();
  statuses.forEach(status => {
    tasksByStatus.set(status.id, []);
  });
  tasks.forEach(task => {
    const statusTasks = tasksByStatus.get(task.statusId) || [];
    statusTasks.push(task);
    tasksByStatus.set(task.statusId, statusTasks);
  });
  // Sort tasks within each status by order
  tasksByStatus.forEach((statusTasks, statusId) => {
    statusTasks.sort((a, b) => a.order - b.order);
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverStatusId(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, statusId: string, index?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatusId(statusId);
    if (index !== undefined) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverStatusId(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, statusId: string, dropIndex: number) => {
    e.preventDefault();
    if (draggedTaskId) {
      onReorderTask(draggedTaskId, statusId, dropIndex);
    }
    handleDragEnd();
  };

  const formatDueDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isPast(startOfDay(date))) return format(date, 'MMM d');
    return format(date, 'MMM d');
  };

  const isOverdue = (task: PlannerTask) => {
    if (!task.dueDate) return false;
    const status = statuses.find(s => s.id === task.statusId);
    if (status?.isDone) return false;
    return isPast(startOfDay(parseISO(task.dueDate)));
  };

  const handleAddCard = (statusId: string) => {
    if (newCardTitle.trim()) {
      // This would be better with a dedicated quick-add function, but for now we'll use a workaround
      onNewTaskTitleChange(newCardTitle.trim());
      // We need to pass the statusId somehow - for now, rely on the parent's default
      onCreateTask();
      setNewCardTitle('');
      setAddingToStatusId(null);
    }
  };

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {statuses.sort((a, b) => a.order - b.order).map((status) => {
        const statusTasks = tasksByStatus.get(status.id) || [];
        const isOver = dragOverStatusId === status.id;

        return (
          <div
            key={status.id}
            className={cn(
              "flex-shrink-0 w-[300px] bg-muted/30 rounded-lg flex flex-col",
              isOver && "ring-2 ring-primary/50"
            )}
            onDragOver={(e) => handleDragOver(e, status.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status.id, statusTasks.length)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between p-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <span className="font-medium text-sm">{status.name}</span>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {statusTasks.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setAddingToStatusId(status.id)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-auto p-2 space-y-2">
              {/* Quick Add Card */}
              {addingToStatusId === status.id && (
                <div className="bg-card border border-border rounded-lg p-3 space-y-2">
                  <Input
                    placeholder="Task title..."
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCard(status.id);
                      if (e.key === 'Escape') {
                        setAddingToStatusId(null);
                        setNewCardTitle('');
                      }
                    }}
                    autoFocus
                    className="text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAddCard(status.id)}
                      disabled={!newCardTitle.trim()}
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAddingToStatusId(null);
                        setNewCardTitle('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {statusTasks.map((task, index) => {
                const taskProjects = projects.filter(p => task.projectIds.includes(p.id));
                const overdue = isOverdue(task);
                const isDragging = draggedTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, status.id, index)}
                    onDrop={(e) => {
                      e.stopPropagation();
                      handleDrop(e, status.id, index);
                    }}
                    onClick={() => onTaskClick(task.id)}
                    className={cn(
                      "bg-card border border-border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md group",
                      selectedTaskId === task.id && "ring-2 ring-primary",
                      isDragging && "opacity-50 scale-95",
                      dragOverStatusId === status.id && dragOverIndex === index && "border-t-2 border-t-primary"
                    )}
                  >
                    {/* Title */}
                    <div className={cn(
                      "text-sm font-medium mb-2",
                      status.isDone && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {task.priority && (
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded flex items-center gap-1",
                          priorityConfig[task.priority].bgColor,
                          priorityConfig[task.priority].color
                        )}>
                          <Flag className="h-3 w-3" />
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

                    {/* Projects */}
                    {taskProjects.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
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

                    {/* Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      {onStartTimer && !status.isDone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartTimer(task);
                          }}
                          disabled={timerState !== 'idle'}
                          title={timerState !== 'idle' ? 'Stop current timer first' : 'Start timer'}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onStartTimer && !status.isDone && (
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
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick(task.id);
                          }}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteTask(task.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}

              {/* Empty state */}
              {statusTasks.length === 0 && addingToStatusId !== status.id && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No tasks
                </div>
              )}
            </div>

            {/* Add button at bottom */}
            {addingToStatusId !== status.id && (
              <button
                onClick={() => setAddingToStatusId(status.id)}
                className="flex items-center gap-2 p-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-t border-border/50"
              >
                <Plus className="h-4 w-4" />
                Add task
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
