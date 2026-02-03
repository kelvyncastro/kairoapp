import { useMemo, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { format, isSameDay, isToday, differenceInMinutes, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarBlock,
  PRIORITY_COLORS,
  DEMAND_TYPE_LABELS,
} from '@/types/calendar-blocks';
import { Check, Clock, GripVertical } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface CalendarDayViewProps {
  currentDate: Date;
  blocks: CalendarBlock[];
  onBlockClick: (block: CalendarBlock) => void;
  onSlotSelect: (start: Date, end: Date) => void;
  onBlockComplete?: (id: string) => Promise<boolean>;
  onBlockDelete?: (id: string) => Promise<boolean>;
  onBlockDuplicate?: (block: CalendarBlock) => Promise<any>;
  onBlockMove?: (id: string, newStart: Date, newEnd: Date) => Promise<boolean>;
}

const HOUR_HEIGHT = 60; // pixels per hour
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function CalendarDayView({
  currentDate,
  blocks,
  onBlockClick,
  onSlotSelect,
  onBlockComplete,
  onBlockDelete,
  onBlockDuplicate,
}: CalendarDayViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current && isToday(currentDate)) {
      const now = new Date();
      const scrollTop = (now.getHours() - 2) * HOUR_HEIGHT;
      scrollRef.current.scrollTop = Math.max(0, scrollTop);
    }
  }, [currentDate]);

  // Filter blocks for current day
  const dayBlocks = useMemo(() => {
    return blocks.filter(block => 
      isSameDay(new Date(block.start_time), currentDate)
    );
  }, [blocks, currentDate]);

  // Calculate block positions
  const positionedBlocks = useMemo(() => {
    return dayBlocks.map(block => {
      const startTime = new Date(block.start_time);
      const endTime = new Date(block.end_time);
      
      const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
      const durationMinutes = differenceInMinutes(endTime, startTime);
      
      const top = (startMinutes / 60) * HOUR_HEIGHT;
      const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 28);
      
      return {
        ...block,
        top,
        height,
        durationMinutes,
      };
    });
  }, [dayBlocks]);

  // Handle slot click
  const handleSlotClick = (hour: number, offsetY: number) => {
    const minuteOffset = Math.floor((offsetY / HOUR_HEIGHT) * 60);
    const startMinute = Math.floor(minuteOffset / 15) * 15;
    
    const start = setMinutes(setHours(currentDate, hour), startMinute);
    const end = setMinutes(setHours(currentDate, hour), startMinute + 30);
    
    onSlotSelect(start, end);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Day header */}
      <div className="flex-shrink-0 border-b border-border/30">
        <div className="flex">
          <div className="w-16 flex-shrink-0 py-2 px-2 text-[10px] text-muted-foreground text-right pr-3">
            GMT-03
          </div>
          <div className="flex-1 flex flex-col items-center py-2">
            <span className={cn(
              "text-[11px] font-medium tracking-wide uppercase",
              isToday(currentDate) ? "text-primary" : "text-muted-foreground"
            )}>
              {format(currentDate, 'EEE', { locale: ptBR })}.
            </span>
            <span className={cn(
              "text-xl font-medium mt-0.5 w-10 h-10 flex items-center justify-center rounded-full",
              isToday(currentDate) 
                ? "bg-primary text-primary-foreground" 
                : "text-foreground"
            )}>
              {format(currentDate, 'd')}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex min-h-full">
          {/* Time labels column */}
          <div className="w-16 flex-shrink-0">
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

          {/* Day column */}
          <div className="flex-1 relative border-l border-border/30">
            {/* Hour slots */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="border-t border-border/20 cursor-pointer hover:bg-accent/20 transition-colors"
                style={{ height: HOUR_HEIGHT }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const offsetY = e.clientY - rect.top;
                  handleSlotClick(hour, offsetY);
                }}
              />
            ))}

            {/* Current time indicator */}
            {isToday(currentDate) && <CurrentTimeIndicator hourHeight={HOUR_HEIGHT} />}

            {/* Blocks */}
            {positionedBlocks.map((block) => (
              <ContextMenu key={block.id}>
                <ContextMenuTrigger asChild>
                  <div
                    className={cn(
                      "absolute left-2 right-4 rounded-md px-3 py-1.5 cursor-pointer",
                      "text-white overflow-hidden group",
                      "hover:ring-2 hover:ring-ring/50 transition-all",
                      block.status === 'completed' && "opacity-60"
                    )}
                    style={{
                      top: block.top,
                      height: block.height,
                      backgroundColor: block.color || 'hsl(200, 70%, 50%)',
                    }}
                    onClick={() => onBlockClick(block)}
                  >
                    <div className="flex items-start gap-2 h-full">
                      <GripVertical className="h-4 w-4 opacity-0 group-hover:opacity-70 transition-opacity flex-shrink-0 cursor-grab mt-0.5" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-medium text-sm truncate",
                            block.status === 'completed' && "line-through"
                          )}>
                            {block.title}
                          </span>
                          {block.status === 'completed' && (
                            <Check className="h-3 w-3 flex-shrink-0" />
                          )}
                        </div>
                        
                        {block.height > 40 && (
                          <div className="flex items-center gap-1 mt-0.5 text-xs opacity-80">
                            <span>
                              {format(new Date(block.start_time), 'h')} - {format(new Date(block.end_time), 'ha')}
                            </span>
                          </div>
                        )}
                        
                        {block.height > 60 && block.description && (
                          <p className="text-xs opacity-70 mt-1 line-clamp-2">
                            {block.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Priority indicator */}
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                        style={{ 
                          backgroundColor: PRIORITY_COLORS[block.priority],
                          boxShadow: '0 0 4px rgba(0,0,0,0.3)'
                        }}
                      />
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  {onBlockComplete && block.status !== 'completed' && (
                    <ContextMenuItem onClick={() => onBlockComplete(block.id)}>
                      <Check className="h-4 w-4 mr-2" />
                      Marcar como concluída
                    </ContextMenuItem>
                  )}
                  {onBlockDuplicate && (
                    <ContextMenuItem onClick={() => onBlockDuplicate(block)}>
                      Duplicar
                    </ContextMenuItem>
                  )}
                  <ContextMenuSeparator />
                  {onBlockDelete && (
                    <ContextMenuItem 
                      onClick={() => onBlockDelete(block.id)}
                      className="text-destructive"
                    >
                      Excluir
                    </ContextMenuItem>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
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
