-- =====================================================
-- STEP 3: ADD INVOICE ATTACHMENTS TABLE
-- Creates attachments support for client invoices
-- RUN THIS THIRD (after step1 and step2)
-- =====================================================

-- Create invoice_attachments table (matching expense_invoice_attachments structure)
CREATE TABLE IF NOT EXISTS public.invoice_attachments (
  id SERIAL PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  mime_type VARCHAR(100),
  description TEXT,
  is_embedded_in_ubl BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT invoice_attachments_file_size_check CHECK (file_size > 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoice_attachments_invoice_id ON public.invoice_attachments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_attachments_uploaded_at ON public.invoice_attachments(uploaded_at DESC);

-- Enable Row Level Security
ALTER TABLE public.invoice_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view attachments for their own invoices"
  ON public.invoice_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_attachments.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert attachments for their own invoices"
  ON public.invoice_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_attachments.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update attachments for their own invoices"
  ON public.invoice_attachments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_attachments.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete attachments for their own invoices"
  ON public.invoice_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_attachments.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_attachments TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.invoice_attachments_id_seq TO authenticated;

-- Create helper function
CREATE OR REPLACE FUNCTION public.get_invoice_attachments(p_invoice_id UUID)
RETURNS TABLE (
  id INTEGER,
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  file_size BIGINT,
  file_type VARCHAR(100),
  mime_type VARCHAR(100),
  description TEXT,
  is_embedded_in_ubl BOOLEAN,
  uploaded_at TIMESTAMP WITHOUT TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ia.id,
    ia.file_name,
    ia.file_path,
    ia.file_size,
    ia.file_type,
    ia.mime_type,
    ia.description,
    ia.is_embedded_in_ubl,
    ia.uploaded_at
  FROM public.invoice_attachments ia
  WHERE ia.invoice_id = p_invoice_id
  ORDER BY ia.uploaded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_invoice_attachments TO authenticated;

