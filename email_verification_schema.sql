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

-- ===============================================
-- EMAIL VERIFICATION OTP TABLE
-- Run this in Supabase SQL Editor
-- ===============================================

-- Create table for storing OTP codes
CREATE TABLE IF NOT EXISTS public.email_verification_otps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_email ON public.email_verification_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_expires_at ON public.email_verification_otps(expires_at);

-- Add comments
COMMENT ON TABLE public.email_verification_otps IS 'Stores OTP codes for email verification';
COMMENT ON COLUMN public.email_verification_otps.email IS 'Email address to verify';
COMMENT ON COLUMN public.email_verification_otps.otp IS '6-digit OTP code';
COMMENT ON COLUMN public.email_verification_otps.expires_at IS 'When the OTP expires (10 minutes from creation)';
COMMENT ON COLUMN public.email_verification_otps.attempts IS 'Number of failed verification attempts';

-- Enable RLS (Row Level Security)
ALTER TABLE public.email_verification_otps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage OTPs" ON public.email_verification_otps;

-- Create policy to allow service role to manage OTPs
-- Note: Edge Functions use service role, so they can access this table
CREATE POLICY "Service role can manage OTPs" ON public.email_verification_otps
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT ALL ON public.email_verification_otps TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Create function to automatically clean up expired OTPs (optional)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.email_verification_otps
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- You can run this function periodically via a cron job or manually
-- SELECT cleanup_expired_otps();

