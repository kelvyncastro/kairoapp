import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Wallet, Edit2, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  sectors: Sector[];
  transactions: Transaction[];
  allTransactions: Transaction[]; // All transactions across months for chart
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  currentMonth: Date;
}

export function InvestmentsTab({
  sectors,
  transactions,
  allTransactions,
  onEditTransaction,
  onDeleteTransaction,
  currentMonth,
}: InvestmentsTabProps) {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Find the investments sector
  const investmentsSector = useMemo(() => {
    return sectors.find(
      (s) => s.name.toLowerCase().includes("investimento") || s.name.toLowerCase().includes("investment")
    );
  }, [sectors]);

  // Filter transactions for investments sector (current month)
  const investmentTransactions = useMemo(() => {
    if (!investmentsSector) return [];
    return transactions
      .filter((t) => t.sector_id === investmentsSector.id)
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [transactions, investmentsSector, sortOrder]);

  // Calculate total invested this month
  const totalInvestedThisMonth = useMemo(() => {
    return investmentTransactions.reduce((sum, t) => sum + Math.abs(t.value), 0);
  }, [investmentTransactions]);

  // Calculate evolution chart data (last 12 months)
  const evolutionData = useMemo(() => {
    if (!investmentsSector) return [];

    const endMonth = endOfMonth(currentMonth);
    const startMonth = startOfMonth(subMonths(currentMonth, 11));
    const months = eachMonthOfInterval({ start: startMonth, end: endMonth });

    let cumulativeTotal = 0;

    // Get all investment transactions before the start of our 12-month window
    const priorTransactions = allTransactions.filter((t) => {
      if (t.sector_id !== investmentsSector.id) return false;
      const txDate = new Date(t.date);
      return txDate < startMonth;
    });

    // Calculate initial cumulative from prior transactions
    cumulativeTotal = priorTransactions.reduce((sum, t) => sum + Math.abs(t.value), 0);

    return months.map((month) => {
      const monthStart = format(startOfMonth(month), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(month), "yyyy-MM-dd");

      const monthTransactions = allTransactions.filter((t) => {
        if (t.sector_id !== investmentsSector.id) return false;
        return t.date >= monthStart && t.date <= monthEnd;
      });

      const monthTotal = monthTransactions.reduce((sum, t) => sum + Math.abs(t.value), 0);
      cumulativeTotal += monthTotal;

      return {
        month: format(month, "MMM", { locale: ptBR }),
        fullMonth: format(month, "MMMM yyyy", { locale: ptBR }),
        total: cumulativeTotal,
        added: monthTotal,
      };
    });
  }, [allTransactions, investmentsSector, currentMonth]);

  // Calculate growth percentage
  const growthPercentage = useMemo(() => {
    if (evolutionData.length < 2) return 0;
    const lastMonth = evolutionData[evolutionData.length - 1]?.total || 0;
    const previousMonth = evolutionData[evolutionData.length - 2]?.total || 0;
    if (previousMonth === 0) return lastMonth > 0 ? 100 : 0;
    return ((lastMonth - previousMonth) / previousMonth) * 100;
  }, [evolutionData]);

  const totalInvested = evolutionData[evolutionData.length - 1]?.total || 0;

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (!investmentsSector) {
    return (
      <div className="cave-card p-6 text-center">
        <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-bold text-lg mb-2">Setor de Investimentos não encontrado</h3>
        <p className="text-sm text-muted-foreground">
          Crie um setor chamado "Investimentos" para começar a acompanhar seus investimentos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="cave-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Total Investido</span>
          </div>
          <p className="text-lg md:text-xl font-bold text-blue-500">
            R$ {formatCurrency(totalInvested)}
          </p>
        </div>

        <div className="cave-card p-4">
          <div className="flex items-center gap-2 mb-2">
            {growthPercentage >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            <span className="text-xs text-muted-foreground">Este Mês</span>
          </div>
          <p className="text-lg md:text-xl font-bold">
            R$ {formatCurrency(totalInvestedThisMonth)}
          </p>
          <p
            className={cn(
              "text-xs mt-1",
              growthPercentage >= 0 ? "text-success" : "text-destructive"
            )}
          >
            {growthPercentage >= 0 ? "+" : ""}
            {growthPercentage.toFixed(1)}% vs mês anterior
          </p>
        </div>
      </div>

      {/* Evolution Chart */}
      <div className="cave-card p-4 md:p-6">
        <h3 className="font-bold text-sm md:text-base mb-4">Evolução dos Investimentos</h3>
        {evolutionData.length > 0 && totalInvested > 0 ? (
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="investmentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  tickFormatter={(value) =>
                    `${(value / 1000).toFixed(0)}k`
                  }
                  width={45}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-xl">
                          <p className="text-xs font-medium text-muted-foreground capitalize mb-1">
                            {data.fullMonth}
                          </p>
                          <p className="text-sm font-bold text-blue-500">
                            R$ {formatCurrency(data.total)}
                          </p>
                          {data.added > 0 && (
                            <p className="text-xs text-success mt-1">
                              +R$ {formatCurrency(data.added)} este mês
                            </p>
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

      {/* Transactions List */}
      <div className="cave-card p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm md:text-base">Transações de Investimento</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1"
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          >
            {sortOrder === "desc" ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
            <span className="text-xs">Data</span>
          </Button>
        </div>

        {investmentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhum investimento registrado este mês.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {investmentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{transaction.name}</p>
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 text-[10px]">
                      Investimento
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(transaction.date), "dd/MM/yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-blue-500">
                    R$ {formatCurrency(Math.abs(transaction.value))}
                  </p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEditTransaction(transaction)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onDeleteTransaction(transaction.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
