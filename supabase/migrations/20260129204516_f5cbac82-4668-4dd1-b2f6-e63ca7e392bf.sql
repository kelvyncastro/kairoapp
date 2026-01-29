-- Add status column to finance_transactions
ALTER TABLE public.finance_transactions 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'paid';

-- Update existing transactions to have 'paid' status
UPDATE public.finance_transactions SET status = 'paid' WHERE status IS NULL;