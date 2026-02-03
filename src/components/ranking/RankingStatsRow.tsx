import { Trophy, Clock, CheckCircle2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankingStatsRowProps {
  active: number;
  pending: number;
  ended: number;
  total: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
}) {
  return (
    <div className="cave-card p-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-muted/20 flex items-center justify-center">
          <Icon className={cn("h-5 w-5", iconClassName || "text-primary")} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold leading-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function RankingStatsRow({ active, pending, ended, total }: RankingStatsRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="Ativos" value={active} icon={Trophy} iconClassName="text-success" />
      <StatCard label="Aguardando" value={pending} icon={Clock} iconClassName="text-warning" />
      <StatCard label="Finalizados" value={ended} icon={CheckCircle2} iconClassName="text-muted-foreground" />
      <StatCard label="Total" value={total} icon={Users} iconClassName="text-muted-foreground" />
    </div>
  );
}
