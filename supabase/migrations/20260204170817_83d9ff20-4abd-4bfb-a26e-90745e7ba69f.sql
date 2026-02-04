-- Drop the existing view
DROP VIEW IF EXISTS public.public_user_profiles;

-- Create a security definer function to safely access public profiles
-- This ensures only authenticated users can access the data
CREATE OR REPLACE FUNCTION public.get_public_user_profiles()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  first_name text,
  avatar_url text,
  public_id text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    up.id,
    up.user_id,
    up.first_name,
    up.avatar_url,
    up.public_id
  FROM public.user_profiles up
  WHERE up.public_id IS NOT NULL
    AND auth.uid() IS NOT NULL  -- Only authenticated users can access
$$;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_public_user_profiles() TO authenticated;

-- Revoke from anon to ensure no public access
REVOKE EXECUTE ON FUNCTION public.get_public_user_profiles() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_public_user_profiles() FROM public;