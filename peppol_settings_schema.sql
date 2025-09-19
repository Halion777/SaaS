-- Table for Peppol Settings (User-specific configuration)
CREATE TABLE public.peppol_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    peppol_id TEXT,
    business_name TEXT,
    sandbox_mode BOOLEAN DEFAULT TRUE,
    is_configured BOOLEAN DEFAULT FALSE,
    last_tested TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on user_id to ensure one settings record per user
CREATE UNIQUE INDEX idx_peppol_settings_user_id ON public.peppol_settings(user_id);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_peppol_settings_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_peppol_settings_updated_at 
    BEFORE UPDATE ON public.peppol_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_peppol_settings_updated_at_column();

-- Enable RLS
ALTER TABLE public.peppol_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for peppol_settings
CREATE POLICY "Users can view their own peppol_settings" ON public.peppol_settings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own peppol_settings" ON public.peppol_settings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own peppol_settings" ON public.peppol_settings
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own peppol_settings" ON public.peppol_settings
    FOR DELETE USING (user_id = auth.uid());

-- Superadmins can manage all peppol_settings
CREATE POLICY "Superadmins can manage all peppol_settings" ON public.peppol_settings
    FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE public.users.id = auth.uid() AND public.users.role = 'superadmin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE public.users.id = auth.uid() AND public.users.role = 'superadmin'));
