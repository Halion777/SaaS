-- Migration script to update quote_follow_up_rules table structure
-- Run this script to update your existing database

-- Step 1: Drop the old trigger
DROP TRIGGER IF EXISTS update_quote_follow_up_rules_updated_at ON public.quote_follow_up_rules;

-- Step 2: Drop the old table (this will remove all existing data)
DROP TABLE IF EXISTS public.quote_follow_up_rules CASCADE;

-- Step 3: Create the new table with updated structure
CREATE TABLE public.quote_follow_up_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    max_stages INTEGER NOT NULL DEFAULT 3,
    max_attempts_per_stage INTEGER NOT NULL DEFAULT 2,
    stage_1_delay INTEGER NOT NULL DEFAULT 0,
    stage_2_delay INTEGER NOT NULL DEFAULT 1,
    stage_3_delay INTEGER NOT NULL DEFAULT 3,
    instant_view_followup BOOLEAN NOT NULL DEFAULT true,
    view_followup_template TEXT NULL DEFAULT 'viewed_instant',
    sent_followup_template TEXT NULL DEFAULT 'email_not_opened',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id)
);

-- Step 4: Create the new trigger
CREATE TRIGGER update_quote_follow_up_rules_updated_at
  BEFORE UPDATE ON public.quote_follow_up_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_quote_follow_up_rules_user_id ON public.quote_follow_up_rules(user_id);

-- Step 6: Enable RLS
ALTER TABLE public.quote_follow_up_rules ENABLE ROW LEVEL SECURITY;

-- Step 7: Create policies
CREATE POLICY "Users manage their own follow-up rules" ON public.quote_follow_up_rules
  FOR ALL USING (user_id = auth.uid());


COMMENT ON TABLE public.quote_follow_up_rules IS 'Updated follow-up rules table with new structure for better follow-up management';
COMMENT ON COLUMN public.quote_follow_up_rules.stage_1_delay IS 'Delay in days for stage 1 follow-up (0 = immediate)';
COMMENT ON COLUMN public.quote_follow_up_rules.stage_2_delay IS 'Delay in days for stage 2 follow-up';
COMMENT ON COLUMN public.quote_follow_up_rules.stage_3_delay IS 'Delay in days for stage 3 follow-up';
COMMENT ON COLUMN public.quote_follow_up_rules.instant_view_followup IS 'Whether to send immediate follow-up when quote is viewed';
COMMENT ON COLUMN public.quote_follow_up_rules.view_followup_template IS 'Template to use for instant view follow-ups';
COMMENT ON COLUMN public.quote_follow_up_rules.sent_followup_template IS 'Template to use for sent quote follow-ups';
