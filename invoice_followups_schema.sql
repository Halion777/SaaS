-- =====================================================
-- Invoice Follow-Ups Database Schema
-- Similar structure to quote_follow_ups
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Invoice Follow-Ups Table
CREATE TABLE IF NOT EXISTS public.invoice_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  stage SMALLINT NOT NULL DEFAULT 1,                    -- 1, 2, or 3
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  next_attempt_at TIMESTAMP WITH TIME ZONE,
  attempts SMALLINT NOT NULL DEFAULT 0,
  max_attempts SMALLINT NOT NULL DEFAULT 3,             -- Max attempts per stage
  status VARCHAR(20) NOT NULL DEFAULT 'pending',        -- pending, scheduled, ready_for_dispatch, sent, failed, stopped, stage_X_completed, all_stages_completed
  channel VARCHAR(20) NOT NULL DEFAULT 'email',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  automated BOOLEAN NOT NULL DEFAULT true,
  template_subject TEXT,
  template_text TEXT,
  template_html TEXT,
  meta JSONB DEFAULT '{}'::jsonb,                       -- Store follow_up_type, priority, etc.
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  template_variables JSONB DEFAULT '{}'::jsonb,
  last_error TEXT,
  last_attempt TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoice_follow_ups_invoice_id ON public.invoice_follow_ups(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_follow_ups_user_id ON public.invoice_follow_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_follow_ups_client_id ON public.invoice_follow_ups(client_id);
CREATE INDEX IF NOT EXISTS idx_invoice_follow_ups_scheduled_at ON public.invoice_follow_ups(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_invoice_follow_ups_status ON public.invoice_follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_invoice_follow_ups_stage ON public.invoice_follow_ups(stage);
CREATE INDEX IF NOT EXISTS idx_invoice_follow_ups_template_id ON public.invoice_follow_ups(template_id);

-- Invoice Events Table (for tracking follow-up actions)
CREATE TABLE IF NOT EXISTS public.invoice_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,                              -- 'followup_sent', 'followup_failed', 'payment_received', 'manual_followup', etc.
  meta JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for invoice_events
CREATE INDEX IF NOT EXISTS idx_invoice_events_invoice_id ON public.invoice_events(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_events_user_id ON public.invoice_events(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_events_timestamp ON public.invoice_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_invoice_events_type ON public.invoice_events(type);

-- Add comments for documentation
COMMENT ON TABLE public.invoice_follow_ups IS 'Stores automated and manual follow-up records for invoices';
COMMENT ON COLUMN public.invoice_follow_ups.stage IS 'Follow-up stage: 1 (approaching/initial overdue), 2 (second reminder), 3 (final reminder)';
COMMENT ON COLUMN public.invoice_follow_ups.status IS 'Follow-up status: pending, scheduled, ready_for_dispatch, sent, failed, stopped, stage_X_completed, all_stages_completed';
COMMENT ON COLUMN public.invoice_follow_ups.meta IS 'JSON object storing follow_up_type (approaching_deadline, overdue), priority, automated flag, etc.';
COMMENT ON COLUMN public.invoice_follow_ups.template_variables IS 'JSON object with actual values for template variables';

COMMENT ON TABLE public.invoice_events IS 'Tracks all invoice-related events including follow-ups, payments, etc.';
COMMENT ON COLUMN public.invoice_events.type IS 'Event type: followup_sent, followup_failed, payment_received, manual_followup, etc.';

-- Add email template metadata to invoice_follow_ups table (similar to quote_follow_ups)
COMMENT ON COLUMN public.invoice_follow_ups.template_id IS 'Reference to the email template used for this follow-up';
COMMENT ON COLUMN public.invoice_follow_ups.template_variables IS 'JSON object with actual values for template variables';



-- =====================================================
-- Update email_outbox table to support invoice follow-ups
-- =====================================================

-- Add invoice_id column to email_outbox
ALTER TABLE public.email_outbox 
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE;

-- Update follow_up_id to also reference invoice_follow_ups
-- First, drop the existing foreign key constraint
ALTER TABLE public.email_outbox 
DROP CONSTRAINT IF EXISTS email_outbox_follow_up_id_fkey;

-- Add new constraint that allows both quote_follow_ups and invoice_follow_ups
-- Note: PostgreSQL doesn't support multiple foreign keys on the same column
-- So we'll keep it flexible - the application logic will handle which table it references
-- We'll use a CHECK constraint or application-level validation instead

-- Create index for invoice_id
CREATE INDEX IF NOT EXISTS idx_email_outbox_invoice_id ON public.email_outbox(invoice_id);

-- Update the comment
COMMENT ON COLUMN public.email_outbox.invoice_id IS 'Reference to invoice if this email is for an invoice follow-up';
COMMENT ON COLUMN public.email_outbox.quote_id IS 'Reference to quote if this email is for a quote follow-up';
COMMENT ON COLUMN public.email_outbox.follow_up_id IS 'Reference to follow-up record (can be from quote_follow_ups or invoice_follow_ups)';

