-- ============================================
-- KAIRO APP - ESTRUTURA COMPLETA DO BANCO
-- Script de migração para Supabase externo
-- ============================================

-- ============================================
-- 1. CRIAR ENUMS
-- ============================================

CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.calendar_block_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'postponed');
CREATE TYPE public.calendar_demand_type AS ENUM ('fixed', 'flexible', 'micro');
CREATE TYPE public.calendar_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.calendar_recurrence_type AS ENUM ('none', 'daily', 'weekly', 'monthly', 'custom');
CREATE TYPE public.food_source AS ENUM ('PHOTO', 'TEXT', 'MANUAL');
CREATE TYPE public.goal_status AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED');
CREATE TYPE public.goal_type AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');
CREATE TYPE public.habit_log_status AS ENUM ('done', 'not_done', 'skipped');
CREATE TYPE public.workout_technique AS ENUM ('NONE', 'DROP_SET', 'REST_PAUSE', 'SUPERSET', 'TEMPO', 'AMRAP', 'CLUSTER', 'MTOR');

-- ============================================
-- 2. CRIAR TABELAS
-- ============================================

-- Tabela: user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Tabela: user_profiles
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  birth_date DATE,
  avatar_url TEXT,
  app_theme TEXT NOT NULL DEFAULT 'dark',
  public_id TEXT UNIQUE,
  subscription_status TEXT NOT NULL DEFAULT 'inactive',
  phone_number TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: user_settings
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  calories_target INTEGER DEFAULT 2000,
  protein_target INTEGER DEFAULT 150,
  carbs_target INTEGER DEFAULT 250,
  fat_target INTEGER DEFAULT 70,
  fiber_target INTEGER DEFAULT 30,
  rest_timer_default_seconds INTEGER DEFAULT 90,
  daily_reset_time TIME WITHOUT TIME ZONE DEFAULT '00:00:00',
  week_starts_on INTEGER DEFAULT 1,
  streak_rule TEXT DEFAULT 'complete_task_or_workout_or_diet',
  units TEXT DEFAULT 'kg',
  theme TEXT DEFAULT 'cave',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: task_folders
CREATE TABLE public.task_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#6366f1',
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: task_statuses
CREATE TABLE public.task_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  "order" INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: task_labels
CREATE TABLE public.task_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: daily_tasks
CREATE TABLE public.daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  folder_id UUID,
  status_id UUID,
  priority INTEGER DEFAULT 2,
  labels TEXT[] DEFAULT '{}'::TEXT[],
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  due_date DATE,
  start_date DATE,
  time_estimate_minutes INTEGER,
  time_spent_seconds INTEGER DEFAULT 0,
  timer_started_at TIMESTAMP WITH TIME ZONE,
  is_recurring BOOLEAN DEFAULT false,
  recurring_rule TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (folder_id) REFERENCES public.task_folders(id),
  FOREIGN KEY (status_id) REFERENCES public.task_statuses(id)
);

-- Tabela: task_subtasks
CREATE TABLE public.task_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (task_id) REFERENCES public.daily_tasks(id) ON DELETE CASCADE
);

-- Tabela: task_checklists
CREATE TABLE public.task_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Checklist',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (task_id) REFERENCES public.daily_tasks(id) ON DELETE CASCADE
);

-- Tabela: task_checklist_items
CREATE TABLE public.task_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (checklist_id) REFERENCES public.task_checklists(id) ON DELETE CASCADE
);

-- Tabela: calendar_blocks
CREATE TABLE public.calendar_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  color TEXT DEFAULT '#6366f1',
  status public.calendar_block_status NOT NULL DEFAULT 'pending',
  priority public.calendar_priority NOT NULL DEFAULT 'medium',
  demand_type public.calendar_demand_type NOT NULL DEFAULT 'fixed',
  recurrence_type public.calendar_recurrence_type NOT NULL DEFAULT 'none',
  recurrence_rule JSONB,
  recurrence_parent_id UUID,
  recurrence_end_date DATE,
  is_recurrence_paused BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (recurrence_parent_id) REFERENCES public.calendar_blocks(id)
);

