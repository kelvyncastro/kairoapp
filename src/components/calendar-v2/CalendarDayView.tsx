import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { format, isSameDay, differenceInMinutes, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarBlock,
  PRIORITY_COLORS,
  DEMAND_TYPE_LABELS,
  STATUS_LABELS,
} from '@/types/calendar-blocks';
import { Check, Clock, MoreVertical, GripVertical } from 'lucide-react';
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

// Generate time slots for the day (30-minute intervals)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    slots.push({
      hour,
      minute: 0,
      label: `${hour.toString().padStart(2, '0')}:00`,
      period: getPeriod(hour),
    });
  }
  return slots;
};

const getPeriod = (hour: number): 'night' | 'morning' | 'afternoon' | 'evening' => {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
};

const PERIOD_LABELS = {
  night: 'Madrugada',
  morning: 'Manhã',
  afternoon: 'Tarde',
  evening: 'Noite',
};

const PERIOD_COLORS = {
  night: 'bg-slate-900/20',
  morning: 'bg-amber-500/10',
  afternoon: 'bg-orange-500/10',
  evening: 'bg-indigo-500/10',
};

const SLOT_HEIGHT = 60; // pixels per hour

export function CalendarDayView({
  currentDate,
  blocks,
  onBlockClick,
  onSlotSelect,
  onBlockComplete,
  onBlockDelete,
  onBlockDuplicate,
  onBlockMove,
}: CalendarDayViewProps) {
  const timeSlots = useMemo(() => generateTimeSlots(), []);

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
      const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
      const durationMinutes = endMinutes - startMinutes;
      
      const top = (startMinutes / 60) * SLOT_HEIGHT;
      const height = Math.max((durationMinutes / 60) * SLOT_HEIGHT, 24);
      
      return {
        ...block,
        top,
        height,
        startMinutes,
        durationMinutes,
      };
    });
  }, [dayBlocks]);

  // Handle drag to create
  const handleSlotMouseDown = (e: React.MouseEvent, hour: number) => {
    if (e.button !== 0) return; // Only left click
    
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const minuteOffset = Math.floor((offsetY / SLOT_HEIGHT) * 60);
    const startMinute = Math.floor(minuteOffset / 15) * 15;
    
    const start = setMinutes(setHours(currentDate, hour), startMinute);
    const end = setMinutes(setHours(currentDate, hour), startMinute + 30);
    
    onSlotSelect(start, end);
  };

  const getPeriodHeader = (period: string, slots: typeof timeSlots) => {
    const firstSlotIndex = slots.findIndex(s => s.period === period);
    if (firstSlotIndex === -1) return null;
    
    return (
      <div 
        key={`period-${period}`}
        className={cn(
          "absolute left-0 right-0 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-t border-border/50",
          PERIOD_COLORS[period as keyof typeof PERIOD_COLORS]
        )}
        style={{ top: firstSlotIndex * SLOT_HEIGHT - 24 }}
      >
        {PERIOD_LABELS[period as keyof typeof PERIOD_LABELS]}
      </div>
    );
  };

  return (
    <div className="relative flex flex-col h-full">
      {/* Day header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card">
        <div>
          <h2 className="text-lg font-bold">
            {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {dayBlocks.length} demanda{dayBlocks.length !== 1 ? 's' : ''} planejada{dayBlocks.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="relative" style={{ height: 24 * SLOT_HEIGHT + 100 }}>
          {/* Period backgrounds */}
          {['night', 'morning', 'afternoon', 'evening', 'night'].map((period, idx) => {
            const startHour = idx === 0 ? 0 : idx === 1 ? 5 : idx === 2 ? 12 : idx === 3 ? 18 : 22;
            const endHour = idx === 0 ? 5 : idx === 1 ? 12 : idx === 2 ? 18 : idx === 3 ? 22 : 24;
            return (
              <div
                key={`bg-${period}-${idx}`}
                className={cn(
                  "absolute left-0 right-0",
                  PERIOD_COLORS[period as keyof typeof PERIOD_COLORS]
                )}
                style={{
                  top: startHour * SLOT_HEIGHT,
                  height: (endHour - startHour) * SLOT_HEIGHT,
                }}
              />
            );
          })}

          {/* Time slots */}
          <div className="relative ml-16">
            {timeSlots.map((slot) => (
              <div
                key={`slot-${slot.hour}`}
                className="absolute left-0 right-0 border-t border-border/30 cursor-pointer hover:bg-primary/5 transition-colors"
                style={{ top: slot.hour * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                onMouseDown={(e) => handleSlotMouseDown(e, slot.hour)}
              >
                {/* Time label */}
                <div 
                  className="absolute -left-16 w-14 text-right text-xs text-muted-foreground font-mono pr-2"
                  style={{ top: -8 }}
                >
                  {slot.label}
                </div>
                
                {/* Half hour line */}
                <div 
                  className="absolute left-0 right-0 border-t border-border/20"
                  style={{ top: SLOT_HEIGHT / 2 }}
                />
              </div>
            ))}

            {/* Blocks */}
            {positionedBlocks.map((block) => (
              <ContextMenu key={block.id}>
                <ContextMenuTrigger asChild>
                  <div
                    className={cn(
                      "absolute left-1 right-4 rounded-lg px-3 py-1.5 cursor-pointer",
                      "border-l-4 shadow-sm hover:shadow-md transition-all",
                      "group overflow-hidden",
                      block.status === 'completed' && "opacity-60"
                    )}
                    style={{
                      top: block.top,
                      height: block.height,
                      backgroundColor: `${block.color}20`,
                      borderLeftColor: block.color || '#6366f1',
                    }}
                    onClick={() => onBlockClick(block)}
                  >
                    <div className="flex items-start gap-2 h-full">
                      {/* Drag handle */}
                      <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-grab" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span 
                            className={cn(
                              "font-medium text-sm truncate",
                              block.status === 'completed' && "line-through"
                            )}
                          >
                            {block.title}
                          </span>
                          {block.status === 'completed' && (
                            <Check className="h-3 w-3 text-success flex-shrink-0" />
                          )}
                        </div>
                        
                        {block.height > 40 && (
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {format(new Date(block.start_time), 'HH:mm')} - {format(new Date(block.end_time), 'HH:mm')}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-muted/50 text-[10px]">
                              {DEMAND_TYPE_LABELS[block.demand_type]}
                            </span>
                          </div>
                        )}
                        
                        {block.height > 60 && block.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {block.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Priority indicator */}
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PRIORITY_COLORS[block.priority] }}
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

            {/* Current time indicator */}
            <CurrentTimeIndicator currentDate={currentDate} slotHeight={SLOT_HEIGHT} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CurrentTimeIndicator({ currentDate, slotHeight }: { currentDate: Date; slotHeight: number }) {
  const now = new Date();
  
  if (!isSameDay(now, currentDate)) return null;
  
  const minutes = now.getHours() * 60 + now.getMinutes();
  const top = (minutes / 60) * slotHeight;
  
  return (
    <div 
      className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
      style={{ top }}
    >
      <div className="w-2 h-2 rounded-full bg-destructive" />
      <div className="flex-1 h-0.5 bg-destructive" />
    </div>
  );
}
