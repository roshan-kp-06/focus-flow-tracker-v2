import { Check, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ProjectDropdownProps {
  projects: Project[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function ProjectDropdown({
  projects,
  selectedIds,
  onSelectionChange,
}: ProjectDropdownProps) {
  const toggleProject = (projectId: string) => {
    if (selectedIds.includes(projectId)) {
      onSelectionChange(selectedIds.filter(id => id !== projectId));
    } else {
      onSelectionChange([...selectedIds, projectId]);
    }
  };

  const selectedProjects = projects.filter(p => selectedIds.includes(p.id));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
          {selectedProjects.length > 0 ? (
            <div className="flex items-center gap-1.5">
              {selectedProjects.slice(0, 2).map(project => (
                <span
                  key={project.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${project.color}20`, color: project.color }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  {project.name}
                </span>
              ))}
              {selectedProjects.length > 2 && (
                <span className="text-xs text-muted-foreground">
                  +{selectedProjects.length - 2}
                </span>
              )}
            </div>
          ) : (
            <>
              <Tag className="h-4 w-4" />
              <span className="text-sm">Project</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-0.5">
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">
              No projects yet. Create one in Settings.
            </p>
          ) : (
            projects.map(project => (
              <button
                key={project.id}
                onClick={() => toggleProject(project.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors text-left',
                  selectedIds.includes(project.id)
                    ? 'bg-muted'
                    : 'hover:bg-muted/50'
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <span className="flex-1 text-sm font-medium">
                  {project.name}
                </span>
                {selectedIds.includes(project.id) && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
