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

interface SectorData extends Sector {
  total: number;
  percent: number;
}

export function ExpensesBySectorChart({ sectors, transactions }: ExpensesBySectorChartProps) {
  const [chartFilter, setChartFilter] = useState<ChartFilter>("paid");
  const [hoveredSector, setHoveredSector] = useState<SectorData | null>(null);

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
  const totalExpenses = filteredTransactions.reduce((sum, t) => sum + Math.abs(t.value), 0);
  
  const expensesBySector: SectorData[] = sectors.map((sector) => {
    const total = filteredTransactions
      .filter((t) => t.sector_id === sector.id)
      .reduce((sum, t) => sum + Math.abs(t.value), 0);
    const percent = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
    return { ...sector, total, percent };
  }).filter((s) => s.total > 0);

  // Format currency
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  return (
    <div className="cave-card p-4 md:p-6">
      {/* Header with title and filters */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="font-bold text-sm md:text-lg">Despesas</h3>
        <div className="flex bg-muted rounded-lg p-0.5 md:p-1">
          <button
            onClick={() => setChartFilter("paid")}
            className={cn(
              "px-2.5 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-medium rounded-md transition-all",
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
              "px-2.5 md:px-4 py-1 md:py-1.5 text-xs md:text-sm font-medium rounded-md transition-all",
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
        <p className="text-xs md:text-sm text-muted-foreground text-center py-6 md:py-8">
          Nenhum gasto {chartFilter === "paid" ? "pago" : "a pagar"} neste período
        </p>
      ) : (
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
          {/* Donut Chart with Tooltip */}
          <div className="w-48 h-48 md:w-56 md:h-56 relative flex-shrink-0 mx-auto md:mx-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {(() => {
                let cumulativePercent = 0;
                const strokeWidth = 12;
                const radius = 38;
                const circumference = 2 * Math.PI * radius;

                return expensesBySector.map((sector) => {
                  const strokeDasharray = (sector.percent / 100) * circumference;
                  const strokeDashoffset = -(cumulativePercent / 100) * circumference;
                  cumulativePercent += sector.percent;

                  const isHovered = hoveredSector?.id === sector.id;

                  return (
                    <circle
                      key={sector.id}
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke={sector.color_label}
                      strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                      strokeDasharray={`${strokeDasharray} ${circumference}`}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-200 cursor-pointer"
                      style={{ 
                        opacity: hoveredSector && !isHovered ? 0.4 : 1,
                        filter: isHovered ? 'drop-shadow(0 0 6px rgba(0,0,0,0.3))' : 'none'
                      }}
                      onMouseEnter={() => setHoveredSector(sector)}
                      onMouseLeave={() => setHoveredSector(null)}
                    />
                  );
                });
              })()}
            </svg>
            
            {/* Center Content */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-base md:text-xl font-bold">R$ {formatCurrency(totalExpenses)}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  {chartFilter === "paid" ? "Pago" : "A Pagar"}
                </p>
              </div>
            </div>
          </div>

          {/* Legend - Detailed */}
          <div className="w-full md:flex-1">
            <h4 className="text-xs md:text-sm font-medium text-muted-foreground mb-2 md:mb-4">Por Categoria</h4>
            <div className="space-y-1 md:space-y-2 max-h-40 md:max-h-56 overflow-y-auto">
              {expensesBySector
                .sort((a, b) => b.total - a.total)
                .map((sector) => {
                  const isHovered = hoveredSector?.id === sector.id;
                  return (
                    <div 
                      key={sector.id} 
                      className={cn(
                        "flex items-center gap-2 md:gap-3 p-1.5 md:p-2 rounded-lg transition-all cursor-pointer",
                        isHovered ? "bg-secondary" : "hover:bg-secondary/50"
                      )}
                      onMouseEnter={() => setHoveredSector(sector)}
                      onMouseLeave={() => setHoveredSector(null)}
                    >
                      <div 
                        className="w-2 h-2 md:w-3 md:h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: sector.color_label }}
                      />
                      <FolderIconRenderer 
                        icon={sector.icon || "wallet"} 
                        color={sector.color_label} 
                        className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" 
                      />
                      <span className="text-xs md:text-sm flex-1 truncate">{sector.name}</span>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs md:text-sm font-semibold">R$ {formatCurrency(sector.total)}</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground">{sector.percent.toFixed(0)}%</p>
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