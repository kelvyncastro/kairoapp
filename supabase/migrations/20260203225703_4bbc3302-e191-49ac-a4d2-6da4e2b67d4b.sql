-- Add subscription_status column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN subscription_status text NOT NULL DEFAULT 'inactive';

-- Create index for faster queries
CREATE INDEX idx_user_profiles_subscription ON public.user_profiles(subscription_status);

-- Drop existing SELECT policy on user_profiles
DROP POLICY IF EXISTS "Users can view own or search by public_id" ON public.user_profiles;

-- Create new SELECT policy that allows admins to view all profiles
CREATE POLICY "Users can view own or admins can view all"
ON public.user_profiles
FOR SELECT
USING (
  (auth.uid() = user_id) 
  OR ((auth.uid() IS NOT NULL) AND (public_id IS NOT NULL))
  OR has_role(auth.uid(), 'admin')
);

-- Drop existing UPDATE policy on user_profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

-- Create new UPDATE policy that allows admins to update any profile
CREATE POLICY "Users can update own or admins can update all"
ON public.user_profiles
FOR UPDATE
USING (
  (auth.uid() = user_id) 
  OR has_role(auth.uid(), 'admin')
);