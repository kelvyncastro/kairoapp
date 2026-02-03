-- Add public_id to user_profiles for user identification
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS public_id TEXT UNIQUE;

-- Create function to generate unique public IDs
CREATE OR REPLACE FUNCTION public.generate_public_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Create trigger to auto-generate public_id on insert
CREATE OR REPLACE FUNCTION public.set_public_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE TRIGGER set_user_public_id
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_public_id();

-- Update existing profiles without public_id
DO $$
DECLARE
  profile RECORD;
  new_id TEXT;
BEGIN
  FOR profile IN SELECT id FROM user_profiles WHERE public_id IS NULL LOOP
    LOOP
      new_id := generate_public_id();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM user_profiles WHERE public_id = new_id);
    END LOOP;
    UPDATE user_profiles SET public_id = new_id WHERE id = profile.id;
  END LOOP;
END $$;

-- Create rankings table
CREATE TABLE public.rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 10,
  bet_description TEXT,
  bet_amount TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;

-- Create ranking_participants table
CREATE TABLE public.ranking_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_id UUID NOT NULL REFERENCES public.rankings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  accepted_bet BOOLEAN DEFAULT false,
  total_points NUMERIC NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ranking_id, user_id)
);

ALTER TABLE public.ranking_participants ENABLE ROW LEVEL SECURITY;

-- Create ranking_goals table (metas definidas pelo criador)
CREATE TABLE public.ranking_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_id UUID NOT NULL REFERENCES public.rankings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ranking_goals ENABLE ROW LEVEL SECURITY;

-- Create ranking_goal_logs table (registro de conclusão por usuário/dia)
CREATE TABLE public.ranking_goal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_id UUID NOT NULL REFERENCES public.rankings(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.ranking_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  points_earned NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(goal_id, user_id, date)
);

ALTER TABLE public.ranking_goal_logs ENABLE ROW LEVEL SECURITY;

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ranking_invite', 'ranking_started', 'ranking_ended', 'ranking_update', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is participant of a ranking
CREATE OR REPLACE FUNCTION public.is_ranking_participant(_user_id UUID, _ranking_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM ranking_participants
    WHERE user_id = _user_id AND ranking_id = _ranking_id AND status = 'accepted'
  ) OR EXISTS (
    SELECT 1 FROM rankings
    WHERE id = _ranking_id AND creator_id = _user_id
  )
$$;

-- Helper function to check if user is creator of a ranking
CREATE OR REPLACE FUNCTION public.is_ranking_creator(_user_id UUID, _ranking_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM rankings WHERE id = _ranking_id AND creator_id = _user_id
  )
$$;

-- RLS Policies for rankings
CREATE POLICY "Users can view rankings they participate in or created"
  ON public.rankings FOR SELECT
  USING (creator_id = auth.uid() OR is_ranking_participant(auth.uid(), id));

CREATE POLICY "Users can create rankings"
  ON public.rankings FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their rankings"
  ON public.rankings FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their rankings"
  ON public.rankings FOR DELETE
  USING (auth.uid() = creator_id);

-- RLS Policies for ranking_participants
CREATE POLICY "Users can view participants of their rankings"
  ON public.ranking_participants FOR SELECT
  USING (is_ranking_participant(auth.uid(), ranking_id) OR is_ranking_creator(auth.uid(), ranking_id) OR user_id = auth.uid());

CREATE POLICY "Creators can invite participants"
  ON public.ranking_participants FOR INSERT
  WITH CHECK (is_ranking_creator(auth.uid(), ranking_id));

CREATE POLICY "Users can update their own participation"
  ON public.ranking_participants FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Creators can remove participants"
  ON public.ranking_participants FOR DELETE
  USING (is_ranking_creator(auth.uid(), ranking_id) OR user_id = auth.uid());

-- RLS Policies for ranking_goals
CREATE POLICY "Participants can view goals"
  ON public.ranking_goals FOR SELECT
  USING (is_ranking_participant(auth.uid(), ranking_id) OR is_ranking_creator(auth.uid(), ranking_id));

CREATE POLICY "Creators can create goals"
  ON public.ranking_goals FOR INSERT
  WITH CHECK (is_ranking_creator(auth.uid(), ranking_id));

CREATE POLICY "Creators can update goals"
  ON public.ranking_goals FOR UPDATE
  USING (is_ranking_creator(auth.uid(), ranking_id));

CREATE POLICY "Creators can delete goals"
  ON public.ranking_goals FOR DELETE
  USING (is_ranking_creator(auth.uid(), ranking_id));

-- RLS Policies for ranking_goal_logs
CREATE POLICY "Users can view logs of their rankings"
  ON public.ranking_goal_logs FOR SELECT
  USING (is_ranking_participant(auth.uid(), ranking_id) OR is_ranking_creator(auth.uid(), ranking_id));

CREATE POLICY "Users can log their own goals"
  ON public.ranking_goal_logs FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_ranking_participant(auth.uid(), ranking_id));

CREATE POLICY "Users can update their own logs"
  ON public.ranking_goal_logs FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own logs"
  ON public.ranking_goal_logs FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ranking_goal_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ranking_participants;