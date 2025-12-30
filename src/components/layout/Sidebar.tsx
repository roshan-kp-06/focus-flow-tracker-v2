import { Timer, BarChart3, Settings, Focus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: 'timer' | 'reports' | 'settings';
  onTabChange: (tab: 'timer' | 'reports' | 'settings') => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const navItems = [
    { id: 'timer' as const, label: 'Timer', icon: Timer },
    { id: 'reports' as const, label: 'Reports', icon: BarChart3 },
  ];

  const manageItems = [
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-56 h-screen bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Focus className="h-4 w-4 text-primary" />
          </div>
          <span className="text-base font-semibold text-foreground">DeepWork</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-6">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
            Timer
          </p>
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors',
                  activeTab === item.id
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
            Manage
          </p>
          <div className="space-y-0.5">
            {manageItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors',
                  activeTab === item.id
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
}
