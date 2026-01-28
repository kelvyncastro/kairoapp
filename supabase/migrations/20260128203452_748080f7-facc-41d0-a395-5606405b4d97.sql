-- Create task_folders table for organizing tasks
CREATE TABLE public.task_folders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#6366f1',
    icon text DEFAULT 'folder',
    "order" integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create task_statuses table for customizable statuses
CREATE TABLE public.task_statuses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#6366f1',
    "order" integer DEFAULT 0,
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Create task_labels table for tags
CREATE TABLE public.task_labels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#6366f1',
    created_at timestamptz DEFAULT now()
);

-- Add new columns to daily_tasks
ALTER TABLE public.daily_tasks
ADD COLUMN folder_id uuid REFERENCES public.task_folders(id) ON DELETE SET NULL,
ADD COLUMN status_id uuid REFERENCES public.task_statuses(id) ON DELETE SET NULL,
ADD COLUMN start_date date,
ADD COLUMN due_date date,
ADD COLUMN time_estimate_minutes integer,
ADD COLUMN labels text[] DEFAULT '{}';

-- Enable RLS on new tables
ALTER TABLE public.task_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_folders
CREATE POLICY "Users can view own folders" ON public.task_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own folders" ON public.task_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON public.task_folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON public.task_folders FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for task_statuses
CREATE POLICY "Users can view own statuses" ON public.task_statuses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own statuses" ON public.task_statuses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own statuses" ON public.task_statuses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own statuses" ON public.task_statuses FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for task_labels
CREATE POLICY "Users can view own labels" ON public.task_labels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own labels" ON public.task_labels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own labels" ON public.task_labels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own labels" ON public.task_labels FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at on task_folders
CREATE TRIGGER update_task_folders_updated_at
BEFORE UPDATE ON public.task_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();