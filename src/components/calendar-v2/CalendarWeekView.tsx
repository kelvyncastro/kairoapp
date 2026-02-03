import { useMemo, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  isToday,
  differenceInMinutes,
  setHours,
  setMinutes,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarBlock,
  PRIORITY_COLORS,
} from '@/types/calendar-blocks';

interface CalendarWeekViewProps {
  currentDate: Date;
  blocks: CalendarBlock[];
  onBlockClick: (block: CalendarBlock) => void;
  onDayClick: (date: Date) => void;
  onSlotSelect: (start: Date, end: Date) => void;
}

const HOUR_HEIGHT = 48; // pixels per hour
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function CalendarWeekView({
  currentDate,
  blocks,
  onBlockClick,
  onDayClick,
  onSlotSelect,
}: CalendarWeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const scrollTop = (now.getHours() - 2) * HOUR_HEIGHT;
      scrollRef.current.scrollTop = Math.max(0, scrollTop);
    }
  }, []);

  // Get week days starting from Sunday
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { locale: ptBR });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  // Group blocks by day
  const blocksByDay = useMemo(() => {
    const map = new Map<string, CalendarBlock[]>();
    weekDays.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      map.set(key, []);
    });
    
    blocks.forEach(block => {
      const blockDate = new Date(block.start_time);
      const key = format(blockDate, 'yyyy-MM-dd');
      if (map.has(key)) {
        map.get(key)!.push(block);
      }
    });
    
    return map;
  }, [blocks, weekDays]);

  // Handle slot click
  const handleSlotClick = (day: Date, hour: number) => {
    const start = setMinutes(setHours(day, hour), 0);
    const end = setMinutes(setHours(day, hour + 1), 0);
    onSlotSelect(start, end);
  };

  // Calculate block position and dimensions
  const getBlockStyle = (block: CalendarBlock) => {
    const start = new Date(block.start_time);
    const end = new Date(block.end_time);
    
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const durationMinutes = differenceInMinutes(end, start);
    
    const top = (startMinutes / 60) * HOUR_HEIGHT;
    const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 20);
    
    return { top, height };
  };

  // Get day abbreviation
  const getDayAbbr = (date: Date) => {
    return format(date, 'EEE', { locale: ptBR }).toUpperCase().slice(0, 3);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with day names and dates */}
      <div className="flex-shrink-0 border-b border-border/30">
        <div className="flex">
          {/* Timezone/empty column */}
          <div className="w-14 flex-shrink-0 py-2 px-2 text-[10px] text-muted-foreground text-right pr-3">
            GMT-03
          </div>
          
          {/* Day columns headers */}
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className="flex-1 flex flex-col items-center py-2 cursor-pointer hover:bg-accent/30 transition-colors"
              onClick={() => onDayClick(day)}
            >
              <span className={cn(
                "text-[11px] font-medium tracking-wide",
                isToday(day) ? "text-primary" : "text-muted-foreground"
              )}>
                {getDayAbbr(day)}.
              </span>
              <span className={cn(
                "text-xl font-medium mt-0.5 w-10 h-10 flex items-center justify-center rounded-full transition-colors",
                isToday(day) 
                  ? "bg-primary text-primary-foreground" 
                  : "text-foreground hover:bg-accent"
              )}>
                {format(day, 'd')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex min-h-full">
          {/* Time labels column */}
          <div className="w-14 flex-shrink-0">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="relative"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-2 right-3 text-[11px] text-muted-foreground font-mono">
                  {hour === 0 ? '' : `${hour} ${hour < 12 ? 'AM' : 'PM'}`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayBlocks = blocksByDay.get(dayKey) || [];
            
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex-1 relative border-l border-border/30",
                  isToday(day) && "bg-primary/[0.02]"
                )}
              >
                {/* Hour slots */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="border-t border-border/20 cursor-pointer hover:bg-accent/20 transition-colors"
                    style={{ height: HOUR_HEIGHT }}
                    onClick={() => handleSlotClick(day, hour)}
                  />
                ))}

                {/* Current time indicator */}
                {isToday(day) && <CurrentTimeIndicator hourHeight={HOUR_HEIGHT} />}

                {/* Blocks */}
                {dayBlocks.map((block) => {
                  const { top, height } = getBlockStyle(block);
                  return (
                    <div
                      key={block.id}
                      className={cn(
                        "absolute left-1 right-1 rounded-md px-2 py-1 cursor-pointer",
                        "text-white text-xs font-medium overflow-hidden",
                        "hover:ring-2 hover:ring-ring/50 transition-shadow",
                        block.status === 'completed' && "opacity-60"
                      )}
                      style={{
                        top,
                        height,
                        backgroundColor: block.color || 'hsl(200, 70%, 50%)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBlockClick(block);
                      }}
                    >
                      <div className="truncate">{block.title}</div>
                      {height > 30 && (
                        <div className="text-[10px] opacity-80 truncate">
                          {format(new Date(block.start_time), 'h')} - {format(new Date(block.end_time), 'ha', { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CurrentTimeIndicator({ hourHeight }: { hourHeight: number }) {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const top = (minutes / 60) * hourHeight;

  return (
    <div
      className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
      style={{ top }}
    >
      <div className="w-2.5 h-2.5 rounded-full bg-destructive -ml-1" />
      <div className="flex-1 h-0.5 bg-destructive" />
    </div>
  );
}
