import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  format,
  startOfWeek,
  addDays,
  isToday,
  differenceInMinutes,
  setHours,
  setMinutes,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarBlock, PRIORITY_COLORS } from '@/types/calendar-blocks';

interface CalendarWeekViewProps {
  currentDate: Date;
  blocks: CalendarBlock[];
  onBlockClick: (block: CalendarBlock) => void;
  onDayClick: (date: Date) => void;
  onSlotSelect: (start: Date, end: Date) => void;
}

const HOUR_HEIGHT = 48;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Snap to 15-minute intervals
const snapToQuarter = (minutes: number): number => {
  return Math.round(minutes / 15) * 15;
};

export function CalendarWeekView({
  currentDate,
  blocks,
  onBlockClick,
  onDayClick,
  onSlotSelect,
}: CalendarWeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragDay, setDragDay] = useState<Date | null>(null);
  const [dragStartMinutes, setDragStartMinutes] = useState(0);
  const [dragEndMinutes, setDragEndMinutes] = useState(0);

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

  // Calculate minutes from Y position
  const getMinutesFromY = useCallback((clientY: number): number => {
    if (!scrollRef.current) return 0;
    const scrollContainer = scrollRef.current;
    const scrollRect = scrollContainer.getBoundingClientRect();
    const y = clientY - scrollRect.top + scrollContainer.scrollTop;
    const rawMinutes = (y / HOUR_HEIGHT) * 60;
    return snapToQuarter(Math.max(0, Math.min(rawMinutes, 24 * 60 - 15)));
  }, []);

  // Mouse handlers for drag-to-create
  const handleMouseDown = useCallback((e: React.MouseEvent, day: Date) => {
    if (e.button !== 0) return;
    e.preventDefault();
    
    const minutes = getMinutesFromY(e.clientY);
    setIsDragging(true);
    setDragDay(day);
    setDragStartMinutes(minutes);
    setDragEndMinutes(minutes + 15);
  }, [getMinutesFromY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragDay) return;
    const minutes = getMinutesFromY(e.clientY);
    setDragEndMinutes(minutes);
  }, [isDragging, dragDay, getMinutesFromY]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !dragDay) {
      setIsDragging(false);
      return;
    }
    
    const startMin = Math.min(dragStartMinutes, dragEndMinutes);
    const endMin = Math.max(dragStartMinutes, dragEndMinutes);
    const finalEndMin = endMin === startMin ? startMin + 30 : endMin;
    
    const startHour = Math.floor(startMin / 60);
    const startMinute = startMin % 60;
    const endHour = Math.floor(finalEndMin / 60);
    const endMinute = finalEndMin % 60;
    
    const start = setMinutes(setHours(dragDay, startHour), startMinute);
    const end = setMinutes(setHours(dragDay, endHour), endMinute);
    
    onSlotSelect(start, end);
    
    setIsDragging(false);
    setDragDay(null);
  }, [isDragging, dragDay, dragStartMinutes, dragEndMinutes, onSlotSelect]);

  // Global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, handleMouseUp]);

  // Calculate block style
  const getBlockStyle = (block: CalendarBlock) => {
    const start = new Date(block.start_time);
    const end = new Date(block.end_time);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const durationMinutes = differenceInMinutes(end, start);
    const top = (startMinutes / 60) * HOUR_HEIGHT;
    const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 20);
    return { top, height };
  };

  // Get drag preview style
  const getDragPreviewStyle = () => {
    if (!isDragging || !dragDay) return null;
    
    const startMin = Math.min(dragStartMinutes, dragEndMinutes);
    const endMin = Math.max(dragStartMinutes, dragEndMinutes);
    const finalEndMin = endMin === startMin ? startMin + 15 : endMin;
    
    const top = (startMin / 60) * HOUR_HEIGHT;
    const height = ((finalEndMin - startMin) / 60) * HOUR_HEIGHT;
    
    return { top, height };
  };

  const getDayAbbr = (date: Date) => {
    return format(date, 'EEE', { locale: ptBR }).toUpperCase().slice(0, 3);
  };

  const dragPreviewStyle = getDragPreviewStyle();

  return (
    <div 
      className="flex flex-col h-full bg-background select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border/40">
        <div className="flex">
          <div className="w-14 flex-shrink-0 py-3 px-2 text-[10px] text-muted-foreground/60 text-right pr-3 font-mono">
            GMT-03
          </div>
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className="flex-1 flex flex-col items-center py-2 cursor-pointer hover:bg-accent/30 transition-colors"
              onClick={() => onDayClick(day)}
            >
              <span className={cn(
                "text-[11px] font-semibold tracking-wider",
                isToday(day) ? "text-primary" : "text-muted-foreground"
              )}>
                {getDayAbbr(day)}.
              </span>
              <span className={cn(
                "text-2xl font-medium mt-1 w-11 h-11 flex items-center justify-center rounded-full transition-all",
                isToday(day) 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                  : "text-foreground hover:bg-accent"
              )}>
                {format(day, 'd')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div ref={gridRef} className="flex min-h-full">
          {/* Time labels */}
          <div className="w-14 flex-shrink-0">
            {HOURS.map((hour) => (
              <div key={hour} className="relative" style={{ height: HOUR_HEIGHT }}>
                <span className="absolute -top-2.5 right-3 text-[11px] text-muted-foreground/70 font-mono">
                  {hour === 0 ? '' : `${hour} ${hour < 12 ? 'AM' : 'PM'}`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayBlocks = blocksByDay.get(dayKey) || [];
            const isDragDay = dragDay && format(dragDay, 'yyyy-MM-dd') === dayKey;
            
            return (
              <div
                key={day.toISOString()}
                data-day={dayKey}
                className={cn(
                  "flex-1 relative border-l border-border/30",
                  isToday(day) && "bg-primary/[0.03]"
                )}
                onMouseDown={(e) => handleMouseDown(e, day, e.currentTarget)}
              >
                {/* Hour lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="border-t border-border/20 hover:bg-accent/10 transition-colors"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}

                {/* Drag preview */}
                {isDragging && isDragDay && dragPreviewStyle && (
                  <div
                    className="absolute left-1 right-1 rounded-md bg-primary/40 border-2 border-primary border-dashed pointer-events-none z-20"
                    style={{
                      top: dragPreviewStyle.top,
                      height: dragPreviewStyle.height,
                    }}
                  >
                    <div className="px-2 py-1 text-xs font-medium text-primary">
                      {format(setMinutes(setHours(day, Math.floor(Math.min(dragStartMinutes, dragEndMinutes) / 60)), Math.min(dragStartMinutes, dragEndMinutes) % 60), 'HH:mm')} - 
                      {format(setMinutes(setHours(day, Math.floor(Math.max(dragStartMinutes, dragEndMinutes) / 60)), Math.max(dragStartMinutes, dragEndMinutes) % 60), 'HH:mm')}
                    </div>
                  </div>
                )}

                {/* Current time indicator */}
                {isToday(day) && <CurrentTimeIndicator hourHeight={HOUR_HEIGHT} />}

                {/* Blocks */}
                {dayBlocks.map((block) => {
                  const { top, height } = getBlockStyle(block);
                  return (
                    <div
                      key={block.id}
                      className={cn(
                        "absolute left-1 right-1 rounded-lg px-2 py-1 cursor-pointer",
                        "text-white text-xs font-medium overflow-hidden shadow-sm",
                        "hover:shadow-md hover:brightness-110 transition-all",
                        block.status === 'completed' && "opacity-60"
                      )}
                      style={{
                        top,
                        height,
                        backgroundColor: block.color || 'hsl(207, 90%, 54%)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBlockClick(block);
                      }}
                    >
                      <div className="truncate font-semibold">{block.title}</div>
                      {height > 32 && (
                        <div className="text-[10px] opacity-80">
                          {format(new Date(block.start_time), 'H:mm')} - {format(new Date(block.end_time), 'H:mm')}
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
      <div className="w-3 h-3 rounded-full bg-destructive -ml-1.5 shadow-lg shadow-destructive/50" />
      <div className="flex-1 h-0.5 bg-destructive shadow-sm" />
    </div>
  );
}