-- Tabela: calendar_daily_stats
CREATE TABLE public.calendar_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  planned_blocks INTEGER DEFAULT 0,
  completed_blocks INTEGER DEFAULT 0,
  cancelled_blocks INTEGER DEFAULT 0,
  postponed_blocks INTEGER DEFAULT 0,
  planned_time_minutes INTEGER DEFAULT 0,
  actual_time_minutes INTEGER DEFAULT 0,
  execution_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: habits
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  frequency JSONB NOT NULL DEFAULT '["mon", "tue", "wed", "thu", "fri", "sat", "sun"]',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: habit_logs
CREATE TABLE public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL,
  date DATE NOT NULL,
  status public.habit_log_status NOT NULL DEFAULT 'not_done',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (habit_id) REFERENCES public.habits(id) ON DELETE CASCADE
);

-- Tabela: consistency_days
CREATE TABLE public.consistency_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  reason TEXT,
  streak_snapshot INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: goal_categories
CREATE TABLE public.goal_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'target',
  is_default BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: goals
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type public.goal_type NOT NULL,
  status public.goal_status DEFAULT 'ACTIVE',
  category TEXT DEFAULT 'PERSONAL',
  category_id UUID,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_value NUMERIC NOT NULL DEFAULT 1,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit_label TEXT DEFAULT 'vezes',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (category_id) REFERENCES public.goal_categories(id)
);

-- Tabela: goal_progress_history
CREATE TABLE public.goal_progress_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL,
  value NUMERIC NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE CASCADE
);

-- Tabela: finance_sectors
CREATE TABLE public.finance_sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'wallet',
  color_label TEXT DEFAULT '#404040',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: finance_transactions
CREATE TABLE public.finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  value NUMERIC NOT NULL,
  date DATE NOT NULL,
  sector_id UUID,
  status TEXT DEFAULT 'paid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (sector_id) REFERENCES public.finance_sectors(id)
);

-- Tabela: nutrition_days
CREATE TABLE public.nutrition_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  calories_total NUMERIC DEFAULT 0,
  protein_total NUMERIC DEFAULT 0,
  carbs_total NUMERIC DEFAULT 0,
  fat_total NUMERIC DEFAULT 0,
  fiber_total NUMERIC DEFAULT 0,
  target_calories INTEGER,
  target_protein INTEGER,
  target_carbs INTEGER,
  target_fat INTEGER,
  target_fiber INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: meals
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nutrition_day_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (nutrition_day_id) REFERENCES public.nutrition_days(id)
);

-- Tabela: food_items
CREATE TABLE public.food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL,
  name TEXT NOT NULL,
  quantity_text TEXT,
  calories NUMERIC DEFAULT 0,
  protein NUMERIC DEFAULT 0,
  carbs NUMERIC DEFAULT 0,
  fat NUMERIC DEFAULT 0,
  fiber NUMERIC DEFAULT 0,
  source public.food_source DEFAULT 'MANUAL',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (meal_id) REFERENCES public.meals(id)
);

-- Tabela: exercises
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  muscle_group TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: workout_plans
CREATE TABLE public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: workout_sessions
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID,
  datetime_start TIMESTAMP WITH TIME ZONE NOT NULL,
  datetime_end TIMESTAMP WITH TIME ZONE,
  total_volume NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (plan_id) REFERENCES public.workout_plans(id)
);

-- Tabela: workout_exercise_entries
CREATE TABLE public.workout_exercise_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  exercise_id UUID NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (session_id) REFERENCES public.workout_sessions(id),
  FOREIGN KEY (exercise_id) REFERENCES public.exercises(id)
);

-- Tabela: workout_sets
CREATE TABLE public.workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_entry_id UUID NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_kg NUMERIC NOT NULL,
  rpe INTEGER,
  rest_seconds_used INTEGER,
  technique public.workout_technique,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (exercise_entry_id) REFERENCES public.workout_exercise_entries(id)
);

-- Tabela: rankings
CREATE TABLE public.rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  max_participants INTEGER NOT NULL DEFAULT 10,
  bet_description TEXT,
  bet_amount TEXT,
  deletion_requested BOOLEAN DEFAULT false,
  deletion_requested_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: ranking_participants
