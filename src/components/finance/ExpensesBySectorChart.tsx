import { useState } from "react";
import { cn } from "@/lib/utils";
import { FolderIconRenderer } from "@/components/tasks/FolderIconRenderer";

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

interface ExpensesBySectorChartProps {
  sectors: Sector[];
  transactions: Transaction[];
}

type ChartFilter = "paid" | "pending";

export function ExpensesBySectorChart({ sectors, transactions }: ExpensesBySectorChartProps) {
  const [chartFilter, setChartFilter] = useState<ChartFilter>("paid");

  // Filter transactions based on selected filter
  const filteredTransactions = transactions.filter((t) => {
    // Only expenses (negative values) and not "received" status
    if (t.value >= 0 || t.status === "received") return false;
    
    if (chartFilter === "paid") {
      return t.status === "paid";
    } else {
      return t.status === "pending";
    }
  });

  // Calculate expenses by sector
  const expensesBySector = sectors.map((sector) => {
    const total = filteredTransactions
      .filter((t) => t.sector_id === sector.id)
      .reduce((sum, t) => sum + Math.abs(t.value), 0);
    return { ...sector, total };
  }).filter((s) => s.total > 0);

  const totalExpenses = expensesBySector.reduce((sum, s) => sum + s.total, 0);

  // Format currency
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  return (
    <div className="cave-card p-6">
      {/* Header with title and filters */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg">Despesas</h3>
        <div className="flex bg-muted rounded-lg p-1">
          <button
            onClick={() => setChartFilter("paid")}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
              chartFilter === "paid" 
                ? "bg-background shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Pagos
          </button>
          <button
            onClick={() => setChartFilter("pending")}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
              chartFilter === "pending" 
                ? "bg-background shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            A Pagar
          </button>
        </div>
      </div>

      {expensesBySector.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum gasto {chartFilter === "paid" ? "pago" : "a pagar"} neste período
        </p>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Donut Chart */}
          <div className="w-64 h-64 relative flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {(() => {
                let cumulativePercent = 0;
                const strokeWidth = 12;
                const radius = 38;
                const circumference = 2 * Math.PI * radius;

                return expensesBySector.map((sector) => {
                  const percent = totalExpenses > 0 ? (sector.total / totalExpenses) * 100 : 0;
                  const strokeDasharray = (percent / 100) * circumference;
                  const strokeDashoffset = -(cumulativePercent / 100) * circumference;
                  cumulativePercent += percent;

                  return (
                    <circle
                      key={sector.id}
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke={sector.color_label}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${strokeDasharray} ${circumference}`}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-300"
                    />
                  );
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold">R$ {formatCurrency(totalExpenses)}</p>
                <p className="text-sm text-muted-foreground">
                  Total {chartFilter === "paid" ? "Pago" : "A Pagar"}
                </p>
              </div>
            </div>
          </div>

          {/* Legend - Detailed */}
          <div className="flex-1 w-full">
            <h4 className="text-sm font-medium text-muted-foreground mb-4">Detalhes por Categoria</h4>
            <div className="space-y-3">
              {expensesBySector
                .sort((a, b) => b.total - a.total)
                .map((sector) => {
                  const percent = totalExpenses > 0 ? (sector.total / totalExpenses) * 100 : 0;
                  return (
                    <div key={sector.id} className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: sector.color_label }}
                      />
                      <FolderIconRenderer 
                        icon={sector.icon || "wallet"} 
                        color={sector.color_label} 
                        className="h-4 w-4 flex-shrink-0" 
                      />
                      <span className="text-sm flex-1 truncate">{sector.name}</span>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium">R$ {formatCurrency(sector.total)}</p>
                        <p className="text-xs text-muted-foreground">{percent.toFixed(1)}%</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
