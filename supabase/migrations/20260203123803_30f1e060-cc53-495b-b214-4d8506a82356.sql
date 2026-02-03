-- Create enum for demand types
CREATE TYPE public.calendar_demand_type AS ENUM ('fixed', 'flexible', 'micro');

-- Create enum for block status
CREATE TYPE public.calendar_block_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'postponed');

-- Create enum for priority levels
CREATE TYPE public.calendar_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create enum for recurrence types
CREATE TYPE public.calendar_recurrence_type AS ENUM ('none', 'daily', 'weekly', 'monthly', 'custom');

-- Main table for calendar blocks/demands
CREATE TABLE public.calendar_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Time management
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (end_time - start_time)) / 60) STORED,
  
  -- Block classification
  demand_type public.calendar_demand_type NOT NULL DEFAULT 'fixed',
  priority public.calendar_priority NOT NULL DEFAULT 'medium',
  status public.calendar_block_status NOT NULL DEFAULT 'pending',
  
  -- Visual customization
  color TEXT DEFAULT '#6366f1',
  
  -- Recurrence settings
  recurrence_type public.calendar_recurrence_type NOT NULL DEFAULT 'none',
  recurrence_rule JSONB, -- Stores complex recurrence patterns
  recurrence_end_date DATE,
  recurrence_parent_id UUID REFERENCES public.calendar_blocks(id) ON DELETE CASCADE,
  is_recurrence_paused BOOLEAN DEFAULT false,
  
  -- Execution tracking
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX idx_calendar_blocks_user_date ON public.calendar_blocks(user_id, start_time);
CREATE INDEX idx_calendar_blocks_recurrence ON public.calendar_blocks(recurrence_parent_id) WHERE recurrence_parent_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.calendar_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own calendar blocks"
  ON public.calendar_blocks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own calendar blocks"
  ON public.calendar_blocks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar blocks"
  ON public.calendar_blocks
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar blocks"
  ON public.calendar_blocks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_calendar_blocks_updated_at
  BEFORE UPDATE ON public.calendar_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Table for daily productivity tracking
CREATE TABLE public.calendar_daily_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  
  -- Planning stats
  planned_blocks INTEGER DEFAULT 0,
  completed_blocks INTEGER DEFAULT 0,
  cancelled_blocks INTEGER DEFAULT 0,
  postponed_blocks INTEGER DEFAULT 0,
  
  -- Time stats (in minutes)
  planned_time_minutes INTEGER DEFAULT 0,
  actual_time_minutes INTEGER DEFAULT 0,
  
  -- Execution score (0-100)
  execution_score INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.calendar_daily_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own daily stats"
  ON public.calendar_daily_stats
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own daily stats"
  ON public.calendar_daily_stats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily stats"
  ON public.calendar_daily_stats
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for efficient queries
CREATE INDEX idx_calendar_daily_stats_user_date ON public.calendar_daily_stats(user_id, date);

-- Enable realtime for calendar_blocks
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_blocks;