CREATE TABLE public.ranking_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_points NUMERIC NOT NULL DEFAULT 0,
  accepted_bet BOOLEAN DEFAULT false,
  deletion_consent BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (ranking_id) REFERENCES public.rankings(id)
);

-- Tabela: ranking_goals
CREATE TABLE public.ranking_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (ranking_id) REFERENCES public.rankings(id)
);

-- Tabela: ranking_goal_logs
CREATE TABLE public.ranking_goal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_id UUID NOT NULL,
  goal_id UUID NOT NULL,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  points_earned NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (ranking_id) REFERENCES public.rankings(id),
  FOREIGN KEY (goal_id) REFERENCES public.ranking_goals(id)
);

-- Tabela: notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: saved_filters
CREATE TABLE public.saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: ebook_content
CREATE TABLE public.ebook_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  section_key TEXT NOT NULL,
  title TEXT NOT NULL,
  content_markdown TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 3. ATIVAR ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consistency_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_progress_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercise_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_goal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_content ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CRIAR FUNÇÕES SECURITY DEFINER
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_public_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_public_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  new_id TEXT;
BEGIN
  IF NEW.public_id IS NULL THEN
    LOOP
      new_id := generate_public_id();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM user_profiles WHERE public_id = new_id);
    END LOOP;
    NEW.public_id := new_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.is_ranking_creator(_user_id uuid, _ranking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM rankings WHERE id = _ranking_id AND creator_id = _user_id
  )
$function$;

CREATE OR REPLACE FUNCTION public.is_ranking_participant(_user_id uuid, _ranking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.ranking_participants
    WHERE ranking_id = _ranking_id
      AND user_id = _user_id
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_public_user_profiles()
RETURNS TABLE(id uuid, user_id uuid, first_name text, avatar_url text, public_id text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT 
    up.id,
    up.user_id,
    up.first_name,
    up.avatar_url,
    up.public_id
  FROM public.user_profiles up
  WHERE up.public_id IS NOT NULL
    AND auth.uid() IS NOT NULL
$function$;

CREATE OR REPLACE FUNCTION public.create_default_finance_sectors(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM finance_sectors WHERE user_id = p_user_id) THEN
    INSERT INTO finance_sectors (user_id, name, color_label, icon) VALUES
      (p_user_id, 'Mercado', '#22c55e', 'shopping-bag'),
      (p_user_id, 'Transporte', '#3b82f6', 'car'),
      (p_user_id, 'Cartão', '#8b5cf6', 'credit-card'),
      (p_user_id, 'Lazer e Entretenimento', '#f97316', 'gamepad'),
      (p_user_id, 'Investimentos', '#eab308', 'chart-line'),
      (p_user_id, 'Vestuário', '#ec4899', 'shopping-bag'),
      (p_user_id, 'Educação', '#06b6d4', 'graduation-cap'),
      (p_user_id, 'Alimentação', '#ef4444', 'utensils');
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user_finance_sectors()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  PERFORM create_default_finance_sectors(NEW.id);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_admin_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.email = 'arthurgabrielalberti123@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- ============================================
-- 5. CRIAR RLS POLICIES
-- ============================================

-- user_roles policies
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR (auth.uid() = user_id));

-- user_profiles policies
CREATE POLICY "Users can insert their own profile"
ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own profile"
ON public.user_profiles FOR SELECT USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own or admins can update all"
ON public.user_profiles FOR UPDATE USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete their own profile"
ON public.user_profiles FOR DELETE USING (auth.uid() = user_id);

-- user_settings policies
CREATE POLICY "Users can insert own settings"
ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own settings"
ON public.user_settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

-- task_folders policies
CREATE POLICY "Users can insert own folders"
ON public.task_folders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own folders"
ON public.task_folders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
ON public.task_folders FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
ON public.task_folders FOR DELETE USING (auth.uid() = user_id);

-- task_statuses policies
CREATE POLICY "Users can insert own statuses"
ON public.task_statuses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own statuses"
ON public.task_statuses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own statuses"
ON public.task_statuses FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own statuses"
ON public.task_statuses FOR DELETE USING (auth.uid() = user_id);

-- task_labels policies
CREATE POLICY "Users can insert own labels"
ON public.task_labels FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own labels"
ON public.task_labels FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own labels"
ON public.task_labels FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own labels"
ON public.task_labels FOR DELETE USING (auth.uid() = user_id);

-- daily_tasks policies
CREATE POLICY "Users can insert own tasks"
ON public.daily_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own tasks"
ON public.daily_tasks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
ON public.daily_tasks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
ON public.daily_tasks FOR DELETE USING (auth.uid() = user_id);

-- task_subtasks policies
CREATE POLICY "Users can insert own subtasks"
ON public.task_subtasks FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM daily_tasks t WHERE t.id = task_subtasks.task_id AND t.user_id = auth.uid()
));

