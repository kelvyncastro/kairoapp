import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
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
  setHours,
  setMinutes,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarBlock } from '@/types/calendar-blocks';
import { RecurrenceEditDialog, RecurrenceEditScope } from './RecurrenceEditDialog';

interface CalendarMonthViewProps {
  currentDate: Date;
  blocks: CalendarBlock[];
  onDayClick: (date: Date) => void;
  onBlockClick: (block: CalendarBlock) => void;
  onBlockMove?: (id: string, newStart: Date, newEnd: Date, scope?: RecurrenceEditScope) => Promise<boolean>;
}

const WEEKDAY_LABELS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export function CalendarMonthView({
  currentDate,
  blocks,
  onDayClick,
  onBlockClick,
  onBlockMove,
}: CalendarMonthViewProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [movingBlock, setMovingBlock] = useState<CalendarBlock | null>(null);
  const [moveTargetDay, setMoveTargetDay] = useState<Date | null>(null);

  // Click vs drag detection
  const [pendingDragBlock, setPendingDragBlock] = useState<CalendarBlock | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [dragStartTime, setDragStartTime] = useState<number>(0);
  const DRAG_THRESHOLD = 5;
  const DRAG_TIME_THRESHOLD = 150;

  // Recurrence dialog state
  const [recurrenceDialogOpen, setRecurrenceDialogOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    block: CalendarBlock;
    newStart: Date;
    newEnd: Date;
  } | null>(null);

  // Generate calendar grid
  const { weeks, blocksByDay, allDays } = useMemo(() => {
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

    return { weeks: weeksArr, blocksByDay: map, allDays: days };
  }, [currentDate, blocks]);

  // Get day from mouse position
  const getDayFromPosition = useCallback((clientX: number, clientY: number): Date | null => {
    if (!gridRef.current) return null;
    
    const cells = gridRef.current.querySelectorAll('[data-day]');
    for (const cell of cells) {
      const rect = cell.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        const dayStr = cell.getAttribute('data-day');
        if (dayStr) {
          const found = allDays.find(d => format(d, 'yyyy-MM-dd') === dayStr);
          return found || null;
        }
      }
    }
    return null;
  }, [allDays]);

  // Block mousedown
  const handleBlockMouseDown = useCallback((e: React.MouseEvent, block: CalendarBlock) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setPendingDragBlock(block);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setDragStartTime(Date.now());
  }, []);

  // Start block move
  const startBlockMove = useCallback((block: CalendarBlock) => {
    setMovingBlock(block);
    setMoveTargetDay(new Date(block.start_time));
    setPendingDragBlock(null);
    setDragStartPos(null);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Check if we should start dragging
    if (pendingDragBlock && dragStartPos) {
      const dx = Math.abs(e.clientX - dragStartPos.x);
      const dy = Math.abs(e.clientY - dragStartPos.y);
      const elapsed = Date.now() - dragStartTime;
      
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD || (elapsed > DRAG_TIME_THRESHOLD && (dx > 2 || dy > 2))) {
        startBlockMove(pendingDragBlock);
      }
      return;
    }

    // Handle moving
    if (movingBlock) {
      const targetDay = getDayFromPosition(e.clientX, e.clientY);
      if (targetDay) {
        setMoveTargetDay(targetDay);
      }
    }
  }, [pendingDragBlock, dragStartPos, dragStartTime, movingBlock, getDayFromPosition, startBlockMove]);

  const handleMouseUp = useCallback(async () => {
    // Click without drag
    if (pendingDragBlock && !movingBlock) {
      onBlockClick(pendingDragBlock);
      setPendingDragBlock(null);
      setDragStartPos(null);
      return;
    }

    // Complete move - only change day, keep original time
    if (movingBlock && moveTargetDay && onBlockMove) {
      const blockStart = new Date(movingBlock.start_time);
      const blockEnd = new Date(movingBlock.end_time);
      
      // Keep the same time, just change the day
      const newStart = setMinutes(
        setHours(moveTargetDay, blockStart.getHours()),
        blockStart.getMinutes()
      );
      const newEnd = setMinutes(
        setHours(moveTargetDay, blockEnd.getHours()),
        blockEnd.getMinutes()
      );

      const isRecurring = movingBlock.recurrence_type !== 'none' || movingBlock.recurrence_parent_id;

      if (isRecurring) {
        setPendingMove({ block: movingBlock, newStart, newEnd });
        setRecurrenceDialogOpen(true);
      } else {
        await onBlockMove(movingBlock.id, newStart, newEnd);
      }

      setMovingBlock(null);
      setMoveTargetDay(null);
      setPendingDragBlock(null);
      setDragStartPos(null);
      return;
    }

    setMovingBlock(null);
    setMoveTargetDay(null);
    setPendingDragBlock(null);
    setDragStartPos(null);
  }, [pendingDragBlock, movingBlock, moveTargetDay, onBlockMove, onBlockClick]);

  // Handle recurrence dialog confirmation
  const handleRecurrenceConfirm = async (scope: RecurrenceEditScope) => {
    if (pendingMove && onBlockMove) {
      await onBlockMove(pendingMove.block.id, pendingMove.newStart, pendingMove.newEnd, scope);
    }
    setPendingMove(null);
  };

  // Global mouse up
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (movingBlock || pendingDragBlock) {
        handleMouseUp();
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [movingBlock, pendingDragBlock, handleMouseUp]);

  return (
    <>
      <div 
        ref={gridRef}
        className="flex flex-col h-full bg-background select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
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
                const isMoveTarget = moveTargetDay && format(moveTargetDay, 'yyyy-MM-dd') === dayKey;

                return (
                  <div
                    key={dayKey}
                    data-day={dayKey}
                    className={cn(
                      "relative border-r border-b border-border/20 p-1 cursor-pointer transition-colors overflow-hidden",
                      "hover:bg-accent/40",
                      !isCurrentMonth && "bg-muted/30",
                      dayIdx === 0 && "border-l-0",
                      isToday(day) && "bg-primary/5",
                      isMoveTarget && "ring-2 ring-primary ring-inset bg-primary/10"
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
                      {dayBlocks.slice(0, maxVisible).map((block) => {
                        const isBeingMoved = movingBlock?.id === block.id;
                        
                        return (
                          <div
                            key={block.id}
                            className={cn(
                              "text-[10px] leading-tight px-1.5 py-0.5 rounded truncate cursor-grab",
                              "text-primary-foreground font-medium shadow-sm bg-primary",
                              "hover:brightness-110 transition-all",
                              isBeingMoved && "opacity-40"
                            )}
                            onMouseDown={(e) => handleBlockMouseDown(e, block)}
                          >
                            {format(new Date(block.start_time), 'HH:mm')} {block.title}
                          </div>
                        );
                      })}
                      
                      {hasMore && (
                        <div className="text-[10px] text-muted-foreground font-medium px-1.5">
                          +{dayBlocks.length - maxVisible} mais
                        </div>
                      )}
                    </div>

                    {/* Moving block preview */}
                    {movingBlock && isMoveTarget && (
                      <div
                        className="text-[10px] leading-tight px-1.5 py-0.5 rounded truncate mt-0.5 font-medium shadow-lg ring-2 ring-white/50 bg-primary text-primary-foreground"
                      >
                        {format(new Date(movingBlock.start_time), 'HH:mm')} {movingBlock.title}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Recurrence Edit Dialog */}
      <RecurrenceEditDialog
        open={recurrenceDialogOpen}
        onClose={() => {
          setRecurrenceDialogOpen(false);
          setPendingMove(null);
        }}
        onConfirm={handleRecurrenceConfirm}
      />
    </>
  );
}
