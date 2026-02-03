import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarBlock } from '@/types/calendar-blocks';

interface CalendarMonthViewProps {
  currentDate: Date;
  blocks: CalendarBlock[];
  onDayClick: (date: Date) => void;
  onBlockClick: (block: CalendarBlock) => void;
}

const WEEKDAY_LABELS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export function CalendarMonthView({
  currentDate,
  blocks,
  onDayClick,
  onBlockClick,
}: CalendarMonthViewProps) {
  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { locale: ptBR });
    const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
    
    const days: Date[] = [];
    let current = calendarStart;
    
    while (current <= calendarEnd) {
      days.push(current);
      current = addDays(current, 1);
    }
    
    return days;
  }, [currentDate]);

  // Group blocks by day
  const blocksByDay = useMemo(() => {
    const map = new Map<string, CalendarBlock[]>();
    blocks.forEach(block => {
      const key = format(new Date(block.start_time), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(block);
    });
    return map;
  }, [blocks]);

  // Split into weeks
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border/30">
        {WEEKDAY_LABELS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-[11px] font-medium text-muted-foreground tracking-wide"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-rows-[repeat(auto-fill,minmax(0,1fr))] overflow-hidden">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 border-b border-border/20 last:border-b-0">
            {week.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayBlocks = blocksByDay.get(dayKey) || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const maxVisible = 3;
              const hasMore = dayBlocks.length > maxVisible;

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[100px] border-r border-border/20 last:border-r-0 p-1 cursor-pointer",
                    "hover:bg-accent/30 transition-colors",
                    !isCurrentMonth && "bg-muted/20"
                  )}
                  onClick={() => onDayClick(day)}
                >
                  {/* Day number */}
                  <div className="flex justify-center mb-1">
                    <span
                      className={cn(
                        "text-sm w-7 h-7 flex items-center justify-center rounded-full",
                        isToday(day) && "bg-primary text-primary-foreground font-semibold",
                        !isToday(day) && isCurrentMonth && "text-foreground",
                        !isToday(day) && !isCurrentMonth && "text-muted-foreground"
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Blocks preview */}
                  <div className="space-y-0.5">
                    {dayBlocks.slice(0, maxVisible).map((block) => (
                      <div
                        key={block.id}
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer",
                          "text-white font-medium",
                          "hover:ring-1 hover:ring-ring/50"
                        )}
                        style={{ backgroundColor: block.color || 'hsl(200, 70%, 50%)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBlockClick(block);
                        }}
                      >
                        {block.title}
                      </div>
                    ))}
                    
                    {hasMore && (
                      <div className="text-[10px] text-muted-foreground px-1.5">
                        +{dayBlocks.length - maxVisible} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
