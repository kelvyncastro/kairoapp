-- Add UPDATE policy for goal_progress_history
CREATE POLICY "Users can update own goal progress" 
ON public.goal_progress_history 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM goals g 
  WHERE g.id = goal_progress_history.goal_id 
  AND g.user_id = auth.uid()
));