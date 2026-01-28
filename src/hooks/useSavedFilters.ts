import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { FilterCondition, SavedFilter } from '@/components/tasks/TaskFiltersAdvanced';

export function useSavedFilters() {
  const { user } = useAuth();
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch saved filters
  const fetchSavedFilters = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_filters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSavedFilters(
        (data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          filters: item.filters as FilterCondition[],
        }))
      );
    } catch (error) {
      console.error('Error fetching saved filters:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedFilters();
  }, [fetchSavedFilters]);

  // Save a new filter
  const saveFilter = useCallback(async (name: string, filters: FilterCondition[]) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('saved_filters')
        .insert({
          user_id: user.id,
          name,
          filters: filters as any,
        });

      if (error) throw error;

      toast.success('Filtro salvo com sucesso!');
      await fetchSavedFilters();
    } catch (error) {
      console.error('Error saving filter:', error);
      toast.error('Erro ao salvar filtro');
    }
  }, [user, fetchSavedFilters]);

  // Delete a saved filter
  const deleteFilter = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('saved_filters')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Filtro removido');
      setSavedFilters(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      console.error('Error deleting filter:', error);
      toast.error('Erro ao remover filtro');
    }
  }, [user]);

  return {
    savedFilters,
    loading,
    saveFilter,
    deleteFilter,
  };
}
