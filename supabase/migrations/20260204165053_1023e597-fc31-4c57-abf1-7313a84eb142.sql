-- Fix user_profiles RLS policies to prevent data exposure
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view own or admins can view all" ON public.user_profiles;

-- Create a more restrictive SELECT policy
-- Users can only view their own profile OR see limited public profile info for ranking purposes
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create a separate view for public profile data (only name and avatar for rankings)
-- This protects sensitive fields like birth_date and subscription_status
CREATE OR REPLACE VIEW public.public_user_profiles AS
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