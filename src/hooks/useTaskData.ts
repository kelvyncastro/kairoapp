import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Task, TaskFolder, TaskStatus, TaskLabel, DEFAULT_STATUSES } from '@/types/tasks';

export function useTaskData() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [folders, setFolders] = useState<TaskFolder[]>([]);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [labels, setLabels] = useState<TaskLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [tasksRes, foldersRes, statusesRes, labelsRes] = await Promise.all([
      supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true }),
      supabase
        .from('task_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('order', { ascending: true }),
      supabase
        .from('task_statuses')
        .select('*')
        .eq('user_id', user.id)
        .order('order', { ascending: true }),
      supabase
        .from('task_labels')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true }),
    ]);

    const normalizeStatusName = (name: string | null | undefined) => (name || '').trim().toLowerCase();

    // Prepare statuses (and auto-heal duplicates)
    let statusData = (statusesRes.data || []) as TaskStatus[];
    const statusRemap: Record<string, string> = {};

    if (statusesRes.error) {
      toast({ title: 'Erro ao carregar status', variant: 'destructive' });
    } else {
      // Create default statuses if none exist
      if (statusData.length === 0) {
        const defaultStatuses = DEFAULT_STATUSES.map((s, i) => ({
          user_id: user.id,
          name: s.name,
          color: s.color,
          order: s.order,
          is_default: i === 0,
        }));

        const { data: newStatuses, error } = await supabase
          .from('task_statuses')
          .insert(defaultStatuses)
          .select();

        if (!error && newStatuses) {
          statusData = newStatuses as TaskStatus[];
        }
      }

      // Dedupe statuses by name (auto-fix: remap tasks + delete duplicates)
      const groups = new Map<string, TaskStatus[]>();
      for (const s of statusData) {
        const key = normalizeStatusName(s.name);
        if (!key) continue;
        const arr = groups.get(key) || [];
        arr.push(s);
        groups.set(key, arr);
      }

      const duplicates = [...groups.values()].filter(arr => arr.length > 1);

      if (duplicates.length > 0) {
        // Choose a canonical status per name and remap the rest to it
        const pickCanonical = (arr: TaskStatus[]) => {
          return [...arr].sort((a, b) => {
            // Prefer default, then lowest order, then earliest created_at
            const defA = a.is_default ? 0 : 1;
            const defB = b.is_default ? 0 : 1;
            if (defA !== defB) return defA - defB;
            const orderA = a.order ?? 999;
            const orderB = b.order ?? 999;
            if (orderA !== orderB) return orderA - orderB;
            return (a.created_at || '').localeCompare(b.created_at || '');
          })[0];
        };

        for (const arr of duplicates) {
          const canonical = pickCanonical(arr);
          for (const dup of arr) {
            if (dup.id === canonical.id) continue;
            statusRemap[dup.id] = canonical.id;

            // Remap tasks in DB
            await supabase
              .from('daily_tasks')
              .update({ status_id: canonical.id })
              .eq('user_id', user.id)
              .eq('status_id', dup.id);

            // Delete duplicate status in DB
            await supabase
              .from('task_statuses')
              .delete()
              .eq('user_id', user.id)
              .eq('id', dup.id);
          }
        }

        // Keep only canonical statuses in-memory
        statusData = [...groups.values()].map(pickCanonical);
        statusData.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

        toast({ title: 'Status duplicados foram consolidados', description: 'Mantive apenas 1 por nome.' });
      }

      setStatuses(statusData as TaskStatus[]);
    }

    // Tasks
    if (tasksRes.error) {
      toast({ title: 'Erro ao carregar tarefas', variant: 'destructive' });
    } else {
      const remapped = (tasksRes.data || []).map(t => {
        const nextStatusId = t.status_id ? (statusRemap[t.status_id] || t.status_id) : t.status_id;
        return {
          ...t,
          status_id: nextStatusId,
          labels: t.labels || [],
        };
      });
      setTasks(remapped as Task[]);
    }

    if (foldersRes.error) {
      toast({ title: 'Erro ao carregar pastas', variant: 'destructive' });
    } else {
      setFolders(foldersRes.data || []);
    }

    // statuses handled above (including auto-dedupe)

    if (labelsRes.error) {
      toast({ title: 'Erro ao carregar etiquetas', variant: 'destructive' });
    } else {
      setLabels(labelsRes.data || []);
    }

    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Task operations
  const createTask = async (task: Partial<Task>) => {
    if (!user) return null;
    
    const insertData = {
      ...task,
      user_id: user.id,
      labels: task.labels || [],
      date: task.date || task.due_date || new Date().toISOString().split('T')[0],
      title: task.title || '',
    };
    
    const { data, error } = await supabase
      .from('daily_tasks')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      toast({ title: 'Erro ao criar tarefa', variant: 'destructive' });
      return null;
    }

    setTasks(prev => [...prev, { ...data, labels: data.labels || [] } as Task]);
    return data;
  };

  const updateTask = async (id: string, updates: Partial<Task>): Promise<boolean> => {
    // If status_id is being updated, sync the completed field
    let finalUpdates = { ...updates };
    
    if (updates.status_id !== undefined) {
      const newStatus = statuses.find(s => s.id === updates.status_id);
      const isCompletedStatus = newStatus?.name.toLowerCase().includes('conclu') ?? false;
      
      // Sync completed field with status
      finalUpdates.completed = isCompletedStatus;
      finalUpdates.completed_at = isCompletedStatus ? new Date().toISOString() : null;
    }

    const { error } = await supabase
      .from('daily_tasks')
      .update(finalUpdates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao atualizar tarefa', variant: 'destructive' });
      return false;
    }

    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...finalUpdates } : t));

    // Mark consistency day when task is marked as completed via status change
    if (finalUpdates.completed === true && user) {
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('consistency_days').upsert(
        { user_id: user.id, date: today, is_active: true, reason: 'task' },
        { onConflict: 'user_id,date' }
      );
    }

    return true;
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('daily_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao excluir tarefa', variant: 'destructive' });
      return false;
    }

    setTasks(prev => prev.filter(t => t.id !== id));
    return true;
  };

  const toggleTaskComplete = async (task: Task) => {
    try {
      const completed = !task.completed;
      const completedAt = completed ? new Date().toISOString() : null;
      
      // Find "Concluída" status to auto-assign when completing
      const completedStatus = statuses.find(s => 
        s.name.toLowerCase().trim() === 'concluída'
      );
      
      // Find first status (usually "Não iniciada") to assign when uncompleting
      const defaultStatus = statuses.find(s => s.is_default) || statuses[0];
      
      // Determine new status_id
      const newStatusId = completed 
        ? (completedStatus?.id || task.status_id) 
        : (task.status_id === completedStatus?.id ? defaultStatus?.id : task.status_id);
      
      // Optimistic update - update state immediately
      setTasks(prev => prev.map(t => 
        t.id === task.id 
          ? { ...t, completed, completed_at: completedAt, status_id: newStatusId || null } 
          : t
      ));
      
      // Then sync with database
      const { error } = await supabase
        .from('daily_tasks')
        .update({ 
          completed, 
          completed_at: completedAt,
          status_id: newStatusId 
        })
        .eq('id', task.id);

      if (error) {
        // Revert on error
        setTasks(prev => prev.map(t => 
          t.id === task.id 
            ? { ...t, completed: task.completed, completed_at: task.completed_at, status_id: task.status_id } 
            : t
        ));
        toast({ title: 'Erro ao atualizar tarefa', variant: 'destructive' });
        return false;
      }

      // Mark consistency day when completing a task
      if (completed && user) {
        const today = new Date().toISOString().split('T')[0];
        await supabase.from('consistency_days').upsert(
          { user_id: user.id, date: today, is_active: true, reason: 'task' },
          { onConflict: 'user_id,date' }
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error toggling task complete:', error);
      toast({ title: 'Erro ao atualizar tarefa', variant: 'destructive' });
      return false;
    }
  };

  // Folder operations
  const createFolder = async (folder: Partial<TaskFolder>) => {
    if (!user) return null;

    const insertData = {
      user_id: user.id,
      name: folder.name || 'Nova pasta',
      color: folder.color || '#6366f1',
      icon: folder.icon || 'folder',
      order: folders.length,
    };

    const { data, error } = await supabase
      .from('task_folders')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      toast({ title: 'Erro ao criar pasta', variant: 'destructive' });
      return null;
    }

    setFolders(prev => [...prev, data as TaskFolder]);
    return data;
  };

  const updateFolder = async (id: string, updates: Partial<TaskFolder>) => {
    const { error } = await supabase
      .from('task_folders')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao atualizar pasta', variant: 'destructive' });
      return false;
    }

    setFolders(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    return true;
  };

  const deleteFolder = async (id: string) => {
    const { error } = await supabase
      .from('task_folders')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao excluir pasta', variant: 'destructive' });
      return false;
    }

    setFolders(prev => prev.filter(f => f.id !== id));
    // Clear folder_id from tasks in this folder
    setTasks(prev => prev.map(t => t.folder_id === id ? { ...t, folder_id: null } : t));
    return true;
  };

  // Status operations
  const createStatus = async (status: Partial<TaskStatus>) => {
    if (!user) return null;

    const insertData = {
      user_id: user.id,
      name: status.name || 'Novo status',
      color: status.color || '#6366f1',
      order: statuses.length,
      is_default: status.is_default || false,
    };

    const { data, error } = await supabase
      .from('task_statuses')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      toast({ title: 'Erro ao criar status', variant: 'destructive' });
      return null;
    }

    setStatuses(prev => [...prev, data as TaskStatus]);
    return data;
  };

  const updateStatus = async (id: string, updates: Partial<TaskStatus>) => {
    const { error } = await supabase
      .from('task_statuses')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
      return false;
    }

    setStatuses(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    return true;
  };

  const deleteStatus = async (id: string) => {
    const { error } = await supabase
      .from('task_statuses')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao excluir status', variant: 'destructive' });
      return false;
    }

    setStatuses(prev => prev.filter(s => s.id !== id));
    return true;
  };

  // Get filtered tasks
  const getFilteredTasks = useCallback((folderId: string | null) => {
    if (folderId === null) return tasks;
    return tasks.filter(t => t.folder_id === folderId);
  }, [tasks]);

  return {
    tasks,
    folders,
    statuses,
    labels,
    loading,
    selectedFolderId,
    setSelectedFolderId,
    fetchData,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    createFolder,
    updateFolder,
    deleteFolder,
    createStatus,
    updateStatus,
    deleteStatus,
    getFilteredTasks,
  };
}
