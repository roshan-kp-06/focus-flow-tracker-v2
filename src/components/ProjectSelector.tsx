import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ProjectSelectorProps {
  projects: Project[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onCreateProject: (name: string, color: string) => void;
}

const colors = [
  'hsl(32, 95%, 55%)',
  'hsl(175, 60%, 45%)',
  'hsl(280, 65%, 60%)',
  'hsl(200, 80%, 55%)',
  'hsl(340, 75%, 55%)',
  'hsl(142, 71%, 45%)',
];

export function ProjectSelector({
  projects,
  selectedIds,
  onSelectionChange,
  onCreateProject,
}: ProjectSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState(colors[0]);

  const toggleProject = (projectId: string) => {
    if (selectedIds.includes(projectId)) {
      onSelectionChange(selectedIds.filter(id => id !== projectId));
    } else {
      onSelectionChange([...selectedIds, projectId]);
    }
  };

  const handleCreate = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim(), selectedColor);
      setNewProjectName('');
      setIsCreating(false);
    }
  };

  const selectedProjects = projects.filter(p => selectedIds.includes(p.id));

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Projects
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <button className="w-full flex flex-wrap items-center gap-2 min-h-[44px] px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 text-left hover:border-primary/30 transition-colors">
            {selectedProjects.length > 0 ? (
              selectedProjects.map(project => (
                <span
                  key={project.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium"
                  style={{ backgroundColor: `${project.color}20`, color: project.color }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  {project.name}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">Select projects...</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3 bg-popover border-border" align="start">
          <div className="space-y-2">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => toggleProject(project.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  selectedIds.includes(project.id)
                    ? 'bg-primary/10'
                    : 'hover:bg-secondary'
                )}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <span className="flex-1 text-left text-sm font-medium">
                  {project.name}
                </span>
                {selectedIds.includes(project.id) && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}

            {isCreating ? (
              <div className="pt-2 border-t border-border space-y-3">
                <Input
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="bg-secondary border-border/50"
                  autoFocus
                />
                <div className="flex gap-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        'w-6 h-6 rounded-full transition-transform',
                        selectedColor === color && 'ring-2 ring-offset-2 ring-offset-popover ring-primary scale-110'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsCreating(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={!newProjectName.trim()}
                    className="flex-1"
                  >
                    Create
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">New project</span>
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
