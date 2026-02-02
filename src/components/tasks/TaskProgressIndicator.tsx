import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ListChecks, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskProgressIndicatorProps {
  taskId: string;
  refreshKey?: number;
  className?: string;
  isCompleted?: boolean; // Whether the task status is "Concluída"
}

export function TaskProgressIndicator({ taskId, refreshKey, className, isCompleted }: TaskProgressIndicatorProps) {
  const [total, setTotal] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      // Fetch subtasks count
      const { data: subtasks } = await supabase
        .from('task_subtasks')
        .select('completed')
        .eq('task_id', taskId);

      // Fetch checklists with items
      const { data: checklists } = await supabase
        .from('task_checklists')
        .select('id')
        .eq('task_id', taskId);

      let checklistItems: { completed: boolean }[] = [];
      if (checklists && checklists.length > 0) {
        const checklistIds = checklists.map(c => c.id);
        const { data: items } = await supabase
          .from('task_checklist_items')
          .select('completed')
          .in('checklist_id', checklistIds);
        checklistItems = items || [];
      }

      const allItems = [...(subtasks || []), ...checklistItems];
      const totalCount = allItems.length;
      const completedCount = allItems.filter(i => i.completed).length;

      setTotal(totalCount);
      setCompleted(completedCount);
      setLoading(false);
    };

    fetchCounts();
  }, [taskId, refreshKey]);

  // When task is completed and has no items, show a single check
  if (isCompleted && total === 0 && !loading) {
    return (
      <div
        className={cn(
          "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded",
          "bg-primary/15 text-primary",
          className
        )}
      >
        <Check className="h-3 w-3" />
      </div>
    );
  }

  if (loading || total === 0) return null;

  const isAllCompleted = completed === total;

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded",
        isAllCompleted 
          ? "bg-primary/15 text-primary" 
          : "bg-muted/50 text-muted-foreground",
        className
      )}
    >
      <ListChecks className="h-3 w-3" />
      <span>{completed}/{total}</span>
    </div>
  );
}
