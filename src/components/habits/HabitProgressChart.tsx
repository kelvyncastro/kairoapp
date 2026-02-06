import * as React from 'react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

interface HabitProgressChartProps {
  dailyScores: { day: number; score: number }[];
}

const HabitProgressChart = React.memo(function HabitProgressChart({ dailyScores }: HabitProgressChartProps) {
  const isMobile = useIsMobile();
  
  // Generate week labels for reference lines
  const weekLabels = React.useMemo(() => {
    const labels: { day: number; label: string }[] = [];
    const totalDays = dailyScores.length;
    for (let i = 1; i <= Math.ceil(totalDays / 7); i++) {
      labels.push({ day: (i - 1) * 7 + 1, label: `Semana ${i}` });
    }
    return labels;
  }, [dailyScores.length]);

  const chartData = React.useMemo(() => {
    return dailyScores.map(({ day, score }) => ({
      day,
      score,
    }));
  }, [dailyScores]);

  if (chartData.length === 0) {
    return (
      <div className="h-32 md:h-40 flex items-center justify-center text-muted-foreground text-xs md:text-sm">
        Adicione hábitos para ver seu progresso.
      </div>
    );
  }

  return (
    <div className="h-32 md:h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
            interval={isMobile ? 6 : 0}
            tickCount={chartData.length}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
            width={45}
            ticks={[0, 25, 50, 75, 100]}
          />
          {/* Week reference lines */}
          {weekLabels.map(({ day }) => (
            <ReferenceLine
              key={day}
              x={day}
              stroke="hsl(var(--border))"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
          ))}
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const dayNum = payload[0].payload.day;
                const weekNum = Math.ceil(dayNum / 7);
                return (
                  <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                    <p className="text-xs text-muted-foreground">Dia {dayNum} (Semana {weekNum})</p>
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
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#scoreGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

export { HabitProgressChart };