CREATE POLICY "Users can view own subtasks"
ON public.task_subtasks FOR SELECT USING (EXISTS (
  SELECT 1 FROM daily_tasks t WHERE t.id = task_subtasks.task_id AND t.user_id = auth.uid()
));

CREATE POLICY "Users can update own subtasks"
ON public.task_subtasks FOR UPDATE USING (EXISTS (
  SELECT 1 FROM daily_tasks t WHERE t.id = task_subtasks.task_id AND t.user_id = auth.uid()
));

CREATE POLICY "Users can delete own subtasks"
ON public.task_subtasks FOR DELETE USING (EXISTS (
  SELECT 1 FROM daily_tasks t WHERE t.id = task_subtasks.task_id AND t.user_id = auth.uid()
));

-- task_checklists policies
CREATE POLICY "Users can insert own checklists"
ON public.task_checklists FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM daily_tasks t WHERE t.id = task_checklists.task_id AND t.user_id = auth.uid()
));

CREATE POLICY "Users can view own checklists"
ON public.task_checklists FOR SELECT USING (EXISTS (
  SELECT 1 FROM daily_tasks t WHERE t.id = task_checklists.task_id AND t.user_id = auth.uid()
));

CREATE POLICY "Users can update own checklists"
ON public.task_checklists FOR UPDATE USING (EXISTS (
  SELECT 1 FROM daily_tasks t WHERE t.id = task_checklists.task_id AND t.user_id = auth.uid()
));

CREATE POLICY "Users can delete own checklists"
ON public.task_checklists FOR DELETE USING (EXISTS (
  SELECT 1 FROM daily_tasks t WHERE t.id = task_checklists.task_id AND t.user_id = auth.uid()
));

-- task_checklist_items policies
CREATE POLICY "Users can insert own checklist items"
ON public.task_checklist_items FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM (task_checklists c JOIN daily_tasks t ON (t.id = c.task_id))
  WHERE c.id = task_checklist_items.checklist_id AND t.user_id = auth.uid()
));

CREATE POLICY "Users can view own checklist items"
ON public.task_checklist_items FOR SELECT USING (EXISTS (
  SELECT 1 FROM (task_checklists c JOIN daily_tasks t ON (t.id = c.task_id))
  WHERE c.id = task_checklist_items.checklist_id AND t.user_id = auth.uid()
));

CREATE POLICY "Users can update own checklist items"
ON public.task_checklist_items FOR UPDATE USING (EXISTS (
  SELECT 1 FROM (task_checklists c JOIN daily_tasks t ON (t.id = c.task_id))
  WHERE c.id = task_checklist_items.checklist_id AND t.user_id = auth.uid()
));

CREATE POLICY "Users can delete own checklist items"
ON public.task_checklist_items FOR DELETE USING (EXISTS (
  SELECT 1 FROM (task_checklists c JOIN daily_tasks t ON (t.id = c.task_id))
  WHERE c.id = task_checklist_items.checklist_id AND t.user_id = auth.uid()
));

-- calendar_blocks policies
CREATE POLICY "Users can create own calendar blocks"
ON public.calendar_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own calendar blocks"
ON public.calendar_blocks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar blocks"
ON public.calendar_blocks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar blocks"
ON public.calendar_blocks FOR DELETE USING (auth.uid() = user_id);

-- calendar_daily_stats policies
CREATE POLICY "Users can create own daily stats"
ON public.calendar_daily_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own daily stats"
ON public.calendar_daily_stats FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own daily stats"
ON public.calendar_daily_stats FOR UPDATE USING (auth.uid() = user_id);

