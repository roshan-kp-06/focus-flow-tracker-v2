import { Timer, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationProps {
  activeTab: 'timer' | 'reports';
  onTabChange: (tab: 'timer' | 'reports') => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 p-1.5 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl">
        <button
          onClick={() => onTabChange('timer')}
          className={cn(
            'flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200',
            activeTab === 'timer'
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          )}
        >
          <Timer className="h-4 w-4" />
          Timer
        </button>
        <button
          onClick={() => onTabChange('reports')}
          className={cn(
            'flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200',
            activeTab === 'reports'
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          )}
        >
          <BarChart3 className="h-4 w-4" />
          Reports
        </button>
      </div>
    </nav>
  );
}
