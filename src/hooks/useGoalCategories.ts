import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { GoalCategory } from '@/components/goals/GoalCategorySidebar';

export function useGoalCategories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<GoalCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('goal_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(
        (data || []).map((cat) => ({
          id: cat.id,
          name: cat.name,
          color: cat.color || '#6366f1',
          icon: cat.icon || 'target',
          isDefault: cat.is_default || false,
        }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (category: Partial<GoalCategory>): Promise<GoalCategory | null> => {
    if (!user || !category.name) return null;

    const { data, error } = await supabase
      .from('goal_categories')
      .insert({
        user_id: user.id,
        name: category.name,
        color: category.color || '#6366f1',
        icon: category.icon || 'target',
        order: categories.length,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Erro ao criar categoria', variant: 'destructive' });
      return null;
    }

    toast({ title: 'Categoria criada!' });
    await fetchCategories();
    return {
      id: data.id,
      name: data.name,
      color: data.color || '#6366f1',
      icon: data.icon || 'target',
      isDefault: data.is_default || false,
    };
  };

  const updateCategory = async (id: string, updates: Partial<GoalCategory>): Promise<boolean> => {
    const { error } = await supabase
      .from('goal_categories')
      .update({
        name: updates.name,
        color: updates.color,
        icon: updates.icon,
      })
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao atualizar categoria', variant: 'destructive' });
      return false;
    }

    toast({ title: 'Categoria atualizada!' });
    await fetchCategories();
    return true;
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('goal_categories')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao excluir categoria', variant: 'destructive' });
      return false;
    }

    toast({ title: 'Categoria excluída!' });
    await fetchCategories();
    return true;
  };

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
