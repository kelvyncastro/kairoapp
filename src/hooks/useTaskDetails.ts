import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TaskSubtask, TaskChecklist, TaskChecklistItem } from '@/types/tasks';

export function useTaskDetails(taskId: string | null) {
  const { toast } = useToast();
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>([]);
  const [checklists, setChecklists] = useState<TaskChecklist[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);

    const [subtasksRes, checklistsRes] = await Promise.all([
      supabase
        .from('task_subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('order_index', { ascending: true }),
      supabase
        .from('task_checklists')
        .select('*')
        .eq('task_id', taskId)
        .order('order_index', { ascending: true }),
    ]);

    if (subtasksRes.error) {
      toast({ title: 'Erro ao carregar subtarefas', variant: 'destructive' });
    } else {
      setSubtasks(subtasksRes.data as TaskSubtask[]);
    }

    if (checklistsRes.error) {
      toast({ title: 'Erro ao carregar checklists', variant: 'destructive' });
    } else {
      // Fetch items for each checklist
      const checklistsWithItems: TaskChecklist[] = [];
      for (const checklist of checklistsRes.data || []) {
        const { data: items } = await supabase
          .from('task_checklist_items')
          .select('*')
          .eq('checklist_id', checklist.id)
          .order('order_index', { ascending: true });
        
        checklistsWithItems.push({
          ...checklist,
          items: (items || []) as TaskChecklistItem[],
        } as TaskChecklist);
      }
      setChecklists(checklistsWithItems);
    }

    setLoading(false);
  }, [taskId, toast]);

  // Subtask operations
  const createSubtask = async (title: string) => {
    if (!taskId) return null;

    const { data, error } = await supabase
      .from('task_subtasks')
      .insert({
        task_id: taskId,
        title,
        order_index: subtasks.length,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Erro ao criar subtarefa', variant: 'destructive' });
      return null;
    }

    setSubtasks(prev => [...prev, data as TaskSubtask]);
    return data;
  };

  const updateSubtask = async (id: string, updates: Partial<TaskSubtask>) => {
    const { error } = await supabase
      .from('task_subtasks')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao atualizar subtarefa', variant: 'destructive' });
      return false;
    }

    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    return true;
  };

  const deleteSubtask = async (id: string) => {
    const { error } = await supabase
      .from('task_subtasks')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao excluir subtarefa', variant: 'destructive' });
      return false;
    }

    setSubtasks(prev => prev.filter(s => s.id !== id));
    return true;
  };

  const toggleSubtask = async (subtask: TaskSubtask) => {
    return updateSubtask(subtask.id, { completed: !subtask.completed });
  };

  // Checklist operations
  const createChecklist = async (name: string = 'Checklist') => {
    if (!taskId) return null;

    const { data, error } = await supabase
      .from('task_checklists')
      .insert({
        task_id: taskId,
        name,
        order_index: checklists.length,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Erro ao criar checklist', variant: 'destructive' });
      return null;
    }

    setChecklists(prev => [...prev, { ...data, items: [] } as TaskChecklist]);
    return data;
  };

  const updateChecklist = async (id: string, updates: Partial<TaskChecklist>) => {
    const { error } = await supabase
      .from('task_checklists')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao atualizar checklist', variant: 'destructive' });
      return false;
    }

    setChecklists(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    return true;
  };

  const deleteChecklist = async (id: string) => {
    const { error } = await supabase
      .from('task_checklists')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao excluir checklist', variant: 'destructive' });
      return false;
    }

    setChecklists(prev => prev.filter(c => c.id !== id));
    return true;
  };

  // Checklist item operations
  const createChecklistItem = async (checklistId: string, title: string) => {
    const checklist = checklists.find(c => c.id === checklistId);
    
    const { data, error } = await supabase
      .from('task_checklist_items')
      .insert({
        checklist_id: checklistId,
        title,
        order_index: checklist?.items?.length || 0,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Erro ao criar item', variant: 'destructive' });
      return null;
    }

    setChecklists(prev => prev.map(c => {
      if (c.id === checklistId) {
        return { ...c, items: [...(c.items || []), data as TaskChecklistItem] };
      }
      return c;
    }));
    return data;
  };

  const updateChecklistItem = async (id: string, updates: Partial<TaskChecklistItem>) => {
    const { error } = await supabase
      .from('task_checklist_items')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao atualizar item', variant: 'destructive' });
      return false;
    }

    setChecklists(prev => prev.map(c => ({
      ...c,
      items: c.items?.map(item => item.id === id ? { ...item, ...updates } : item),
    })));
    return true;
  };

  const deleteChecklistItem = async (id: string) => {
    const { error } = await supabase
      .from('task_checklist_items')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao excluir item', variant: 'destructive' });
      return false;
    }

    setChecklists(prev => prev.map(c => ({
      ...c,
      items: c.items?.filter(item => item.id !== id),
    })));
    return true;
  };

  const toggleChecklistItem = async (item: TaskChecklistItem) => {
    return updateChecklistItem(item.id, { completed: !item.completed });
  };

  // Computed values
  const subtasksCount = subtasks.length;
  const subtasksCompleted = subtasks.filter(s => s.completed).length;
  
  const checklistItemsCount = checklists.reduce(
    (acc, c) => acc + (c.items?.length || 0),
    0
  );
  const checklistItemsCompleted = checklists.reduce(
    (acc, c) => acc + (c.items?.filter(i => i.completed).length || 0),
    0
  );

  const totalItems = subtasksCount + checklistItemsCount;
  const totalCompleted = subtasksCompleted + checklistItemsCompleted;

  return {
    subtasks,
    checklists,
    loading,
    fetchDetails,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    toggleSubtask,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    createChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    toggleChecklistItem,
    subtasksCount,
    subtasksCompleted,
    checklistItemsCount,
    checklistItemsCompleted,
    totalItems,
    totalCompleted,
  };
}
