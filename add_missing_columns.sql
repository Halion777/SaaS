-- Add missing columns to quote_follow_ups table for Edge Function compatibility
ALTER TABLE public.quote_follow_ups 
ADD COLUMN IF NOT EXISTS template_subject text,
ADD COLUMN IF NOT EXISTS template_text text,
ADD COLUMN IF NOT EXISTS template_html text,
ADD COLUMN IF NOT EXISTS meta jsonb DEFAULT '{}'::jsonb;



-- Add comments for documentation
COMMENT ON COLUMN public.quote_follow_ups.template_subject IS 'Email subject template for this follow-up';
COMMENT ON COLUMN public.quote_follow_ups.template_text IS 'Email text content template for this follow-up';
COMMENT ON COLUMN public.quote_follow_ups.template_html IS 'Email HTML content template for this follow-up';
COMMENT ON COLUMN public.quote_follow_ups.meta IS 'Additional metadata for the follow-up (optional)';