import * as React from 'react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

interface DailyExpense {
  date: string;
  day: string;
  total: number;
}

interface DailyExpensesChartProps {
  dailyExpenses: DailyExpense[];
}

const DailyExpensesChart = React.memo(function DailyExpensesChart({ dailyExpenses }: DailyExpensesChartProps) {
  const isMobile = useIsMobile();
  
  const chartData = React.useMemo(() => {
    return dailyExpenses.map(({ day, total }) => ({
      day: Number(day),
      total,
    }));
  }, [dailyExpenses]);

  const maxTotal = React.useMemo(() => {
    const max = Math.max(...chartData.map(d => d.total));
    return max > 0 ? max : 100;
  }, [chartData]);

  const hasData = chartData.some(d => d.total > 0);

  if (!hasData) {
    return (
      <div className="h-32 md:h-40 flex items-center justify-center text-muted-foreground text-xs md:text-sm">
        Nenhum gasto registrado neste mês.
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    });
  };

  return (
    <div className="h-32 md:h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
            interval={isMobile ? 4 : 2}
            tickCount={chartData.length}
          />
          <YAxis
            domain={[0, maxTotal]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            tickFormatter={(value) => `${formatCurrency(value)}`}
            width={50}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg">
                    <p className="text-xs text-muted-foreground">Dia {payload[0].payload.day}</p>
                    <p className="text-sm font-semibold text-foreground">
                      R$ {formatCurrency(payload[0].value as number)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#expenseGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

export { DailyExpensesChart };
