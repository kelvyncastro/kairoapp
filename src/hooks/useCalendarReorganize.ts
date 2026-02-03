import { useState, useCallback } from 'react';
import { CalendarBlock, CalendarPriority } from '@/types/calendar-blocks';
import { 
  addDays, 
  addMinutes, 
  setHours, 
  setMinutes, 
  isBefore, 
  differenceInMinutes,
  startOfDay,
  endOfDay,
  format,
} from 'date-fns';
import { toast } from 'sonner';

interface ReorganizeOptions {
  date: Date;
  blocks: CalendarBlock[];
  workdayStart?: number; // Hour to start (default 8)
  workdayEnd?: number; // Hour to end (default 22)
  breakDuration?: number; // Minutes between blocks (default 15)
  lunchStart?: number; // Lunch hour start (default 12)
  lunchDuration?: number; // Lunch duration in minutes (default 60)
}

interface ReorganizeResult {
  reorganized: Array<{
    id: string;
    newStartTime: Date;
    newEndTime: Date;
  }>;
  removed: CalendarBlock[];
  unchanged: CalendarBlock[];
  message: string;
}

export function useCalendarReorganize() {
  const [isReorganizing, setIsReorganizing] = useState(false);

  const reorganizeDay = useCallback(async (
    options: ReorganizeOptions,
    onUpdate: (id: string, newStart: Date, newEnd: Date) => Promise<boolean>
  ): Promise<ReorganizeResult> => {
    setIsReorganizing(true);

    try {
      const {
        date,
        blocks,
        workdayStart = 8,
        workdayEnd = 22,
        breakDuration = 15,
        lunchStart = 12,
        lunchDuration = 60,
      } = options;

      // Filter blocks for this day that are not completed
      const pendingBlocks = blocks
        .filter(b => b.status === 'pending' || b.status === 'in_progress')
        .sort((a, b) => {
          // Sort by priority (urgent first), then by demand type (fixed first)
          const priorityOrder: Record<CalendarPriority, number> = {
            urgent: 0,
            high: 1,
            medium: 2,
            low: 3,
          };
          const aPriority = priorityOrder[a.priority];
          const bPriority = priorityOrder[b.priority];
          
          if (aPriority !== bPriority) return aPriority - bPriority;
          
          // Fixed demands come first
          if (a.demand_type === 'fixed' && b.demand_type !== 'fixed') return -1;
          if (b.demand_type === 'fixed' && a.demand_type !== 'fixed') return 1;
          
          // Then by original start time
          return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
        });

      const completedBlocks = blocks.filter(b => b.status === 'completed');
      const fixedBlocks = pendingBlocks.filter(b => b.demand_type === 'fixed');
      const flexibleBlocks = pendingBlocks.filter(b => b.demand_type !== 'fixed');

      // Calculate available time slots
      const dayStart = setMinutes(setHours(date, workdayStart), 0);
      const dayEnd = setMinutes(setHours(date, workdayEnd), 0);
      const lunchStartTime = setMinutes(setHours(date, lunchStart), 0);
      const lunchEndTime = addMinutes(lunchStartTime, lunchDuration);

      // Build occupied slots from fixed blocks (they don't move)
      const occupiedSlots: Array<{ start: Date; end: Date }> = [];
      
      // Add lunch as occupied
      occupiedSlots.push({ start: lunchStartTime, end: lunchEndTime });
      
      // Add fixed blocks as occupied
      fixedBlocks.forEach(block => {
        occupiedSlots.push({
          start: new Date(block.start_time),
          end: new Date(block.end_time),
        });
      });

      // Sort occupied slots
      occupiedSlots.sort((a, b) => a.start.getTime() - b.start.getTime());

      // Find free slots
      const freeSlots: Array<{ start: Date; end: Date }> = [];
      let currentTime = dayStart;

      for (const slot of occupiedSlots) {
        if (isBefore(currentTime, slot.start)) {
          freeSlots.push({ start: currentTime, end: slot.start });
        }
        if (isBefore(currentTime, slot.end)) {
          currentTime = slot.end;
        }
      }
      if (isBefore(currentTime, dayEnd)) {
        freeSlots.push({ start: currentTime, end: dayEnd });
      }

      // Try to fit flexible blocks into free slots
      const reorganized: ReorganizeResult['reorganized'] = [];
      const removed: CalendarBlock[] = [];
      const unchanged: CalendarBlock[] = [...fixedBlocks, ...completedBlocks];

      for (const block of flexibleBlocks) {
        const duration = block.duration_minutes || 60;
        let placed = false;

        for (let i = 0; i < freeSlots.length; i++) {
          const slot = freeSlots[i];
          const slotDuration = differenceInMinutes(slot.end, slot.start);

          if (slotDuration >= duration + breakDuration) {
            // Block fits in this slot
            const newStart = addMinutes(slot.start, breakDuration / 2);
            const newEnd = addMinutes(newStart, duration);

            reorganized.push({
              id: block.id,
              newStartTime: newStart,
              newEndTime: newEnd,
            });

            // Update the free slot
            freeSlots[i] = {
              start: addMinutes(newEnd, breakDuration / 2),
              end: slot.end,
            };

            placed = true;
            break;
          }
        }

        if (!placed) {
          // Block doesn't fit, mark for removal/postponement
          removed.push(block);
        }
      }

      // Apply changes
      for (const change of reorganized) {
        await onUpdate(change.id, change.newStartTime, change.newEndTime);
      }

      const message = removed.length > 0
        ? `${reorganized.length} demandas reorganizadas, ${removed.length} não couberam no dia`
        : `${reorganized.length} demandas reorganizadas com sucesso!`;

      toast.success('Dia reorganizado!', { description: message });

      return {
        reorganized,
        removed,
        unchanged,
        message,
      };
    } finally {
      setIsReorganizing(false);
    }
  }, []);

  const suggestPostponedBlocks = useCallback((
    removedBlocks: CalendarBlock[],
    targetDate: Date
  ) => {
    // Suggest moving these blocks to the next day
    return removedBlocks.map(block => ({
      block,
      suggestedDate: addDays(targetDate, 1),
    }));
  }, []);

  return {
    isReorganizing,
    reorganizeDay,
    suggestPostponedBlocks,
  };
}
