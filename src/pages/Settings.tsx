import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Check, X, Sun, Moon } from 'lucide-react';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SettingsProps {
  projects: Project[];
  onCreateProject: (name: string, color: string) => void;
  onUpdateProject: (projectId: string, name: string, color: string) => void;
  onDeleteProject: (projectId: string) => void;
}

// Monochrome grey scale colors
const colors = [
  '#1a1a1a',
  '#404040',
  '#666666',
  '#808080',
  '#999999',
  '#b3b3b3',
];

export function Settings({
  projects,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
}: SettingsProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Apply theme on mount and change
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const handleCreate = () => {
    if (newName.trim()) {
      onCreateProject(newName.trim(), selectedColor);
      setNewName('');
      setIsCreating(false);
      setSelectedColor(colors[0]);
    }
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditColor(project.color);
  };

  const handleUpdate = () => {
    if (editingId && editName.trim()) {
      onUpdateProject(editingId, editName.trim(), editColor);
      setEditingId(null);
      setEditName('');
      setEditColor('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('');
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-6">Manage your projects and preferences.</p>

      {/* Appearance Section */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="font-medium mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-muted-foreground">Choose light or dark mode</p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setIsDark(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                !isDark
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sun className="h-4 w-4" />
              Light
            </button>
            <button
              onClick={() => setIsDark(true)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                isDark
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Moon className="h-4 w-4" />
              Dark
            </button>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">Projects</h2>
          {!isCreating && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Project
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {/* Create new project */}
          {isCreating && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Input
                placeholder="Project name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <div className="flex gap-1.5">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      'w-6 h-6 rounded-full transition-all border border-border',
                      selectedColor === color && 'ring-2 ring-offset-2 ring-foreground scale-110'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-1">
                <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Project list */}
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg group"
            >
              {editingId === project.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <div className="flex gap-1.5">
                    {colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setEditColor(color)}
                        className={cn(
                          'w-6 h-6 rounded-full transition-all border border-border',
                          editColor === color && 'ring-2 ring-offset-2 ring-foreground scale-110'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={handleUpdate} disabled={!editName.trim()}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="flex-1 text-sm font-medium">{project.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(project)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteProject(project.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {projects.length === 0 && !isCreating && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No projects yet. Create one to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
