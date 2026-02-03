import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CalendarBlock } from '@/types/calendar-blocks';
import { isSameDay, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Circle, Clock, Target, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface CalendarProductivityPanelProps {
  currentDate: Date;
  blocks: CalendarBlock[];
}

export function CalendarProductivityPanel({
  currentDate,
  blocks,
}: CalendarProductivityPanelProps) {
  const dayBlocks = useMemo(() => {
    return blocks.filter(block =>
      isSameDay(new Date(block.start_time), currentDate)
    );
  }, [blocks, currentDate]);

  const stats = useMemo(() => {
    const total = dayBlocks.length;
    const completed = dayBlocks.filter(b => b.status === 'completed').length;
    const pending = dayBlocks.filter(b => b.status === 'pending').length;
    const inProgress = dayBlocks.filter(b => b.status === 'in_progress').length;
    const cancelled = dayBlocks.filter(b => b.status === 'cancelled').length;
    const postponed = dayBlocks.filter(b => b.status === 'postponed').length;

    const plannedMinutes = dayBlocks.reduce((sum, b) => sum + (b.duration_minutes || 0), 0);
    const completedMinutes = dayBlocks
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.duration_minutes || 0), 0);

    const executionScore = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pending,
      inProgress,
      cancelled,
      postponed,
      plannedMinutes,
      completedMinutes,
      executionScore,
    };
  }, [dayBlocks]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  return (
    <div className="cave-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Produtividade do Dia
        </h3>
        <span className="text-xs text-muted-foreground">
          {format(currentDate, "dd 'de' MMMM", { locale: ptBR })}
        </span>
      </div>

      {/* Execution score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Execução</span>
          <span className={cn(
            "text-2xl font-bold",
            stats.executionScore >= 80 ? "text-success" :
            stats.executionScore >= 50 ? "text-warning" :
            "text-muted-foreground"
          )}>
            {stats.executionScore}%
          </span>
        </div>
        <Progress value={stats.executionScore} className="h-2" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Circle className="h-3 w-3" />
            <span className="text-xs">Pendentes</span>
          </div>
          <p className="text-lg font-bold">{stats.pending}</p>
        </div>
        
        <div className="bg-success/10 rounded-lg p-3">
          <div className="flex items-center gap-2 text-success mb-1">
            <CheckCircle2 className="h-3 w-3" />
            <span className="text-xs">Concluídas</span>
          </div>
          <p className="text-lg font-bold text-success">{stats.completed}</p>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-3 w-3" />
            <span className="text-xs">Planejado</span>
          </div>
          <p className="text-lg font-bold">{formatDuration(stats.plannedMinutes)}</p>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-3 w-3" />
            <span className="text-xs">Executado</span>
          </div>
          <p className="text-lg font-bold">{formatDuration(stats.completedMinutes)}</p>
        </div>
      </div>

    </div>
  );
}
