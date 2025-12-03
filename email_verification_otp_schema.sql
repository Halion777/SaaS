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

