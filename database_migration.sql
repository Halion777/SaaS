-- Migration to add missing fields for complete tracking system
-- Run this in your Supabase SQL editor

-- 1. Add missing sent_at field to quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;

-- 2. Add missing rejection_reason field
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. Update existing quotes to set sent_at based on status
UPDATE public.quotes 
SET sent_at = created_at 
WHERE status = 'sent' AND sent_at IS NULL;

-- 4. Create index on sent_at for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_sent_at ON public.quotes(sent_at);

-- 5. Create index on rejection_reason for filtering
CREATE INDEX IF NOT EXISTS idx_quotes_rejection_reason ON public.quotes(rejection_reason);

-- 6. Create missing quote_follow_up_rules table (matching your actual schema)
CREATE TABLE IF NOT EXISTS public.quote_follow_up_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    max_stages INTEGER NULL DEFAULT 3,
    stage_1_delay INTEGER NULL DEFAULT 1,
    stage_2_delay INTEGER NULL DEFAULT 3,
    stage_3_delay INTEGER NULL DEFAULT 5,
    max_attempts_per_stage INTEGER NULL DEFAULT 2,
    auto_advance_enabled BOOLEAN NULL DEFAULT true,
    reminder_subject_template TEXT NULL DEFAULT 'Rappel - Devis {quote_number}'::text,
    reminder_body_template TEXT NULL DEFAULT 'Bonjour {client_name}, nous vous rappelons notre devis {quote_number} pour {project_title}.'::text,
    is_active BOOLEAN NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
    CONSTRAINT quote_follow_up_rules_pkey PRIMARY KEY (id),
    CONSTRAINT quote_follow_up_rules_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Create index on quote_follow_up_rules
CREATE INDEX IF NOT EXISTS idx_quote_follow_up_rules_user_id ON public.quote_follow_up_rules USING btree (user_id);

-- 8. Enable RLS on quote_follow_up_rules
ALTER TABLE public.quote_follow_up_rules ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policy for quote_follow_up_rules (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'quote_follow_up_rules' 
        AND policyname = 'Users manage their own follow-up rules'
    ) THEN
        CREATE POLICY "Users manage their own follow-up rules" ON public.quote_follow_up_rules
            FOR ALL USING (user_id = auth.uid());
    END IF;
END $$;

-- 10. Insert default follow-up rules for existing users
INSERT INTO public.quote_follow_up_rules (user_id, max_stages, stage_1_delay, stage_2_delay, stage_3_delay, max_attempts_per_stage, auto_advance_enabled, is_active)
SELECT DISTINCT user_id, 3, 1, 3, 5, 2, true, true
FROM public.quotes
WHERE user_id NOT IN (SELECT user_id FROM public.quote_follow_up_rules);

-- 11. Create missing database functions with correct column references
-- Helper: get delay for a given stage with user defaults (using your schema columns)
CREATE OR REPLACE FUNCTION public.get_follow_up_delay_days(p_user_id UUID, p_stage SMALLINT)
RETURNS INTEGER AS $$
DECLARE
  v_delay_days INTEGER;
BEGIN
  SELECT CASE p_stage
    WHEN 1 THEN stage_1_delay
    WHEN 2 THEN stage_2_delay
    WHEN 3 THEN stage_3_delay
    ELSE 5 -- fallback
  END INTO v_delay_days
  FROM public.quote_follow_up_rules
  WHERE user_id = p_user_id;

  IF v_delay_days IS NULL THEN
    v_delay_days := CASE p_stage
      WHEN 1 THEN 1
      WHEN 2 THEN 3
      WHEN 3 THEN 5
      ELSE 5
    END;
  END IF;

  RETURN v_delay_days;
END;
$$ LANGUAGE plpgsql;

-- Create a follow-up for a quote at a specific stage
CREATE OR REPLACE FUNCTION public.create_follow_up_for_quote(p_quote_id UUID, p_stage SMALLINT)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_client_id UUID;
  v_delay_days INTEGER;
  v_follow_up_id UUID;
BEGIN
  SELECT user_id, client_id INTO v_user_id, v_client_id
  FROM public.quotes WHERE id = p_quote_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Quote not found: %', p_quote_id;
  END IF;

  v_delay_days := public.get_follow_up_delay_days(v_user_id, p_stage);

  INSERT INTO public.quote_follow_ups (
    quote_id, user_id, client_id, stage, scheduled_at, status, channel
  ) VALUES (
    p_quote_id, v_user_id, v_client_id, p_stage, NOW() + make_interval(days => v_delay_days), 'pending', 'email'
  ) RETURNING id INTO v_follow_up_id;

  INSERT INTO public.quote_events (quote_id, user_id, type, meta)
  VALUES (p_quote_id, v_user_id, 'followup_scheduled', jsonb_build_object('stage', p_stage, 'in_days', v_delay_days));

  RETURN v_follow_up_id;
END;
$$ LANGUAGE plpgsql;

-- 12. Update RLS policies if needed
-- (Your existing policies should work with the new fields)

-- Fix RLS policies for quote_signatures to allow unauthenticated client access
DROP POLICY IF EXISTS "Anyone can insert signatures" ON public.quote_signatures;
DROP POLICY IF EXISTS "Clients can insert signatures for shared quotes" ON public.quote_signatures;
DROP POLICY IF EXISTS "System can insert client signatures" ON public.quote_signatures;
DROP POLICY IF EXISTS "Users can manage their own quote signatures" ON public.quote_signatures;

-- Create new RLS policies that properly handle unauthenticated clients
CREATE POLICY "Enable insert for authenticated users and unauthenticated clients" ON public.quote_signatures
    FOR INSERT WITH CHECK (
        -- Allow authenticated users to insert their own signatures
        (auth.uid() IS NOT NULL AND 
         EXISTS (
             SELECT 1 FROM public.quotes q 
             WHERE q.id = quote_id 
             AND q.user_id = auth.uid()
         ))
        OR
        -- Allow unauthenticated clients to insert signatures for quotes they have access to
        (auth.uid() IS NULL AND 
         EXISTS (
             SELECT 1 FROM public.quotes q 
             JOIN public.quote_shares qs ON q.id = qs.quote_id
             WHERE q.id = quote_id 
             AND qs.is_active = true
         ))
    );

CREATE POLICY "Enable select for authenticated users and unauthenticated clients" ON public.quote_signatures
    FOR SELECT USING (
        -- Allow authenticated users to view signatures for their quotes
        (auth.uid() IS NOT NULL AND 
         EXISTS (
             SELECT 1 FROM public.quotes q 
             WHERE q.id = quote_id 
             AND q.user_id = auth.uid()
         ))
        OR
        -- Allow unauthenticated clients to view signatures for quotes they have access to
        (auth.uid() IS NULL AND 
         EXISTS (
             SELECT 1 FROM public.quotes q 
             JOIN public.quote_shares qs ON q.id = qs.quote_id
             WHERE q.id = quote_id 
             AND qs.is_active = true
         ))
    );

CREATE POLICY "Enable update for authenticated users" ON public.quote_signatures
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM public.quotes q 
            WHERE q.id = quote_id 
            AND q.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable delete for authenticated users" ON public.quote_signatures
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM public.quotes q 
            WHERE q.id = quote_id 
            AND q.user_id = auth.uid()
        )
    );
