import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { format, isSameDay, isToday, differenceInMinutes, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarBlock,
} from '@/types/calendar-blocks';
import { Check, GripVertical, DollarSign } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { RecurrenceEditDialog, RecurrenceEditScope } from './RecurrenceEditDialog';

interface CalendarDayViewProps {
  currentDate: Date;
  blocks: CalendarBlock[];
  onBlockClick: (block: CalendarBlock) => void;
  onSlotSelect: (start: Date, end: Date) => void;
  onBlockComplete?: (id: string) => Promise<boolean>;
  onBlockDelete?: (id: string) => Promise<boolean>;
  onBlockDuplicate?: (block: CalendarBlock) => Promise<any>;
  onBlockMove?: (id: string, newStart: Date, newEnd: Date, scope?: RecurrenceEditScope) => Promise<boolean>;
}

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Snap to 15-minute intervals
const snapToQuarter = (minutes: number): number => {
  return Math.round(minutes / 15) * 15;
};

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const dayColumnRef = useRef<HTMLDivElement>(null);

  // Drag-to-create state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartMinutes, setDragStartMinutes] = useState(0);
  const [dragEndMinutes, setDragEndMinutes] = useState(0);

  // Drag-to-move state
  const [movingBlock, setMovingBlock] = useState<CalendarBlock | null>(null);
  const [moveTargetMinutes, setMoveTargetMinutes] = useState(0);
  const [moveOffsetMinutes, setMoveOffsetMinutes] = useState(0);

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
      return { ...block, top, height, durationMinutes };
    });
  }, [dayBlocks]);

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
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || movingBlock || pendingDragBlock) return;
    e.preventDefault();
    const minutes = getMinutesFromY(e.clientY);
    setIsDragging(true);
    setDragStartMinutes(minutes);
    setDragEndMinutes(minutes + 15);
  }, [getMinutesFromY, movingBlock, pendingDragBlock]);

  // Block mousedown - start tracking potential drag
  const handleBlockMouseDown = useCallback((e: React.MouseEvent, block: CalendarBlock) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setPendingDragBlock(block);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setDragStartTime(Date.now());
  }, []);

  // Actually start moving the block
  const startBlockMove = useCallback((block: CalendarBlock, clientY: number) => {
    const blockStartTime = new Date(block.start_time);
    const blockStartMinutes = blockStartTime.getHours() * 60 + blockStartTime.getMinutes();
    const clickMinutes = getMinutesFromY(clientY);
    
    setMovingBlock(block);
    setMoveOffsetMinutes(clickMinutes - blockStartMinutes);
    setMoveTargetMinutes(blockStartMinutes);
    setPendingDragBlock(null);
    setDragStartPos(null);
  }, [getMinutesFromY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Check if we should start dragging a block
    if (pendingDragBlock && dragStartPos) {
      const dx = Math.abs(e.clientX - dragStartPos.x);
      const dy = Math.abs(e.clientY - dragStartPos.y);
      const elapsed = Date.now() - dragStartTime;
      
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD || (elapsed > DRAG_TIME_THRESHOLD && (dx > 2 || dy > 2))) {
        startBlockMove(pendingDragBlock, e.clientY);
      }
      return;
    }

    // Handle block moving
    if (movingBlock) {
      const minutes = getMinutesFromY(e.clientY);
      const adjustedMinutes = snapToQuarter(Math.max(0, minutes - moveOffsetMinutes));
      setMoveTargetMinutes(adjustedMinutes);
      return;
    }

    // Handle drag-to-create
    if (!isDragging) return;
    const minutes = getMinutesFromY(e.clientY);
    setDragEndMinutes(minutes);
  }, [isDragging, getMinutesFromY, movingBlock, moveOffsetMinutes, pendingDragBlock, dragStartPos, dragStartTime, startBlockMove]);

  const handleMouseUp = useCallback(async () => {
    // If we had a pending drag that never started, treat as click
    if (pendingDragBlock && !movingBlock) {
      onBlockClick(pendingDragBlock);
      setPendingDragBlock(null);
      setDragStartPos(null);
      return;
    }

    // Handle block move completion
    if (movingBlock && onBlockMove) {
      const blockStart = new Date(movingBlock.start_time);
      const blockEnd = new Date(movingBlock.end_time);
      const duration = differenceInMinutes(blockEnd, blockStart);
      
      const newStartHour = Math.floor(moveTargetMinutes / 60);
      const newStartMinute = moveTargetMinutes % 60;
      const newStart = setMinutes(setHours(currentDate, newStartHour), newStartMinute);
      const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);

      const isRecurring = movingBlock.recurrence_type !== 'none' || movingBlock.recurrence_parent_id;

      if (isRecurring) {
        setPendingMove({ block: movingBlock, newStart, newEnd });
        setRecurrenceDialogOpen(true);
      } else {
        await onBlockMove(movingBlock.id, newStart, newEnd);
      }

      setMovingBlock(null);
      setPendingDragBlock(null);
      setDragStartPos(null);
      return;
    }

    if (!isDragging) {
      setIsDragging(false);
      setPendingDragBlock(null);
      setDragStartPos(null);
      return;
    }
    
    const startMin = Math.min(dragStartMinutes, dragEndMinutes);
    const endMin = Math.max(dragStartMinutes, dragEndMinutes);
    const finalEndMin = endMin === startMin ? startMin + 30 : endMin;
    
    const startHour = Math.floor(startMin / 60);
    const startMinute = startMin % 60;
    const endHour = Math.floor(finalEndMin / 60);
    const endMinute = finalEndMin % 60;
    
    const start = setMinutes(setHours(currentDate, startHour), startMinute);
    const end = setMinutes(setHours(currentDate, endHour), endMinute);
    
    onSlotSelect(start, end);
    setIsDragging(false);
    setPendingDragBlock(null);
    setDragStartPos(null);
  }, [isDragging, dragStartMinutes, dragEndMinutes, currentDate, onSlotSelect, movingBlock, moveTargetMinutes, onBlockMove, pendingDragBlock, onBlockClick]);

  // Handle recurrence dialog confirmation
  const handleRecurrenceConfirm = async (scope: RecurrenceEditScope) => {
    if (pendingMove && onBlockMove) {
      await onBlockMove(pendingMove.block.id, pendingMove.newStart, pendingMove.newEnd, scope);
    }
    setPendingMove(null);
  };

  // Global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging || movingBlock || pendingDragBlock) {
        handleMouseUp();
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, movingBlock, pendingDragBlock, handleMouseUp]);

  // Get drag preview style
  const getDragPreviewStyle = () => {
    if (!isDragging) return null;
    const startMin = Math.min(dragStartMinutes, dragEndMinutes);
    const endMin = Math.max(dragStartMinutes, dragEndMinutes);
    const finalEndMin = endMin === startMin ? startMin + 15 : endMin;
    const top = (startMin / 60) * HOUR_HEIGHT;
    const height = ((finalEndMin - startMin) / 60) * HOUR_HEIGHT;
    return { top, height, startMin, endMin: finalEndMin };
  };

  // Get moving block preview style
  const getMovingBlockStyle = () => {
    if (!movingBlock) return null;
    const blockStart = new Date(movingBlock.start_time);
    const blockEnd = new Date(movingBlock.end_time);
    const duration = differenceInMinutes(blockEnd, blockStart);
    
    const top = (moveTargetMinutes / 60) * HOUR_HEIGHT;
    const height = Math.max((duration / 60) * HOUR_HEIGHT, 28);
    
    return { top, height };
  };

  const dragPreviewStyle = getDragPreviewStyle();
  const movingBlockStyle = getMovingBlockStyle();

  return (
    <>
    <div 
      className="flex flex-col h-full bg-background select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Day header */}
      <div className="flex-shrink-0 border-b border-border/40">
        <div className="flex">
          <div className="w-16 flex-shrink-0 py-3 px-2">
          </div>
          <div className="flex-1 flex flex-col items-center py-2">
            <span className={cn(
              "text-[11px] font-semibold tracking-wider uppercase",
              isToday(currentDate) ? "text-primary" : "text-muted-foreground"
            )}>
              {format(currentDate, 'EEE', { locale: ptBR })}.
            </span>
            <span className={cn(
              "text-2xl font-medium mt-1 w-11 h-11 flex items-center justify-center rounded-full transition-all",
              isToday(currentDate) 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                : "text-foreground"
            )}>
              {format(currentDate, 'd')}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex min-h-full">
          {/* Time labels */}
          <div className="w-16 flex-shrink-0">
            {HOURS.map((hour) => (
              <div key={hour} className="relative" style={{ height: HOUR_HEIGHT }}>
                <span className="absolute -top-2.5 right-3 text-[11px] text-muted-foreground/70 font-mono">
                  {hour === 0 ? '' : `${hour} ${hour < 12 ? 'AM' : 'PM'}`}
                </span>
              </div>
            ))}
          </div>

          {/* Day column */}
          <div 
            ref={dayColumnRef}
            className="flex-1 relative border-l border-border/30"
            onMouseDown={handleMouseDown}
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
            {isDragging && dragPreviewStyle && (
              <div
                className="absolute left-2 right-4 rounded-lg bg-primary/40 border-2 border-primary border-dashed pointer-events-none z-20"
                style={{
                  top: dragPreviewStyle.top,
                  height: dragPreviewStyle.height,
                }}
              >
                <div className="px-3 py-1 text-sm font-semibold text-primary">
                  {format(setMinutes(setHours(currentDate, Math.floor(dragPreviewStyle.startMin / 60)), dragPreviewStyle.startMin % 60), 'HH:mm')} - 
                  {format(setMinutes(setHours(currentDate, Math.floor(dragPreviewStyle.endMin / 60)), dragPreviewStyle.endMin % 60), 'HH:mm')}
                </div>
              </div>
            )}

            {/* Moving block preview */}
            {movingBlock && movingBlockStyle && (
              <div
                className="absolute left-2 right-4 rounded-lg px-3 py-1.5 pointer-events-none z-30 opacity-80 shadow-lg ring-2 ring-primary bg-primary text-primary-foreground"
                style={{
                  top: movingBlockStyle.top,
                  height: movingBlockStyle.height,
                }}
              >
                <div className="truncate font-semibold text-sm">{movingBlock.title}</div>
              </div>
            )}

            {/* Current time indicator */}
            {isToday(currentDate) && <CurrentTimeIndicator hourHeight={HOUR_HEIGHT} />}

            {/* Blocks */}
            {positionedBlocks.map((block) => {
              const isBeingMoved = movingBlock?.id === block.id;
              if (isBeingMoved) return null;

              return (
                <ContextMenu key={block.id}>
                  <ContextMenuTrigger asChild>
                    <div
                      className={cn(
                        "absolute left-2 right-4 rounded-lg px-3 py-1.5 cursor-grab active:cursor-grabbing",
                        "text-primary-foreground overflow-hidden group shadow-sm bg-primary",
                        "hover:shadow-lg hover:brightness-110 transition-all",
                        block.status === 'completed' && "opacity-60"
                      )}
                      style={{
                        top: block.top,
                        height: block.height,
                      }}
                      onMouseDown={(e) => handleBlockMouseDown(e, block)}
                    >
                      <div className="flex items-start gap-2 h-full">
                        <GripVertical className="h-4 w-4 opacity-0 group-hover:opacity-70 transition-opacity flex-shrink-0 cursor-grab mt-0.5" />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-semibold text-sm truncate",
                              block.status === 'completed' && "line-through"
                            )}>
                              {block.title}
                            </span>
                            {block.status === 'completed' && (
                              <Check className="h-3 w-3 flex-shrink-0" />
                            )}
                          </div>
                          
                          {block.height > 45 && (
                            <div className="text-xs opacity-80 mt-0.5">
                              {format(new Date(block.start_time), 'H:mm')} - {format(new Date(block.end_time), 'H:mm')}
                            </div>
                          )}
                          
                          {block.height > 70 && block.description && (
                            <p className="text-xs opacity-70 mt-1 line-clamp-2">
                              {block.description}
                            </p>
                          )}
                         </div>
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
              );
            })}
          </div>
        </div>
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
