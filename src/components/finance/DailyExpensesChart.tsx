import * as React from 'react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { FolderIconRenderer } from '@/components/tasks/FolderIconRenderer';

interface Sector {
  id: string;
  name: string;
  color_label: string;
  icon: string;
}

interface Transaction {
  id: string;
  name: string;
  date: string;
  value: number;
  sector_id: string | null;
  description: string | null;
  status: string;
}

interface DailyExpense {
  date: string;
  day: string;
  total: number;
}

interface DailyExpensesChartProps {
  dailyExpenses: DailyExpense[];
  transactions?: Transaction[];
  sectors?: Sector[];
}

interface SectorBreakdown {
  sector: Sector | null;
  total: number;
}

const DailyExpensesChart = React.memo(function DailyExpensesChart({ 
  dailyExpenses, 
  transactions = [], 
  sectors = [] 
}: DailyExpensesChartProps) {
  const isMobile = useIsMobile();
  
  const chartData = React.useMemo(() => {
    return dailyExpenses.map(({ date, day, total }) => ({
      date,
      day: Number(day),
      total,
    }));
  }, [dailyExpenses]);

  const maxTotal = React.useMemo(() => {
    const max = Math.max(...chartData.map(d => d.total));
    return max > 0 ? max : 100;
  }, [chartData]);

  const hasData = chartData.some(d => d.total > 0);

  const getBreakdownForDate = React.useCallback((date: string): SectorBreakdown[] => {
    const dayTransactions = transactions.filter(t => t.date === date && t.value < 0);
    
    const breakdownMap = new Map<string | null, number>();
    
    dayTransactions.forEach(t => {
      const sectorId = t.sector_id;
      const current = breakdownMap.get(sectorId) || 0;
      breakdownMap.set(sectorId, current + Math.abs(t.value));
    });

    const breakdown: SectorBreakdown[] = [];
    breakdownMap.forEach((total, sectorId) => {
      const sector = sectorId ? sectors.find(s => s.id === sectorId) || null : null;
      breakdown.push({ sector, total });
    });

    return breakdown.sort((a, b) => b.total - a.total);
  }, [transactions, sectors]);

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
                const data = payload[0].payload;
                const breakdown = getBreakdownForDate(data.date);
                
                return (
                  <div className="bg-background border border-border rounded-lg px-3 py-2.5 shadow-xl min-w-[160px]">
                    <div className="flex items-center justify-between gap-4 mb-2 pb-2 border-b border-border/50">
                      <p className="text-xs text-muted-foreground">Dia {data.day}</p>
                      <p className="text-sm font-bold text-foreground">
                        R$ {formatCurrency(data.total)}
                      </p>
                    </div>
                    
                    {breakdown.length > 0 ? (
                      <div className="space-y-1.5">
                        {breakdown.slice(0, 5).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            {item.sector ? (
                              <>
                                <div 
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: item.sector.color_label }}
                                />
                                <FolderIconRenderer 
                                  icon={item.sector.icon || "wallet"} 
                                  color={item.sector.color_label} 
                                  className="h-3 w-3 flex-shrink-0" 
                                />
                                <span className="text-xs flex-1 truncate">{item.sector.name}</span>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 rounded-full flex-shrink-0 bg-muted-foreground/50" />
                                <span className="text-xs flex-1 truncate text-muted-foreground">Sem categoria</span>
                              </>
                            )}
                            <span className="text-xs font-medium">R$ {formatCurrency(item.total)}</span>
                          </div>
                        ))}
                        {breakdown.length > 5 && (
                          <p className="text-[10px] text-muted-foreground text-center pt-1">
                            +{breakdown.length - 5} mais
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Nenhum gasto</p>
                    )}
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
