import { useState, useEffect } from 'react';
import { X, Calendar, Flag, FolderOpen, Trash2, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PlannerTask, TaskStatus, Project, TaskPriority } from '@/types';
import { format, parseISO } from 'date-fns';
import { RichTextEditor } from '@/components/notes/RichTextEditor';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface TaskDetailPanelProps {
  task: PlannerTask;
  statuses: TaskStatus[];
  projects: Project[];
  onUpdate: (updates: Partial<Omit<PlannerTask, 'id' | 'createdAt'>>) => void;
  onDelete: () => void;
  onClose: () => void;
}

const priorityConfig: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  urgent: { label: 'Urgent', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  high: { label: 'High', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  medium: { label: 'Medium', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  low: { label: 'Low', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
};

const priorities: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];

export function TaskDetailPanel({
  task,
  statuses,
  projects,
  onUpdate,
  onDelete,
  onClose,
}: TaskDetailPanelProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Update local state when task changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
  }, [task.id, task.title, task.description]);

  const currentStatus = statuses.find(s => s.id === task.statusId);
  const taskProjects = projects.filter(p => task.projectIds.includes(p.id));

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      onUpdate({ title: title.trim() });
    }
  };

  const handleDescriptionChange = (newDescription: string) => {
    setDescription(newDescription);
    onUpdate({ description: newDescription });
  };

  const handleStatusChange = (statusId: string) => {
    onUpdate({ statusId });
  };

  const handlePriorityChange = (priority: TaskPriority | undefined) => {
    onUpdate({ priority });
  };

  const handleDueDateChange = (date: Date | undefined) => {
    onUpdate({ dueDate: date ? format(date, 'yyyy-MM-dd') : undefined });
  };

  const handleScheduledDateChange = (date: Date | undefined) => {
    onUpdate({ scheduledDate: date ? format(date, 'yyyy-MM-dd') : undefined });
  };

  const handleProjectToggle = (projectId: string) => {
    const newProjectIds = task.projectIds.includes(projectId)
      ? task.projectIds.filter(id => id !== projectId)
      : [...task.projectIds, projectId];
    onUpdate({ projectIds: newProjectIds });
  };

  return (
    <div className="w-[400px] bg-card border border-border rounded-lg flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <span className="text-sm font-medium text-muted-foreground">Task Details</span>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Title */}
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
          className="text-lg font-semibold border-none px-0 focus-visible:ring-0"
          placeholder="Task title"
        />

        {/* Status */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase">Status</label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: currentStatus?.color }}
                  />
                  <span className="text-sm">{currentStatus?.name}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-1" align="start">
              {statuses.map((status) => (
                <button
                  key={status.id}
                  onClick={() => handleStatusChange(status.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-muted transition-colors",
                    task.statusId === status.id && "bg-muted"
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  {status.name}
                  {task.statusId === status.id && (
                    <Check className="h-4 w-4 ml-auto" />
                  )}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase">Priority</label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-2">
                  <Flag className={cn(
                    "h-4 w-4",
                    task.priority ? priorityConfig[task.priority].color : "text-muted-foreground"
                  )} />
                  <span className="text-sm">
                    {task.priority ? priorityConfig[task.priority].label : 'No priority'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-1" align="start">
              <button
                onClick={() => handlePriorityChange(undefined)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-muted transition-colors",
                  !task.priority && "bg-muted"
                )}
              >
                <Flag className="h-4 w-4 text-muted-foreground" />
                No priority
                {!task.priority && <Check className="h-4 w-4 ml-auto" />}
              </button>
              {priorities.map((priority) => (
                <button
                  key={priority}
                  onClick={() => handlePriorityChange(priority)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-muted transition-colors",
                    task.priority === priority && "bg-muted"
                  )}
                >
                  <Flag className={cn("h-4 w-4", priorityConfig[priority].color)} />
                  {priorityConfig[priority].label}
                  {task.priority === priority && <Check className="h-4 w-4 ml-auto" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase">Due Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {task.dueDate ? format(parseISO(task.dueDate), 'MMM d, yyyy') : 'No due date'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={task.dueDate ? parseISO(task.dueDate) : undefined}
                onSelect={handleDueDateChange}
                initialFocus
              />
              {task.dueDate && (
                <div className="p-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDueDateChange(undefined)}
                  >
                    Clear date
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Scheduled Date */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase">Scheduled For</label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {task.scheduledDate ? format(parseISO(task.scheduledDate), 'MMM d, yyyy') : 'Not scheduled'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={task.scheduledDate ? parseISO(task.scheduledDate) : undefined}
                onSelect={handleScheduledDateChange}
                initialFocus
              />
              {task.scheduledDate && (
                <div className="p-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => handleScheduledDateChange(undefined)}
                  >
                    Clear date
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Projects */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase">Projects</label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-2 flex-wrap">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  {taskProjects.length > 0 ? (
                    taskProjects.map(p => (
                      <span
                        key={p.id}
                        className="text-xs px-2 py-0.5 rounded-full bg-muted flex items-center gap-1"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        {p.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No projects</span>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-1" align="start">
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">No projects available</p>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectToggle(project.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-muted transition-colors",
                      task.projectIds.includes(project.id) && "bg-muted"
                    )}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    {project.name}
                    {task.projectIds.includes(project.id) && (
                      <Check className="h-4 w-4 ml-auto" />
                    )}
                  </button>
                ))
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase">Description</label>
          <RichTextEditor
            content={description}
            onChange={handleDescriptionChange}
            placeholder="Add a description..."
            className="min-h-[150px]"
          />
        </div>

        {/* Metadata */}
        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border">
          <p>Created: {format(parseISO(task.createdAt), 'MMM d, yyyy h:mm a')}</p>
          <p>Updated: {format(parseISO(task.updatedAt), 'MMM d, yyyy h:mm a')}</p>
          {task.completedAt && (
            <p>Completed: {format(parseISO(task.completedAt), 'MMM d, yyyy h:mm a')}</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {showDeleteConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground flex-1">Delete this task?</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
            >
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Task
          </Button>
        )}
      </div>
    </div>
  );
}
