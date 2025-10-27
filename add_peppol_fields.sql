-- =====================================================
-- STEP 1: ADD PEPPOL FIELDS TO EXISTING TABLES
-- Adds Peppol support to your existing invoice tables
-- RUN THIS FIRST
-- =====================================================

-- Add Peppol fields to CLIENT INVOICES (invoices table)
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS peppol_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS peppol_message_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS peppol_status VARCHAR(50) DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS peppol_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS peppol_delivered_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS peppol_error_message TEXT,
  ADD COLUMN IF NOT EXISTS ubl_xml TEXT,
  ADD COLUMN IF NOT EXISTS receiver_peppol_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS peppol_metadata JSONB DEFAULT '{}'::jsonb;

-- Add constraint for peppol_status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'invoices_peppol_status_check'
    ) THEN
        ALTER TABLE public.invoices 
        ADD CONSTRAINT invoices_peppol_status_check 
        CHECK (peppol_status IN ('not_sent', 'sending', 'sent', 'delivered', 'failed'));
    END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_invoices_peppol_enabled ON public.invoices(peppol_enabled);
CREATE INDEX IF NOT EXISTS idx_invoices_peppol_status ON public.invoices(peppol_status);
CREATE INDEX IF NOT EXISTS idx_invoices_peppol_message_id ON public.invoices(peppol_message_id);

-- Add Peppol fields to SUPPLIER INVOICES (expense_invoices table)
ALTER TABLE public.expense_invoices
  ADD COLUMN IF NOT EXISTS peppol_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS peppol_message_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS peppol_received_at TIMESTAMP WITHOUT TIME ZONE,
  ADD COLUMN IF NOT EXISTS ubl_xml TEXT,
  ADD COLUMN IF NOT EXISTS sender_peppol_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS peppol_metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_expense_invoices_peppol_enabled ON public.expense_invoices(peppol_enabled);
CREATE INDEX IF NOT EXISTS idx_expense_invoices_peppol_message_id ON public.expense_invoices(peppol_message_id);
CREATE INDEX IF NOT EXISTS idx_expense_invoices_user_id ON public.expense_invoices(user_id);

-- Update RLS on expense_invoices
ALTER TABLE public.expense_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own expense invoices" ON public.expense_invoices;
DROP POLICY IF EXISTS "Users can insert their own expense invoices" ON public.expense_invoices;
DROP POLICY IF EXISTS "Users can update their own expense invoices" ON public.expense_invoices;
DROP POLICY IF EXISTS "Users can delete their own expense invoices" ON public.expense_invoices;

CREATE POLICY "Users can view their own expense invoices"
  ON public.expense_invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expense invoices"
  ON public.expense_invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense invoices"
  ON public.expense_invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense invoices"
  ON public.expense_invoices FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert expense invoices"
  ON public.expense_invoices FOR INSERT
  WITH CHECK (true);

-- No views needed - tables provide all functionality

-- Create helper functions
CREATE OR REPLACE FUNCTION public.mark_invoice_sent_via_peppol(
  p_invoice_id UUID,
  p_peppol_message_id VARCHAR,
  p_receiver_peppol_id VARCHAR,
  p_ubl_xml TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.invoices
  SET 
    peppol_enabled = true,
    peppol_status = 'sent',
    peppol_message_id = p_peppol_message_id,
    peppol_sent_at = NOW(),
    receiver_peppol_id = p_receiver_peppol_id,
    ubl_xml = p_ubl_xml,
    updated_at = NOW()
  WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_peppol_invoice_status(
  p_peppol_message_id VARCHAR,
  p_status VARCHAR,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.invoices
  SET 
    peppol_status = p_status,
    peppol_delivered_at = CASE WHEN p_status = 'delivered' THEN NOW() ELSE peppol_delivered_at END,
    peppol_error_message = p_error_message,
    updated_at = NOW()
  WHERE peppol_message_id = p_peppol_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.mark_invoice_sent_via_peppol TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_peppol_invoice_status TO authenticated;

-- Update existing Peppol invoices
UPDATE public.expense_invoices 
SET peppol_enabled = true
WHERE source = 'peppol';


