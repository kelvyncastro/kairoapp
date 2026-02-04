import * as React from 'react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { startOfWeek, endOfWeek, eachWeekOfInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  // Generate week labels for the chart
  const weekLabels = React.useMemo(() => {
    if (chartData.length === 0) return [];
    const totalDays = chartData.length;
    const weeks: { day: number; label: string }[] = [];
    
    // Create week markers at day 1, 8, 15, 22, 29
    const weekStarts = [1, 8, 15, 22, 29];
    weekStarts.forEach((day, index) => {
      if (day <= totalDays) {
        weeks.push({ day, label: `Semana ${index + 1}` });
      }
    });
    
    return weeks;
  }, [chartData.length]);

  if (chartData.length === 0) {
    return (
      <div className="h-48 md:h-56 flex items-center justify-center text-muted-foreground text-xs md:text-sm bg-muted/5 rounded-lg border border-border/30">
        Adicione hábitos para ver seu progresso.
      </div>
    );
  }

  return (
    <div className="h-48 md:h-56 w-full bg-muted/5 rounded-lg border border-border/30 p-3 md:p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGradientPrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            strokeOpacity={0.3}
            vertical={false}
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 9 : 11 }}
            interval={isMobile ? 2 : 0}
            tickCount={chartData.length}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            tickFormatter={(value) => `${value}%`}
            width={40}
            ticks={[0, 25, 50, 75, 100]}
          />
          {/* Week separator lines */}
          {[8, 15, 22, 29].map((day) => (
            day <= chartData.length && (
              <ReferenceLine 
                key={day}
                x={day} 
                stroke="hsl(var(--border))" 
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
            )
          ))}
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const dayNum = payload[0].payload.day;
                const weekNum = Math.ceil(dayNum / 7);
                return (
                  <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg">
                    <p className="text-xs text-muted-foreground">Dia {dayNum} • Semana {weekNum}</p>
                    <p className="text-sm font-bold text-primary">{payload[0].value}%</p>
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
            fill="url(#scoreGradientPrimary)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

export { HabitProgressChart };
