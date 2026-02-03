-- Drop existing policy on rankings
DROP POLICY IF EXISTS "Users can view rankings they participate in or created" ON public.rankings;

-- Create updated policy that includes pending participants (invited users)
CREATE POLICY "Users can view rankings they participate in or created" 
ON public.rankings 
FOR SELECT 
USING (
  creator_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM public.ranking_participants 
    WHERE ranking_participants.ranking_id = rankings.id 
    AND ranking_participants.user_id = auth.uid()
  )
);

-- Also fix the is_ranking_participant function to include pending participants
CREATE OR REPLACE FUNCTION public.is_ranking_participant(_user_id uuid, _ranking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ranking_participants
    WHERE ranking_id = _ranking_id
      AND user_id = _user_id
  )
$$;