import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { format, parse, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, Edit2, Trash2, PiggyBank, ChartLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatedNumber } from "@/components/ui/animated-number";

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

interface InvestmentsTabProps {
  transactions: Transaction[];
  sectors: Sector[];
  allTransactions: Transaction[]; // All transactions for evolution chart
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export function InvestmentsTab({
  transactions,
  sectors,
  allTransactions,
  onEditTransaction,
  onDeleteTransaction,
}: InvestmentsTabProps) {
  const isMobile = useIsMobile();

  // Find the "Investimentos" sector
  const investmentSector = useMemo(() => {
    return sectors.find(s => s.name.toLowerCase().includes("investimento"));
  }, [sectors]);

  // Filter transactions from the investment sector (current month)
  const investmentTransactions = useMemo(() => {
    if (!investmentSector) return [];
    return transactions.filter(t => t.sector_id === investmentSector.id);
  }, [transactions, investmentSector]);

  // Calculate total invested in current month (expenses are negative)
  const totalInvestedThisMonth = useMemo(() => {
    return investmentTransactions.reduce((sum, t) => sum + Math.abs(t.value), 0);
  }, [investmentTransactions]);

  // Evolution chart data - last 6 months
  const evolutionData = useMemo(() => {
    if (!investmentSector) return [];

    const now = new Date();
    const sixMonthsAgo = subMonths(startOfMonth(now), 5);
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: endOfMonth(now) });

    let cumulativeTotal = 0;

    // Calculate previous total before 6 months ago
    allTransactions.forEach(t => {
      if (t.sector_id === investmentSector.id) {
        const transactionDate = parse(t.date, "yyyy-MM-dd", new Date());
        if (transactionDate < sixMonthsAgo) {
          cumulativeTotal += Math.abs(t.value);
        }
      }
    });

    return months.map((month) => {
      const monthStart = format(startOfMonth(month), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(month), "yyyy-MM-dd");

      // Get investments for this month
      const monthInvestments = allTransactions.filter(t => {
        if (t.sector_id !== investmentSector.id) return false;
        return t.date >= monthStart && t.date <= monthEnd;
      });

      const monthTotal = monthInvestments.reduce((sum, t) => sum + Math.abs(t.value), 0);
      cumulativeTotal += monthTotal;

      return {
        month: format(month, "MMM", { locale: ptBR }),
        fullMonth: format(month, "MMMM yyyy", { locale: ptBR }),
        invested: monthTotal,
        total: cumulativeTotal,
      };
    });
  }, [allTransactions, investmentSector]);

  const currentTotal = evolutionData.length > 0 ? evolutionData[evolutionData.length - 1].total : 0;
  const previousTotal = evolutionData.length > 1 ? evolutionData[evolutionData.length - 2].total : 0;
  const growth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatCurrencyShort = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  if (!investmentSector) {
    return (
      <div className="cave-card p-6 text-center">
        <PiggyBank className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-bold mb-2">Setor de Investimentos não encontrado</h3>
        <p className="text-sm text-muted-foreground">
          Crie um setor chamado "Investimentos" para acompanhar sua evolução.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="cave-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ChartLine className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Total Investido</span>
          </div>
          <p className="text-lg md:text-xl font-bold text-blue-500">
            <AnimatedNumber value={currentTotal} currency decimals={2} />
          </p>
        </div>
        <div className="cave-card p-4">
          <div className="flex items-center gap-2 mb-2">
            {growth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            <span className="text-xs text-muted-foreground">Este Mês</span>
          </div>
          <p className={cn(
            "text-lg md:text-xl font-bold",
            totalInvestedThisMonth > 0 ? "text-success" : "text-muted-foreground"
          )}>
            <AnimatedNumber value={totalInvestedThisMonth} currency decimals={2} />
          </p>
        </div>
      </div>

      {/* Evolution Chart */}
      <div className="cave-card p-4">
        <h3 className="font-bold text-sm md:text-base mb-4">Evolução dos Investimentos</h3>
        {evolutionData.length > 0 && currentTotal > 0 ? (
          <div className="h-48 md:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="investmentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickFormatter={(value) => formatCurrencyShort(value)}
                  width={50}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-xl">
                          <p className="text-xs text-muted-foreground mb-1 capitalize">{data.fullMonth}</p>
                          <p className="text-sm font-semibold text-blue-500">
                            Total: R$ {formatCurrency(data.total)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            No mês: R$ {formatCurrency(data.invested)}
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
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#investmentGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            Nenhum investimento registrado ainda.
          </div>
        )}
      </div>

      {/* Investment Transactions List */}
      <div className="cave-card p-4">
        <h3 className="font-bold text-sm md:text-base mb-4">Transações de Investimento</h3>
        {investmentTransactions.length === 0 ? (
          <div className="py-8 text-center">
            <PiggyBank className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum investimento neste mês</p>
          </div>
        ) : (
          <div className="space-y-2">
            {investmentTransactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parse(t.date, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-blue-500 whitespace-nowrap">
                    R$ {formatCurrency(Math.abs(t.value))}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEditTransaction(t)}
                      className="p-1.5 hover:bg-secondary rounded"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTransaction(t.id)}
                      className="p-1.5 hover:bg-red-500/10 rounded text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
