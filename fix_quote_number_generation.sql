-- Fix generate_quote_number function to check both quotes and quote_drafts tables
-- This prevents generating quote numbers that are already used in auto-saved drafts

CREATE OR REPLACE FUNCTION public.generate_quote_number(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  sequence_num INTEGER;
  quote_num TEXT;
  max_quote_num INTEGER;
  max_draft_num INTEGER;
BEGIN
  year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Get the max sequence number from quotes table for this user and year
  SELECT COALESCE(MAX(CAST(SUBSTRING(quotes.quote_number FROM 'DEV-' || year || '-(.+)') AS INTEGER)), 0)
  INTO max_quote_num
  FROM public.quotes
  WHERE quotes.user_id = generate_quote_number.user_id 
    AND quotes.quote_number LIKE 'DEV-' || year || '-%';
  
  -- Get the max sequence number from quote_drafts table for this user and year
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_drafts.quote_number FROM 'DEV-' || year || '-(.+)') AS INTEGER)), 0)
  INTO max_draft_num
  FROM public.quote_drafts
  WHERE quote_drafts.user_id = generate_quote_number.user_id 
    AND quote_drafts.quote_number IS NOT NULL
    AND quote_drafts.quote_number LIKE 'DEV-' || year || '-%';
  
  -- Use the maximum of both to ensure uniqueness, then add 1
  sequence_num := GREATEST(max_quote_num, max_draft_num) + 1;
  
  -- Format: DEV-YYYY-XXXXXX (6 digits)
  quote_num := 'DEV-' || year || '-' || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN quote_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

