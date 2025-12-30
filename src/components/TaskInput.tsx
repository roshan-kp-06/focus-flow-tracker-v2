import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TaskInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function TaskInput({ value, onChange }: TaskInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="task" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        What are you working on?
      </Label>
      <Input
        id="task"
        type="text"
        placeholder="e.g., Writing the API documentation..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20"
      />
    </div>
  );
}
