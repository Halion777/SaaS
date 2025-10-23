-- ===============================================
-- EMAIL VERIFICATION SETUP
-- Run this in Supabase SQL Editor
-- ===============================================

-- Step 1: Add email verification columns to public.users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Create function to sync email verification from auth.users
CREATE OR REPLACE FUNCTION sync_email_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Update public.users when auth.users email is confirmed
  UPDATE public.users
  SET 
    email_verified = TRUE,
    email_verified_at = NEW.email_confirmed_at,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger to auto-sync email verification
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION sync_email_verification();

-- Step 4: Backfill existing verified users
UPDATE public.users u
SET 
  email_verified = TRUE,
  email_verified_at = a.email_confirmed_at,
  updated_at = NOW()
FROM auth.users a
WHERE 
  u.id = a.id 
  AND a.email_confirmed_at IS NOT NULL
  AND u.email_verified = FALSE;

-- Step 5: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified);

-- Step 6: Add helpful comments
COMMENT ON COLUMN public.users.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN public.users.email_verified_at IS 'Timestamp when the email was verified';

-- Verification query
SELECT 
  id, 
  email, 
  email_verified,
  email_verified_at,
  created_at
FROM public.users 
ORDER BY created_at DESC 
LIMIT 10;

