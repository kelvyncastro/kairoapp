import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarBlock, CalendarDemandType, CalendarPriority, CalendarBlockStatus, CalendarRecurrenceType, RecurrenceRule } from '@/types/calendar-blocks';
import { toast } from 'sonner';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, addDays, addWeeks, addMonths, isBefore, isAfter, isSameDay } from 'date-fns';

interface UseCalendarBlocksOptions {
  view: 'day' | 'week' | 'month';
  currentDate: Date;
}

export function useCalendarBlocks({ view, currentDate }: UseCalendarBlocksOptions) {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const getDateRange = useCallback(() => {
    switch (view) {
      case 'day':
        return { start: startOfDay(currentDate), end: endOfDay(currentDate) };
      case 'week':
        return { start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    }
  }, [view, currentDate]);

  const fetchBlocks = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      
      const { data, error } = await supabase
        .from('calendar_blocks')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      // Map the data to ensure proper typing
      const mappedBlocks: CalendarBlock[] = (data || []).map(block => ({
        ...block,
        demand_type: block.demand_type as CalendarDemandType,
        priority: block.priority as CalendarPriority,
        status: block.status as CalendarBlockStatus,
        recurrence_type: block.recurrence_type as CalendarRecurrenceType,
        recurrence_rule: block.recurrence_rule as unknown as RecurrenceRule | null,
      }));
      
      setBlocks(mappedBlocks);
    } catch (error) {
      console.error('Error fetching calendar blocks:', error);
      toast.error('Erro ao carregar blocos');
    } finally {
      setLoading(false);
    }
  }, [user, getDateRange]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('calendar-blocks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_blocks',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchBlocks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchBlocks]);

  const createBlock = async (block: Omit<CalendarBlock, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'duration_minutes'>) => {
    if (!user) return null;

    try {
      // Convert for Supabase types
      const { recurrence_rule, ...rest } = block;
      const insertData: Record<string, unknown> = {
        ...rest,
        user_id: user.id,
      };
      if (recurrence_rule !== undefined) {
        insertData.recurrence_rule = recurrence_rule as unknown as Record<string, unknown>;
      }

      const { data, error } = await supabase
        .from('calendar_blocks')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;

      // Generate recurring instances if needed
      if (block.recurrence_type !== 'none' && block.recurrence_rule) {
        await generateRecurringInstances(data.id, block);
      }

      toast.success('Demanda criada!');
      return data;
    } catch (error) {
      console.error('Error creating block:', error);
      toast.error('Erro ao criar demanda');
      return null;
    }
  };

  const generateRecurringInstances = async (
    parentId: string, 
    block: Omit<CalendarBlock, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'duration_minutes'>
  ) => {
    if (!user || !block.recurrence_rule) return;

    const rule = block.recurrence_rule;
    const instances: any[] = [];
    let currentStart = new Date(block.start_time);
    let currentEnd = new Date(block.end_time);
    const duration = currentEnd.getTime() - currentStart.getTime();
    const endDate = rule.until ? new Date(rule.until) : addMonths(currentStart, 3); // Max 3 months ahead
    const maxCount = rule.count || 90; // Max 90 instances
    let count = 0;

    while (isBefore(currentStart, endDate) && count < maxCount) {
      // Skip the first one (it's the parent)
      if (count > 0) {
        instances.push({
          user_id: user.id,
          title: block.title,
          description: block.description,
          start_time: currentStart.toISOString(),
          end_time: new Date(currentStart.getTime() + duration).toISOString(),
          demand_type: block.demand_type,
          priority: block.priority,
          status: 'pending' as const,
          color: block.color,
          recurrence_type: 'none' as const,
          recurrence_parent_id: parentId,
        });
      }

      // Calculate next occurrence
      switch (rule.frequency) {
        case 'daily':
          currentStart = addDays(currentStart, rule.interval);
          break;
        case 'weekly':
          if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
            // Find next day of week
            let nextDate = addDays(currentStart, 1);
            while (!rule.daysOfWeek.includes(nextDate.getDay())) {
              nextDate = addDays(nextDate, 1);
            }
            currentStart = nextDate;
          } else {
            currentStart = addWeeks(currentStart, rule.interval);
          }
          break;
        case 'monthly':
          currentStart = addMonths(currentStart, rule.interval);
          break;
      }
      
      count++;
    }

    if (instances.length > 0) {
      await supabase.from('calendar_blocks').insert(instances);
    }
  };

  const updateBlock = async (id: string, updates: Partial<CalendarBlock>) => {
    try {
      // Remove computed fields and convert types for Supabase
      const { duration_minutes, recurrence_rule, ...rest } = updates;
      const dbUpdates: Record<string, unknown> = { ...rest };
      if (recurrence_rule !== undefined) {
        dbUpdates.recurrence_rule = recurrence_rule as unknown as Record<string, unknown>;
      }
     
      const block = blocks.find(b => b.id === id);
      
      // Check if recurrence settings changed (need to regenerate children)
      const recurrenceChanged = 
        updates.recurrence_type !== undefined || 
        recurrence_rule !== undefined ||
        (updates.recurrence_rule !== undefined && JSON.stringify(updates.recurrence_rule) !== JSON.stringify(block?.recurrence_rule));
      
      const isPartOfSeries = block && (block.recurrence_parent_id || block.recurrence_type !== 'none');
      
      // If this block is part of a series or recurrence changed, handle specially
      if (isPartOfSeries || recurrenceChanged) {
        const parentId = block?.recurrence_parent_id || id;
        
        // If recurrence settings changed, we need to delete old children and regenerate
        if (recurrenceChanged && block) {
          // Delete all existing child blocks
          await supabase
            .from('calendar_blocks')
            .delete()
            .eq('recurrence_parent_id', parentId);
          
          // Update the parent block (or current block if it's the parent)
          const parentUpdates: Record<string, unknown> = { ...dbUpdates };
          
          const { error: updateError } = await supabase
            .from('calendar_blocks')
            .update(parentUpdates)
            .eq('id', parentId);
          
          if (updateError) throw updateError;
          
          // Regenerate children if recurrence is enabled
          const newRecurrenceType = updates.recurrence_type ?? block.recurrence_type;
          const newRecurrenceRule = recurrence_rule ?? block.recurrence_rule;
          
          if (newRecurrenceType !== 'none' && newRecurrenceRule) {
            const updatedBlock = {
              ...block,
              ...updates,
              start_time: updates.start_time ?? block.start_time,
              end_time: updates.end_time ?? block.end_time,
              recurrence_type: newRecurrenceType,
              recurrence_rule: newRecurrenceRule,
            };
            await generateRecurringInstances(parentId, updatedBlock as any);
          }
          
          await fetchBlocks();
          toast.success('Demanda atualizada!');
          return true;
        }
        
        // If not recurrence change but part of series, sync relevant fields
        if (isPartOfSeries && block) {
          // Build sync updates for recurring series (color, title, description, etc.)
          const syncUpdates: Record<string, unknown> = {};
          
          if (updates.color !== undefined) {
            syncUpdates.color = updates.color;
          }
          if (updates.title !== undefined) {
            syncUpdates.title = updates.title;
          }
          if (updates.description !== undefined) {
            syncUpdates.description = updates.description;
          }
          if (updates.priority !== undefined) {
            syncUpdates.priority = updates.priority;
          }
          if (updates.demand_type !== undefined) {
            syncUpdates.demand_type = updates.demand_type;
          }
          
          // If time is being updated, calculate the time difference and apply to all
          if (updates.start_time && updates.end_time) {
            const oldStart = new Date(block.start_time);
            const oldEnd = new Date(block.end_time);
            const newStart = new Date(updates.start_time);
            const newEnd = new Date(updates.end_time);
            const timeDiff = newStart.getTime() - oldStart.getTime();
            const durationDiff = (newEnd.getTime() - newStart.getTime()) - (oldEnd.getTime() - oldStart.getTime());
            
            // Get all related blocks and update their times
            const { data: relatedBlocks } = await supabase
              .from('calendar_blocks')
              .select('*')
              .or(`id.eq.${parentId},recurrence_parent_id.eq.${parentId}`);
            
            if (relatedBlocks) {
              for (const relBlock of relatedBlocks) {
                const relOldStart = new Date(relBlock.start_time);
                const relOldEnd = new Date(relBlock.end_time);
                const relNewStart = new Date(relOldStart.getTime() + timeDiff);
                const relNewEnd = new Date(relOldEnd.getTime() + timeDiff + durationDiff);
                
                const blockUpdate: Record<string, unknown> = {
                  start_time: relNewStart.toISOString(),
                  end_time: relNewEnd.toISOString(),
                  ...syncUpdates,
                };
                
                await supabase
                  .from('calendar_blocks')
                  .update(blockUpdate)
                  .eq('id', relBlock.id);
              }
              
              await fetchBlocks();
              toast.success('Demanda atualizada!');
              return true;
            }
          }
          
          // If only non-time fields are being updated, sync to all blocks in series
          if (Object.keys(syncUpdates).length > 0) {
            await supabase
              .from('calendar_blocks')
              .update(syncUpdates)
              .or(`id.eq.${parentId},recurrence_parent_id.eq.${parentId}`);
          }
        }
      }
      
      // Always update the specific block being edited (for non-recurring or single updates)
      const { error } = await supabase
        .from('calendar_blocks')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      await fetchBlocks();
      toast.success('Demanda atualizada!');
      return true;
    } catch (error) {
      console.error('Error updating block:', error);
      toast.error('Erro ao atualizar demanda');
      return false;
    }
  };

  const deleteBlock = async (id: string, deleteRecurring = false) => {
    try {
      if (deleteRecurring) {
        // Delete all instances with this parent ID
        await supabase
          .from('calendar_blocks')
          .delete()
          .eq('recurrence_parent_id', id);
      }

      const { error } = await supabase
        .from('calendar_blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Immediately refetch to update UI
      await fetchBlocks();
      
      toast.success('Demanda excluída!');
      return true;
    } catch (error) {
      console.error('Error deleting block:', error);
      toast.error('Erro ao excluir demanda');
      return false;
    }
  };

  const duplicateBlock = async (block: CalendarBlock) => {
    const { id, user_id, created_at, updated_at, duration_minutes, ...rest } = block;
    return createBlock({
      ...rest,
      title: `${block.title} (cópia)`,
      recurrence_type: 'none',
      recurrence_rule: null,
      recurrence_parent_id: null,
    });
  };

  const moveBlock = async (id: string, newStartTime: Date, newEndTime: Date, scope?: 'this' | 'all') => {
    const block = blocks.find(b => b.id === id);
    
    // If scope is 'all' and it's part of a recurring series, update all instances
    if (scope === 'all' && block) {
      const parentId = block.recurrence_parent_id || id;
      
      // Calculate the time difference
      const oldStart = new Date(block.start_time);
      const timeDiff = newStartTime.getTime() - oldStart.getTime();
      
      // Get all related blocks
      const { data: relatedBlocks } = await supabase
        .from('calendar_blocks')
        .select('*')
        .or(`id.eq.${parentId},recurrence_parent_id.eq.${parentId}`);
      
      if (relatedBlocks) {
        // Update each block with the time difference
        for (const relBlock of relatedBlocks) {
          const relOldStart = new Date(relBlock.start_time);
          const relOldEnd = new Date(relBlock.end_time);
          const relNewStart = new Date(relOldStart.getTime() + timeDiff);
          const relNewEnd = new Date(relOldEnd.getTime() + timeDiff);
          
          await supabase
            .from('calendar_blocks')
            .update({
              start_time: relNewStart.toISOString(),
              end_time: relNewEnd.toISOString(),
            })
            .eq('id', relBlock.id);
        }
        
        toast.success('Todos os eventos atualizados!');
        fetchBlocks();
        return true;
      }
    }
    
    // Just update this single instance
    return updateBlock(id, {
      start_time: newStartTime.toISOString(),
      end_time: newEndTime.toISOString(),
    });
  };

  const completeBlock = async (id: string) => {
    return updateBlock(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      actual_end_time: new Date().toISOString(),
    });
  };

  const postponeBlock = async (id: string, newDate: Date) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return false;

    const startTime = new Date(block.start_time);
    const endTime = new Date(block.end_time);
    const duration = endTime.getTime() - startTime.getTime();

    // Keep the same time, just change the date
    const newStartTime = new Date(newDate);
    newStartTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    const newEndTime = new Date(newStartTime.getTime() + duration);

    return updateBlock(id, {
      start_time: newStartTime.toISOString(),
      end_time: newEndTime.toISOString(),
      status: 'postponed',
    });
  };

  return {
    blocks,
    loading,
    refetch: fetchBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    moveBlock,
    completeBlock,
    postponeBlock,
  };
}
