-- Fix overly permissive notifications INSERT policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Allow users to create notifications for themselves, or ranking creators to notify participants of their own rankings
CREATE POLICY "Users and ranking creators can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR (
    type IN ('ranking_invite', 'ranking_update', 'ranking_started', 'ranking_ended')
    AND (data ? 'ranking_id')
    AND public.is_ranking_creator(auth.uid(), (data->>'ranking_id')::uuid)
    AND EXISTS (
      SELECT 1
      FROM public.ranking_participants rp
      WHERE rp.ranking_id = (data->>'ranking_id')::uuid
        AND rp.user_id = notifications.user_id
    )
  )
);
