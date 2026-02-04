-- Fix the security definer view issue by dropping and recreating with security invoker
DROP VIEW IF EXISTS public.public_user_profiles;

-- Recreate the view with SECURITY INVOKER (default behavior for views)
-- This ensures the view uses the permissions of the querying user
CREATE VIEW public.public_user_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  first_name,
  avatar_url,
  public_id
FROM public.user_profiles
WHERE public_id IS NOT NULL;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.public_user_profiles TO authenticated;