-- habits policies
CREATE POLICY "Users can create own habits"
ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own habits"
ON public.habits FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
ON public.habits FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
ON public.habits FOR DELETE USING (auth.uid() = user_id);

-- habit_logs policies
CREATE POLICY "Users can create own habit logs"
ON public.habit_logs FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM habits h WHERE h.id = habit_logs.habit_id AND h.user_id = auth.uid()
));

CREATE POLICY "Users can view own habit logs"
ON public.habit_logs FOR SELECT USING (EXISTS (
  SELECT 1 FROM habits h WHERE h.id = habit_logs.habit_id AND h.user_id = auth.uid()
));

CREATE POLICY "Users can update own habit logs"
ON public.habit_logs FOR UPDATE USING (EXISTS (
  SELECT 1 FROM habits h WHERE h.id = habit_logs.habit_id AND h.user_id = auth.uid()
));

CREATE POLICY "Users can delete own habit logs"
ON public.habit_logs FOR DELETE USING (EXISTS (
  SELECT 1 FROM habits h WHERE h.id = habit_logs.habit_id AND h.user_id = auth.uid()
));

-- consistency_days policies
CREATE POLICY "Users can insert own consistency"
ON public.consistency_days FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own consistency"
ON public.consistency_days FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own consistency"
ON public.consistency_days FOR UPDATE USING (auth.uid() = user_id);

-- goal_categories policies
CREATE POLICY "Users can insert own categories"
ON public.goal_categories FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own categories"
ON public.goal_categories FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
ON public.goal_categories FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
ON public.goal_categories FOR DELETE USING (auth.uid() = user_id);

-- goals policies
CREATE POLICY "Users can insert own goals"
ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own goals"
ON public.goals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
ON public.goals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- goal_progress_history policies
CREATE POLICY "Users can insert own goal progress"
ON public.goal_progress_history FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM goals g WHERE g.id = goal_progress_history.goal_id AND g.user_id = auth.uid()
));

CREATE POLICY "Users can view own goal progress"
ON public.goal_progress_history FOR SELECT USING (EXISTS (
  SELECT 1 FROM goals g WHERE g.id = goal_progress_history.goal_id AND g.user_id = auth.uid()
));

CREATE POLICY "Users can update own goal progress"
ON public.goal_progress_history FOR UPDATE USING (EXISTS (
  SELECT 1 FROM goals g WHERE g.id = goal_progress_history.goal_id AND g.user_id = auth.uid()
));

CREATE POLICY "Users can delete own goal progress"
ON public.goal_progress_history FOR DELETE USING (EXISTS (
  SELECT 1 FROM goals g WHERE g.id = goal_progress_history.goal_id AND g.user_id = auth.uid()
));

-- finance_sectors policies
CREATE POLICY "Users can insert own sectors"
ON public.finance_sectors FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own sectors"
ON public.finance_sectors FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sectors"
ON public.finance_sectors FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sectors"
ON public.finance_sectors FOR DELETE USING (auth.uid() = user_id);

-- finance_transactions policies
CREATE POLICY "Users can insert own transactions"
ON public.finance_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions"
ON public.finance_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
ON public.finance_transactions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
ON public.finance_transactions FOR DELETE USING (auth.uid() = user_id);

-- nutrition_days policies
CREATE POLICY "Users can insert own nutrition"
ON public.nutrition_days FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own nutrition"
ON public.nutrition_days FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition"
ON public.nutrition_days FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own nutrition"
ON public.nutrition_days FOR DELETE USING (auth.uid() = user_id);

-- meals policies
CREATE POLICY "Users can insert own meals"
ON public.meals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own meals"
ON public.meals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own meals"
ON public.meals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals"
ON public.meals FOR DELETE USING (auth.uid() = user_id);

-- food_items policies
CREATE POLICY "Users can insert own food"
ON public.food_items FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM meals m WHERE m.id = food_items.meal_id AND m.user_id = auth.uid()
));

CREATE POLICY "Users can view own food"
ON public.food_items FOR SELECT USING (EXISTS (
  SELECT 1 FROM meals m WHERE m.id = food_items.meal_id AND m.user_id = auth.uid()
));

CREATE POLICY "Users can update own food"
ON public.food_items FOR UPDATE USING (EXISTS (
  SELECT 1 FROM meals m WHERE m.id = food_items.meal_id AND m.user_id = auth.uid()
));

