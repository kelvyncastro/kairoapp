import * as React from 'react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

interface HabitProgressChartProps {
  dailyScores: { day: number; score: number }[];
}

const HabitProgressChart = React.memo(function HabitProgressChart({ dailyScores }: HabitProgressChartProps) {
  const isMobile = useIsMobile();
  
  const chartData = React.useMemo(() => {
    return dailyScores.map(({ day, score }) => ({
      day,
      score,
    }));
  }, [dailyScores]);

  if (chartData.length === 0) {
    return (
      <div className="h-24 md:h-32 flex items-center justify-center text-muted-foreground text-xs md:text-sm">
        Adicione hábitos para ver seu progresso.
      </div>
    );
  }

  return (
    <div className="h-24 md:h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
            interval={isMobile ? 2 : 0}
            tickCount={chartData.length}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
            width={45}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg">
                    <p className="text-xs text-muted-foreground">Dia {payload[0].payload.day}</p>
                    <p className="text-sm font-semibold text-foreground">{payload[0].value}%</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="hsl(var(--destructive))"
            strokeWidth={2}
            fill="url(#scoreGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

export { HabitProgressChart };
