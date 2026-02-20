import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Hook to sync finance transactions with calendar blocks.
 * - Creates a calendar block when a pending transaction is added.
 * - Marks the calendar block as completed when the transaction is paid.
 */
export function useFinanceCalendarSync() {
  const { user } = useAuth();

  /**
   * Create a calendar block for a pending finance transaction.
   */
  const createFinanceBlock = useCallback(async (transaction: {
    id: string;
    name: string;
    date: string;
    value: number;
    sector_name?: string;
  }) => {
    if (!user) return;

    try {
      // Create a block at 09:00 on the transaction date, lasting 30 min
      const startTime = new Date(`${transaction.date}T09:00:00`);
      const endTime = new Date(`${transaction.date}T09:30:00`);

      const label = transaction.value < 0 ? 'Pagar' : 'Receber';
      const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(Math.abs(transaction.value));

      const title = `💰 ${label}: ${transaction.name}`;
      const description = `${formattedValue}${transaction.sector_name ? ` • ${transaction.sector_name}` : ''}`;

      const insertData: Record<string, unknown> = {
        user_id: user.id,
        title,
        description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        demand_type: 'fixed',
        priority: 'high',
        status: 'pending',
        recurrence_type: 'none',
        color: transaction.value < 0 ? '#ef4444' : '#22c55e',
        source_type: 'finance',
        finance_transaction_id: transaction.id,
      };

      const { error } = await supabase
        .from('calendar_blocks')
        .insert(insertData as any);

      if (error) throw error;
      toast.success('Lembrete adicionado à agenda!');
    } catch (e) {
      console.error('Error creating finance calendar block:', e);
    }
  }, [user]);

  /**
   * Mark the calendar block as completed when the transaction is paid.
   */
  const completeFinanceBlock = useCallback(async (transactionId: string) => {
    if (!user) return;

    try {
      // Use raw query approach to avoid deep type instantiation
      const { error } = await (supabase
        .from('calendar_blocks') as any)
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('finance_transaction_id', transactionId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (e) {
      console.error('Error completing finance calendar block:', e);
    }
  }, [user]);

  /**
   * Delete the calendar block when the transaction is deleted.
   */
  const deleteFinanceBlock = useCallback(async (transactionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('calendar_blocks')
        .delete()
        .eq('finance_transaction_id' as any, transactionId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (e) {
      console.error('Error deleting finance calendar block:', e);
    }
  }, [user]);

  return { createFinanceBlock, completeFinanceBlock, deleteFinanceBlock };
}