CREATE POLICY "Users can delete own food"
ON public.food_items FOR DELETE USING (EXISTS (
  SELECT 1 FROM meals m WHERE m.id = food_items.meal_id AND m.user_id = auth.uid()
));

-- exercises policies
CREATE POLICY "Users can insert own exercises"
ON public.exercises FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own exercises"
ON public.exercises FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own exercises"
ON public.exercises FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercises"
ON public.exercises FOR DELETE USING (auth.uid() = user_id);

-- workout_plans policies
CREATE POLICY "Users can insert own plans"
ON public.workout_plans FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own plans"
ON public.workout_plans FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
ON public.workout_plans FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans"
ON public.workout_plans FOR DELETE USING (auth.uid() = user_id);

-- workout_sessions policies
CREATE POLICY "Users can insert own sessions"
ON public.workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions"
ON public.workout_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
ON public.workout_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
ON public.workout_sessions FOR DELETE USING (auth.uid() = user_id);

-- workout_exercise_entries policies
CREATE POLICY "Users can insert own entries"
ON public.workout_exercise_entries FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM workout_sessions ws WHERE ws.id = workout_exercise_entries.session_id AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can view own entries"
ON public.workout_exercise_entries FOR SELECT USING (EXISTS (
  SELECT 1 FROM workout_sessions ws WHERE ws.id = workout_exercise_entries.session_id AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can update own entries"
ON public.workout_exercise_entries FOR UPDATE USING (EXISTS (
  SELECT 1 FROM workout_sessions ws WHERE ws.id = workout_exercise_entries.session_id AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can delete own entries"
ON public.workout_exercise_entries FOR DELETE USING (EXISTS (
  SELECT 1 FROM workout_sessions ws WHERE ws.id = workout_exercise_entries.session_id AND ws.user_id = auth.uid()
));

-- workout_sets policies
CREATE POLICY "Users can insert own sets"
ON public.workout_sets FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM (workout_exercise_entries wee JOIN workout_sessions ws ON (ws.id = wee.session_id))
  WHERE wee.id = workout_sets.exercise_entry_id AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can view own sets"
ON public.workout_sets FOR SELECT USING (EXISTS (
  SELECT 1 FROM (workout_exercise_entries wee JOIN workout_sessions ws ON (ws.id = wee.session_id))
  WHERE wee.id = workout_sets.exercise_entry_id AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can update own sets"
ON public.workout_sets FOR UPDATE USING (EXISTS (
  SELECT 1 FROM (workout_exercise_entries wee JOIN workout_sessions ws ON (ws.id = wee.session_id))
  WHERE wee.id = workout_sets.exercise_entry_id AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can delete own sets"
ON public.workout_sets FOR DELETE USING (EXISTS (
  SELECT 1 FROM (workout_exercise_entries wee JOIN workout_sessions ws ON (ws.id = wee.session_id))
  WHERE wee.id = workout_sets.exercise_entry_id AND ws.user_id = auth.uid()
));

-- rankings policies
CREATE POLICY "Users can create rankings"
ON public.rankings FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can view rankings they participate in or created"
ON public.rankings FOR SELECT USING (
  (creator_id = auth.uid()) OR (EXISTS (
    SELECT 1 FROM ranking_participants
    WHERE ranking_participants.ranking_id = rankings.id AND ranking_participants.user_id = auth.uid()
  ))
);

CREATE POLICY "Creators can update their rankings"
ON public.rankings FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their rankings"
ON public.rankings FOR DELETE USING (auth.uid() = creator_id);

-- ranking_participants policies
CREATE POLICY "Creators can invite participants"
ON public.ranking_participants FOR INSERT WITH CHECK (is_ranking_creator(auth.uid(), ranking_id));

CREATE POLICY "Users can view participants of their rankings"
ON public.ranking_participants FOR SELECT USING (
  is_ranking_participant(auth.uid(), ranking_id) OR is_ranking_creator(auth.uid(), ranking_id) OR (user_id = auth.uid())
);

CREATE POLICY "Users can update their own participation"
ON public.ranking_participants FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Creators can remove participants"
ON public.ranking_participants FOR DELETE USING (is_ranking_creator(auth.uid(), ranking_id) OR (user_id = auth.uid()));

-- ranking_goals policies
CREATE POLICY "Participants can view goals"
ON public.ranking_goals FOR SELECT USING (
  is_ranking_participant(auth.uid(), ranking_id) OR is_ranking_creator(auth.uid(), ranking_id)
);

CREATE POLICY "Creators can create goals"
ON public.ranking_goals FOR INSERT WITH CHECK (is_ranking_creator(auth.uid(), ranking_id));

CREATE POLICY "Creators can update goals"
ON public.ranking_goals FOR UPDATE USING (is_ranking_creator(auth.uid(), ranking_id));

CREATE POLICY "Creators can delete goals"
ON public.ranking_goals FOR DELETE USING (is_ranking_creator(auth.uid(), ranking_id));

-- ranking_goal_logs policies
CREATE POLICY "Users can log their own goals"
ON public.ranking_goal_logs FOR INSERT WITH CHECK (
  (user_id = auth.uid()) AND is_ranking_participant(auth.uid(), ranking_id)
);

CREATE POLICY "Users can view logs of their rankings"
ON public.ranking_goal_logs FOR SELECT USING (
  is_ranking_participant(auth.uid(), ranking_id) OR is_ranking_creator(auth.uid(), ranking_id)
);

CREATE POLICY "Users can update their own logs"
ON public.ranking_goal_logs FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own logs"
ON public.ranking_goal_logs FOR DELETE USING (user_id = auth.uid());

-- notifications policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users and ranking creators can create notifications"
ON public.notifications FOR INSERT WITH CHECK (
  (auth.uid() = user_id) OR (
    (type = ANY (ARRAY['ranking_invite'::text, 'ranking_update'::text, 'ranking_started'::text, 'ranking_ended'::text])) AND
    (data ? 'ranking_id'::text) AND
    is_ranking_creator(auth.uid(), ((data ->> 'ranking_id'::text))::uuid)
  )
);

-- saved_filters policies
CREATE POLICY "Users can view their own saved filters"
ON public.saved_filters FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved filters"
ON public.saved_filters FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved filters"
ON public.saved_filters FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved filters"
ON public.saved_filters FOR DELETE USING (auth.uid() = user_id);

-- ebook_content policies
CREATE POLICY "Users can view own ebook content"
ON public.ebook_content FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ebook content"
ON public.ebook_content FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ebook content"
ON public.ebook_content FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 6. CRIAR TRIGGERS
-- ============================================

CREATE TRIGGER set_user_profiles_public_id
BEFORE INSERT ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_public_id();

CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_folders_updated_at
BEFORE UPDATE ON public.task_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_labels_updated_at
BEFORE UPDATE ON public.task_labels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_tasks_updated_at
BEFORE UPDATE ON public.daily_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_subtasks_updated_at
BEFORE UPDATE ON public.task_subtasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_blocks_updated_at
BEFORE UPDATE ON public.calendar_blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_daily_stats_updated_at
BEFORE UPDATE ON public.calendar_daily_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_habits_updated_at
BEFORE UPDATE ON public.habits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goal_categories_updated_at
BEFORE UPDATE ON public.goal_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_finance_transactions_updated_at
BEFORE UPDATE ON public.finance_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nutrition_days_updated_at
BEFORE UPDATE ON public.nutrition_days
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rankings_updated_at
BEFORE UPDATE ON public.rankings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ranking_goal_logs_updated_at
BEFORE UPDATE ON public.ranking_goal_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_filters_updated_at
BEFORE UPDATE ON public.saved_filters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 7. PRÓXIMOS PASSOS
-- ============================================
-- 
-- 1. Execute este script no seu Supabase externo
-- 2. Crie um bucket storage chamado 'avatars' com permissão pública
-- 3. Configure as variáveis de ambiente no seu projeto Lovable:
--    - VITE_SUPABASE_URL: sua URL do Supabase
--    - VITE_SUPABASE_PUBLISHABLE_KEY: sua chave pública anon
--    - (Se usar Edge Functions) Adicione SUPABASE_URL e SUPABASE_ANON_KEY como secrets
--
-- ============================================
