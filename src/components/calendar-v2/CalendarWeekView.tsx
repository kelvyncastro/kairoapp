import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isToday,
  setHours,
  setMinutes,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarBlock, PRIORITY_COLORS } from '@/types/calendar-blocks';
import { Check, AlertTriangle } from 'lucide-react';

interface CalendarWeekViewProps {
  currentDate: Date;
  blocks: CalendarBlock[];
  onBlockClick: (block: CalendarBlock) => void;
  onDayClick: (date: Date) => void;
  onSlotSelect: (start: Date, end: Date) => void;
}

const SLOT_HEIGHT = 48; // pixels per hour
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function CalendarWeekView({
  currentDate,
  blocks,
  onBlockClick,
  onDayClick,
  onSlotSelect,
}: CalendarWeekViewProps) {
  // Get week days
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Group blocks by day
  const blocksByDay = useMemo(() => {
    const grouped: Record<string, CalendarBlock[]> = {};
    weekDays.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      grouped[key] = blocks.filter(block => 
        isSameDay(new Date(block.start_time), day)
      );
    });
    return grouped;
  }, [blocks, weekDays]);

  // Calculate daily stats
  const dailyStats = useMemo(() => {
    const stats: Record<string, { total: number; completed: number; overload: boolean }> = {};
    weekDays.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      const dayBlocks = blocksByDay[key] || [];
      const totalMinutes = dayBlocks.reduce((sum, b) => sum + (b.duration_minutes || 0), 0);
      stats[key] = {
        total: dayBlocks.length,
        completed: dayBlocks.filter(b => b.status === 'completed').length,
        overload: totalMinutes > 10 * 60, // More than 10 hours
      };
    });
    return stats;
  }, [blocksByDay, weekDays]);

  const handleSlotClick = (day: Date, hour: number) => {
    const start = setMinutes(setHours(day, hour), 0);
    const end = setMinutes(setHours(day, hour + 1), 0);
    onSlotSelect(start, end);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Week header */}
      <div className="flex border-b border-border/50 bg-card">
        <div className="w-14 flex-shrink-0" /> {/* Time column spacer */}
        {weekDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const stats = dailyStats[key];
          
          return (
            <div
              key={key}
              className={cn(
                "flex-1 p-2 text-center border-l border-border/30 cursor-pointer hover:bg-muted/50 transition-colors",
                isToday(day) && "bg-primary/10"
              )}
              onClick={() => onDayClick(day)}
            >
              <p className="text-xs text-muted-foreground uppercase">
                {format(day, 'EEE', { locale: ptBR })}
              </p>
              <p className={cn(
                "text-lg font-bold",
                isToday(day) && "text-primary"
              )}>
                {format(day, 'd')}
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {stats?.overload && (
                  <AlertTriangle className="h-3 w-3 text-warning" />
                )}
                <span className="text-xs text-muted-foreground">
                  {stats?.completed}/{stats?.total}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: 24 * SLOT_HEIGHT }}>
          {/* Time column */}
          <div className="w-14 flex-shrink-0 relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full text-right pr-2 text-xs text-muted-foreground font-mono"
                style={{ top: hour * SLOT_HEIGHT - 8 }}
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayBlocks = blocksByDay[key] || [];

            return (
              <div
                key={key}
                className={cn(
                  "flex-1 relative border-l border-border/30",
                  isToday(day) && "bg-primary/5"
                )}
              >
                {/* Hour grid lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-border/20 hover:bg-primary/5 cursor-pointer transition-colors"
                    style={{ top: hour * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                    onClick={() => handleSlotClick(day, hour)}
                  />
                ))}

                {/* Blocks */}
                {dayBlocks.map((block) => {
                  const startTime = new Date(block.start_time);
                  const endTime = new Date(block.end_time);
                  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
                  const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
                  const top = (startMinutes / 60) * SLOT_HEIGHT;
                  const height = Math.max(((endMinutes - startMinutes) / 60) * SLOT_HEIGHT, 20);

                  return (
                    <div
                      key={block.id}
                      className={cn(
                        "absolute left-0.5 right-0.5 rounded px-1 py-0.5 cursor-pointer",
                        "border-l-2 text-xs overflow-hidden hover:shadow-md transition-shadow",
                        block.status === 'completed' && "opacity-60"
                      )}
                      style={{
                        top,
                        height,
                        backgroundColor: `${block.color}30`,
                        borderLeftColor: block.color || '#6366f1',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBlockClick(block);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span className={cn(
                          "truncate font-medium",
                          block.status === 'completed' && "line-through"
                        )}>
                          {block.title}
                        </span>
                        {block.status === 'completed' && (
                          <Check className="h-3 w-3 text-success flex-shrink-0" />
                        )}
                      </div>
                      {height > 30 && (
                        <p className="text-[10px] text-muted-foreground">
                          {format(startTime, 'HH:mm')}
                        </p>
                      )}
                    </div>
                  );
                })}

                {/* Current time indicator */}
                {isToday(day) && <CurrentTimeIndicator slotHeight={SLOT_HEIGHT} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CurrentTimeIndicator({ slotHeight }: { slotHeight: number }) {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const top = (minutes / 60) * slotHeight;

  return (
    <div
      className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
      style={{ top }}
    >
      <div className="w-2 h-2 rounded-full bg-destructive -ml-1" />
      <div className="flex-1 h-0.5 bg-destructive" />
    </div>
  );
}
