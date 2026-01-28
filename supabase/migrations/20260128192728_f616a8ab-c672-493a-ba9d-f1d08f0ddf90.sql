-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.goal_type AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');
CREATE TYPE public.goal_status AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED');
CREATE TYPE public.workout_technique AS ENUM ('NONE', 'DROP_SET', 'REST_PAUSE', 'SUPERSET', 'TEMPO', 'AMRAP', 'CLUSTER', 'MTOR');
CREATE TYPE public.food_source AS ENUM ('PHOTO', 'TEXT', 'MANUAL');

-- User Settings table
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  theme TEXT DEFAULT 'cave',
  week_starts_on INTEGER DEFAULT 1,
  daily_reset_time TIME DEFAULT '00:00:00',
  units TEXT DEFAULT 'kg',
  rest_timer_default_seconds INTEGER DEFAULT 90,
  calories_target INTEGER DEFAULT 2000,
  protein_target INTEGER DEFAULT 150,
  carbs_target INTEGER DEFAULT 250,
  fat_target INTEGER DEFAULT 70,
  fiber_target INTEGER DEFAULT 30,
  streak_rule TEXT DEFAULT 'complete_task_or_workout_or_diet',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Daily Tasks table
CREATE TABLE public.daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 2 CHECK (priority >= 1 AND priority <= 3),
  is_recurring BOOLEAN DEFAULT false,
  recurring_rule TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type goal_type NOT NULL,
  target_value NUMERIC NOT NULL DEFAULT 1,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit_label TEXT DEFAULT 'vezes',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status goal_status DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Consistency Days table
CREATE TABLE public.consistency_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  reason TEXT,
  streak_snapshot INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Workout Plans table
CREATE TABLE public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Exercises table
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  muscle_group TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Workout Sessions table
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  datetime_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  datetime_end TIMESTAMPTZ,
  total_volume NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Workout Exercise Entries table
CREATE TABLE public.workout_exercise_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Workout Sets table
CREATE TABLE public.workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_entry_id UUID NOT NULL REFERENCES public.workout_exercise_entries(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL DEFAULT 1,
  reps INTEGER NOT NULL DEFAULT 0,
  weight_kg NUMERIC NOT NULL DEFAULT 0,
  rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),
  technique workout_technique DEFAULT 'NONE',
  completed BOOLEAN DEFAULT false,
  rest_seconds_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Nutrition Days table
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Meals table
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nutrition_day_id UUID NOT NULL REFERENCES public.nutrition_days(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Food Items table
CREATE TABLE public.food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity_text TEXT,
  calories NUMERIC DEFAULT 0,
  protein NUMERIC DEFAULT 0,
  carbs NUMERIC DEFAULT 0,
  fat NUMERIC DEFAULT 0,
  fiber NUMERIC DEFAULT 0,
  source food_source DEFAULT 'MANUAL',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Finance Sectors table
CREATE TABLE public.finance_sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color_label TEXT DEFAULT '#404040',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Finance Transactions table
CREATE TABLE public.finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  value NUMERIC NOT NULL,
  sector_id UUID REFERENCES public.finance_sectors(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ebook Content table
CREATE TABLE public.ebook_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  section_key TEXT NOT NULL,
  title TEXT NOT NULL,
  content_markdown TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consistency_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercise_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for daily_tasks
CREATE POLICY "Users can view own tasks" ON public.daily_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.daily_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.daily_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.daily_tasks FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for goals
CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for consistency_days
CREATE POLICY "Users can view own consistency" ON public.consistency_days FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consistency" ON public.consistency_days FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own consistency" ON public.consistency_days FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for workout_plans
CREATE POLICY "Users can view own plans" ON public.workout_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plans" ON public.workout_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans" ON public.workout_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plans" ON public.workout_plans FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for exercises
CREATE POLICY "Users can view own exercises" ON public.exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exercises" ON public.exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exercises" ON public.exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exercises" ON public.exercises FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for workout_sessions
CREATE POLICY "Users can view own sessions" ON public.workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.workout_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.workout_sessions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for workout_exercise_entries (via session ownership)
CREATE POLICY "Users can view own entries" ON public.workout_exercise_entries FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.workout_sessions ws WHERE ws.id = session_id AND ws.user_id = auth.uid()));
CREATE POLICY "Users can insert own entries" ON public.workout_exercise_entries FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.workout_sessions ws WHERE ws.id = session_id AND ws.user_id = auth.uid()));
CREATE POLICY "Users can update own entries" ON public.workout_exercise_entries FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.workout_sessions ws WHERE ws.id = session_id AND ws.user_id = auth.uid()));
CREATE POLICY "Users can delete own entries" ON public.workout_exercise_entries FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.workout_sessions ws WHERE ws.id = session_id AND ws.user_id = auth.uid()));

-- RLS Policies for workout_sets (via entry ownership)
CREATE POLICY "Users can view own sets" ON public.workout_sets FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.workout_exercise_entries wee 
    JOIN public.workout_sessions ws ON ws.id = wee.session_id 
    WHERE wee.id = exercise_entry_id AND ws.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own sets" ON public.workout_sets FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workout_exercise_entries wee 
    JOIN public.workout_sessions ws ON ws.id = wee.session_id 
    WHERE wee.id = exercise_entry_id AND ws.user_id = auth.uid()
  ));
CREATE POLICY "Users can update own sets" ON public.workout_sets FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.workout_exercise_entries wee 
    JOIN public.workout_sessions ws ON ws.id = wee.session_id 
    WHERE wee.id = exercise_entry_id AND ws.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own sets" ON public.workout_sets FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.workout_exercise_entries wee 
    JOIN public.workout_sessions ws ON ws.id = wee.session_id 
    WHERE wee.id = exercise_entry_id AND ws.user_id = auth.uid()
  ));

-- RLS Policies for nutrition_days
CREATE POLICY "Users can view own nutrition" ON public.nutrition_days FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own nutrition" ON public.nutrition_days FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own nutrition" ON public.nutrition_days FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own nutrition" ON public.nutrition_days FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for meals
CREATE POLICY "Users can view own meals" ON public.meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meals" ON public.meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meals" ON public.meals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meals" ON public.meals FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for food_items (via meal ownership)
CREATE POLICY "Users can view own food" ON public.food_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.meals m WHERE m.id = meal_id AND m.user_id = auth.uid()));
CREATE POLICY "Users can insert own food" ON public.food_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.meals m WHERE m.id = meal_id AND m.user_id = auth.uid()));
CREATE POLICY "Users can update own food" ON public.food_items FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.meals m WHERE m.id = meal_id AND m.user_id = auth.uid()));
CREATE POLICY "Users can delete own food" ON public.food_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.meals m WHERE m.id = meal_id AND m.user_id = auth.uid()));

-- RLS Policies for finance_sectors
CREATE POLICY "Users can view own sectors" ON public.finance_sectors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sectors" ON public.finance_sectors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sectors" ON public.finance_sectors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sectors" ON public.finance_sectors FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for finance_transactions
CREATE POLICY "Users can view own transactions" ON public.finance_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.finance_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.finance_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.finance_transactions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ebook_content (global content is readable by all authenticated users)
CREATE POLICY "Users can view ebook content" ON public.ebook_content FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own ebook content" ON public.ebook_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ebook content" ON public.ebook_content FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_tasks_updated_at BEFORE UPDATE ON public.daily_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workout_plans_updated_at BEFORE UPDATE ON public.workout_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_nutrition_days_updated_at BEFORE UPDATE ON public.nutrition_days FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_finance_transactions_updated_at BEFORE UPDATE ON public.finance_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();