-- Drop existing table and start fresh
DROP TABLE IF EXISTS public.app_settings CASCADE;

-- Create app_settings table
CREATE TABLE public.app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID
);

-- Create index for faster lookups
CREATE INDEX idx_app_settings_key ON public.app_settings(setting_key);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- SIMPLE RLS: Allow all authenticated users to do everything
-- (You can add super admin check later in your app logic)
CREATE POLICY "Allow all for authenticated users"
ON public.app_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Insert default settings
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES (
  'service_visibility',
  '{"creditInsurance": true, "recovery": true}'::jsonb,
  'Controls which services are visible in the user sidebar'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Verify it worked
SELECT * FROM public.app_settings WHERE setting_key = 'service_visibility';

