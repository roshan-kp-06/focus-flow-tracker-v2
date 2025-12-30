import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';

interface DayData {
  date: string;
  dayName: string;
  hours: number;
}

interface DailyChartProps {
  data: DayData[];
}

export function DailyChart({ data }: DailyChartProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const hours = payload[0].value;
      const mins = Math.round((hours % 1) * 60);
      const wholeHours = Math.floor(hours);
      
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">
            {wholeHours > 0 ? `${wholeHours}h ` : ''}{mins}m focused
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
        This Week
      </h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <XAxis
              dataKey="dayName"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(240 5% 50%)', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(240 5% 50%)', fontSize: 12 }}
              tickFormatter={(value) => `${value}h`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(240 6% 14%)' }} />
            <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.date === today ? 'hsl(32 95% 55%)' : 'hsl(175 60% 45%)'}
                  opacity={entry.date === today ? 1 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
