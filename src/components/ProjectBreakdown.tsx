interface ProjectData {
  projectId: string;
  projectName: string;
  color: string;
  hours: number;
  seconds: number;
}

interface ProjectBreakdownProps {
  data: ProjectData[];
  totalSeconds: number;
}

export function ProjectBreakdown({ data, totalSeconds }: ProjectBreakdownProps) {
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          By Project
        </h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          No sessions recorded this month
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
        By Project (This Month)
      </h3>
      <div className="space-y-4">
        {data.map((project) => {
          const percentage = totalSeconds > 0 ? (project.seconds / totalSeconds) * 100 : 0;
          
          return (
            <div key={project.projectId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {project.projectName}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDuration(project.seconds)}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: project.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
