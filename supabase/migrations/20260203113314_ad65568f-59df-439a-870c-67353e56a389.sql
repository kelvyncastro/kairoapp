-- Simplify notification policy to allow ranking creators to send notifications
DROP POLICY IF EXISTS "Users and ranking creators can create notifications" ON public.notifications;

-- Simple policy: users can create notifications for themselves, and ranking creators can notify anyone
CREATE POLICY "Users and ranking creators can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR (
    type IN ('ranking_invite', 'ranking_update', 'ranking_started', 'ranking_ended')
    AND (data ? 'ranking_id')
    AND public.is_ranking_creator(auth.uid(), (data->>'ranking_id')::uuid)
  )
);