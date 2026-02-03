import { Trophy, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type RankingTabKey = "active" | "pending" | "ended";

interface RankingFilterTabsProps {
  value: RankingTabKey;
  onChange: (value: RankingTabKey) => void;
  counts: { active: number; pending: number; ended: number };
}

export function RankingFilterTabs({ value, onChange, counts }: RankingFilterTabsProps) {
  const items: Array<{
    key: RankingTabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count: number;
  }> = [
    { key: "active", label: "Ativos", icon: Trophy, count: counts.active },
    { key: "pending", label: "Aguardando", icon: Clock, count: counts.pending },
    { key: "ended", label: "Finalizados", icon: CheckCircle2, count: counts.ended },
  ];

  return (
    <div className="cave-card p-2">
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.key === value;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-muted/20 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
              <span className="font-medium">{item.label}</span>
              <span
                className={cn(
                  "ml-1 rounded-full px-2 py-0.5 text-xs",
                  active ? "bg-background/40 text-foreground" : "bg-muted/30 text-muted-foreground"
                )}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
