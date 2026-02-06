-- Add deletion consent tracking to ranking_participants
ALTER TABLE public.ranking_participants 
ADD COLUMN IF NOT EXISTS deletion_consent boolean DEFAULT false;

-- Add deletion requested tracking to rankings
ALTER TABLE public.rankings
ADD COLUMN IF NOT EXISTS deletion_requested boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deletion_requested_at timestamp with time zone DEFAULT null;

-- Create notifications policy for deletion requests
-- (already exists, just ensuring it works)