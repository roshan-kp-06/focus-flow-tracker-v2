import { Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { WorkSession, Project } from '@/types';
import { Button } from '@/components/ui/button';

interface SessionHistoryProps {
  sessions: WorkSession[];
  projects: Project[];
  onDeleteSession: (sessionId: string) => void;
}

export function SessionHistory({ sessions, projects, onDeleteSession }: SessionHistoryProps) {
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getProjectById = (id: string) => projects.find(p => p.id === id);

  // Group sessions by date
  const groupedSessions = sessions.reduce((acc, session) => {
    if (!acc[session.date]) {
      acc[session.date] = [];
    }
    acc[session.date].push(session);
    return acc;
  }, {} as Record<string, WorkSession[]>);

  const sortedDates = Object.keys(groupedSessions).sort((a, b) => b.localeCompare(a));

  if (sessions.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Recent Sessions
        </h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          No sessions recorded yet. Start your first focus session!
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
        Recent Sessions
      </h3>
      <div className="space-y-6 max-h-[400px] overflow-y-auto">
        {sortedDates.slice(0, 7).map((date) => (
          <div key={date}>
            <h4 className="text-xs font-medium text-muted-foreground mb-3">
              {format(parseISO(date), 'EEEE, MMMM d')}
            </h4>
            <div className="space-y-2">
              {groupedSessions[date].map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {session.taskName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(session.duration)}
                      </span>
                      {session.projectIds.length > 0 && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <div className="flex items-center gap-1">
                            {session.projectIds.map((projectId) => {
                              const project = getProjectById(projectId);
                              if (!project) return null;
                              return (
                                <span
                                  key={projectId}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs"
                                  style={{
                                    backgroundColor: `${project.color}20`,
                                    color: project.color,
                                  }}
                                >
                                  {project.name}
                                </span>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteSession(session.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
