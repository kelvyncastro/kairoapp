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
  const { weeks, blocksByDay } = useMemo(() => {
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
    
    // Split into weeks
    const weeksArr: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeksArr.push(days.slice(i, i + 7));
    }

    // Group blocks by day
    const map = new Map<string, CalendarBlock[]>();
    blocks.forEach(block => {
      const key = format(new Date(block.start_time), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(block);
    });

    return { weeks: weeksArr, blocksByDay: map };
  }, [currentDate, blocks]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border/40 flex-shrink-0">
        {WEEKDAY_LABELS.map((day, idx) => (
          <div
            key={day}
            className={cn(
              "py-3 text-center text-xs font-semibold tracking-wider",
              idx === 0 ? "text-destructive/70" : "text-muted-foreground"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {weeks.map((week, weekIdx) => (
          <div 
            key={weekIdx} 
            className="flex-1 grid grid-cols-7 min-h-0"
            style={{ minHeight: '80px' }}
          >
            {week.map((day, dayIdx) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayBlocks = blocksByDay.get(dayKey) || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const maxVisible = 2;
              const hasMore = dayBlocks.length > maxVisible;

              return (
                <div
                  key={dayKey}
                  className={cn(
                    "relative border-r border-b border-border/20 p-1 cursor-pointer transition-colors overflow-hidden",
                    "hover:bg-accent/40",
                    !isCurrentMonth && "bg-muted/30",
                    dayIdx === 0 && "border-l-0",
                    isToday(day) && "bg-primary/5"
                  )}
                  onClick={() => onDayClick(day)}
                >
                  {/* Day number */}
                  <div className="flex justify-center mb-1">
                    <span
                      className={cn(
                        "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                        isToday(day) && "bg-primary text-primary-foreground",
                        !isToday(day) && isCurrentMonth && "text-foreground",
                        !isToday(day) && !isCurrentMonth && "text-muted-foreground/60"
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Blocks preview */}
                  <div className="space-y-0.5 overflow-hidden">
                    {dayBlocks.slice(0, maxVisible).map((block) => (
                      <div
                        key={block.id}
                        className={cn(
                          "text-[10px] leading-tight px-1.5 py-0.5 rounded truncate cursor-pointer",
                          "text-white font-medium shadow-sm",
                          "hover:brightness-110 transition-all"
                        )}
                        style={{ backgroundColor: block.color || 'hsl(200, 70%, 50%)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBlockClick(block);
                        }}
                      >
                        {format(new Date(block.start_time), 'HH:mm')} {block.title}
                      </div>
                    ))}
                    
                    {hasMore && (
                      <div className="text-[10px] text-muted-foreground font-medium px-1.5">
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
