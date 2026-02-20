
-- Add account_status column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';

-- Update existing profiles that have onboarding_completed = false to first_access_pending
UPDATE public.user_profiles 
SET account_status = 'first_access_pending' 
WHERE onboarding_completed = false AND account_status = 'active';
