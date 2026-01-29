-- Create table for task subtasks
CREATE TABLE public.task_subtasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.daily_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for task checklists
CREATE TABLE public.task_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.daily_tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Checklist',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for checklist items
CREATE TABLE public.task_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.task_checklists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_subtasks (access through task ownership)
CREATE POLICY "Users can view own subtasks" ON public.task_subtasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.daily_tasks t WHERE t.id = task_subtasks.task_id AND t.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own subtasks" ON public.task_subtasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.daily_tasks t WHERE t.id = task_subtasks.task_id AND t.user_id = auth.uid())
  );

CREATE POLICY "Users can update own subtasks" ON public.task_subtasks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.daily_tasks t WHERE t.id = task_subtasks.task_id AND t.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own subtasks" ON public.task_subtasks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.daily_tasks t WHERE t.id = task_subtasks.task_id AND t.user_id = auth.uid())
  );

-- RLS policies for task_checklists
CREATE POLICY "Users can view own checklists" ON public.task_checklists
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.daily_tasks t WHERE t.id = task_checklists.task_id AND t.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own checklists" ON public.task_checklists
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.daily_tasks t WHERE t.id = task_checklists.task_id AND t.user_id = auth.uid())
  );

CREATE POLICY "Users can update own checklists" ON public.task_checklists
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.daily_tasks t WHERE t.id = task_checklists.task_id AND t.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own checklists" ON public.task_checklists
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.daily_tasks t WHERE t.id = task_checklists.task_id AND t.user_id = auth.uid())
  );

-- RLS policies for task_checklist_items (through checklist -> task ownership)
CREATE POLICY "Users can view own checklist items" ON public.task_checklist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.task_checklists c 
      JOIN public.daily_tasks t ON t.id = c.task_id 
      WHERE c.id = task_checklist_items.checklist_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own checklist items" ON public.task_checklist_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.task_checklists c 
      JOIN public.daily_tasks t ON t.id = c.task_id 
      WHERE c.id = task_checklist_items.checklist_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own checklist items" ON public.task_checklist_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.task_checklists c 
      JOIN public.daily_tasks t ON t.id = c.task_id 
      WHERE c.id = task_checklist_items.checklist_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own checklist items" ON public.task_checklist_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.task_checklists c 
      JOIN public.daily_tasks t ON t.id = c.task_id 
      WHERE c.id = task_checklist_items.checklist_id AND t.user_id = auth.uid()
    )
  );

-- Trigger for updated_at on subtasks
CREATE TRIGGER update_task_subtasks_updated_at
  BEFORE UPDATE ON public.task_subtasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();