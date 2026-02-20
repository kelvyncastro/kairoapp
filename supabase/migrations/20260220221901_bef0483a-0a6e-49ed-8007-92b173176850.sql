
-- Add source tracking columns to calendar_blocks
ALTER TABLE public.calendar_blocks
ADD COLUMN source_type text NOT NULL DEFAULT 'manual',
ADD COLUMN finance_transaction_id uuid REFERENCES public.finance_transactions(id) ON DELETE SET NULL;

-- Index for quick lookup
CREATE INDEX idx_calendar_blocks_finance_tx ON public.calendar_blocks(finance_transaction_id) WHERE finance_transaction_id IS NOT NULL;
CREATE INDEX idx_calendar_blocks_source_type ON public.calendar_blocks(source_type) WHERE source_type != 'manual';
