import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarBlock, PRIORITY_COLORS } from '@/types/calendar-blocks';
import { AlertTriangle, Check } from 'lucide-react';

interface CalendarMonthViewProps {
  currentDate: Date;
  blocks: CalendarBlock[];
  onDayClick: (date: Date) => void;
  onBlockClick: (block: CalendarBlock) => void;
}

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function CalendarMonthView({
  currentDate,
  blocks,
  onDayClick,
  onBlockClick,
}: CalendarMonthViewProps) {
  // Get calendar days (including days from adjacent months to fill the grid)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Group blocks by day
  const blocksByDay = useMemo(() => {
    const grouped: Record<string, CalendarBlock[]> = {};
    calendarDays.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      grouped[key] = blocks.filter(block =>
        isSameDay(new Date(block.start_time), day)
      );
    });
    return grouped;
  }, [blocks, calendarDays]);

  // Calculate daily stats
  const dailyStats = useMemo(() => {
    const stats: Record<string, { total: number; completed: number; overload: boolean; totalMinutes: number }> = {};
    calendarDays.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      const dayBlocks = blocksByDay[key] || [];
      const totalMinutes = dayBlocks.reduce((sum, b) => sum + (b.duration_minutes || 0), 0);
      stats[key] = {
        total: dayBlocks.length,
        completed: dayBlocks.filter(b => b.status === 'completed').length,
        overload: totalMinutes > 10 * 60,
        totalMinutes,
      };
    });
    return stats;
  }, [blocksByDay, calendarDays]);

  return (
    <div className="flex flex-col h-full">
      {/* Month header */}
      <div className="px-4 py-3 border-b border-border/50 bg-card">
        <h2 className="text-lg font-bold capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border/50 bg-muted/30">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 overflow-y-auto">
        {calendarDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, currentDate);
          const dayBlocks = blocksByDay[key] || [];
          const stats = dailyStats[key];
          const displayBlocks = dayBlocks.slice(0, 3);
          const remainingCount = dayBlocks.length - displayBlocks.length;

          return (
            <div
              key={key}
              className={cn(
                "min-h-[120px] border-b border-r border-border/30 p-1.5 cursor-pointer",
                "hover:bg-muted/30 transition-colors",
                !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                isToday(day) && "bg-primary/10"
              )}
              onClick={() => onDayClick(day)}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                    isToday(day) && "bg-primary text-primary-foreground"
                  )}
                >
                  {format(day, 'd')}
                </span>
                {stats?.overload && (
                  <AlertTriangle className="h-3 w-3 text-warning" />
                )}
              </div>

              {/* Blocks preview */}
              <div className="space-y-0.5">
                {displayBlocks.map((block) => (
                  <div
                    key={block.id}
                    className={cn(
                      "text-[10px] px-1 py-0.5 rounded truncate",
                      "border-l-2 cursor-pointer hover:opacity-80",
                      block.status === 'completed' && "opacity-60"
                    )}
                    style={{
                      backgroundColor: `${block.color}20`,
                      borderLeftColor: block.color || '#6366f1',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBlockClick(block);
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "truncate",
                        block.status === 'completed' && "line-through"
                      )}>
                        {format(new Date(block.start_time), 'HH:mm')} {block.title}
                      </span>
                      {block.status === 'completed' && (
                        <Check className="h-2 w-2 text-success flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
                {remainingCount > 0 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{remainingCount} mais
                  </div>
                )}
              </div>

              {/* Stats */}
              {stats && stats.total > 0 && (
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {stats.completed}/{stats.total} concluídas
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
