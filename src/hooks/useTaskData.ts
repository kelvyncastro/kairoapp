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

    if (tasksRes.error) {
      toast({ title: 'Erro ao carregar tarefas', variant: 'destructive' });
    } else {
      setTasks((tasksRes.data || []).map(t => ({
        ...t,
        labels: t.labels || [],
      })) as Task[]);
    }

    if (foldersRes.error) {
      toast({ title: 'Erro ao carregar pastas', variant: 'destructive' });
    } else {
      setFolders(foldersRes.data || []);
    }

    if (statusesRes.error) {
      toast({ title: 'Erro ao carregar status', variant: 'destructive' });
    } else {
      let statusData = statusesRes.data || [];
      
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
          statusData = newStatuses;
        }
      }
      
      setStatuses(statusData as TaskStatus[]);
    }

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

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const { error } = await supabase
      .from('daily_tasks')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao atualizar tarefa', variant: 'destructive' });
      return false;
    }

    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
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
    const completed = !task.completed;
    return updateTask(task.id, {
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    });
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
