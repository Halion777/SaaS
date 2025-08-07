
-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company_name TEXT,
  vat_number TEXT,
  phone TEXT,
  profession TEXT,
  country TEXT DEFAULT 'FR',
  business_size TEXT,
  selected_plan TEXT DEFAULT 'pro',
  subscription_status TEXT DEFAULT 'trial',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table for multi-user functionality
CREATE TABLE public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL,
  avatar TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  pin TEXT,
  is_active BOOLEAN DEFAULT false,
  last_active TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User invitations table
CREATE TABLE public.user_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User profiles policies
CREATE POLICY "Users can view company profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = user_profiles.user_id 
      AND users.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage company profiles" ON public.user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = user_profiles.user_id 
      AND users.id = auth.uid()
    )
  );

-- Invitations policies
CREATE POLICY "Users can view company invitations" ON public.user_invitations
  FOR SELECT USING (company_id = auth.uid());

CREATE POLICY "Users can manage company invitations" ON public.user_invitations
  FOR ALL USING (company_id = auth.uid());

-- Function to handle new user creation (ONLY creates user record, NO profile creation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    company_name,
    vat_number,
    avatar_url,
    trial_start_date,
    trial_end_date,
    subscription_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'vat_number',
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW() + INTERVAL '14 days',
    'trial'
  );
  -- NO profile creation here - let our application code handle it
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user record when auth user is created (NO profile creation)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user is in trial period
CREATE OR REPLACE FUNCTION public.is_user_in_trial(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT trial_end_date INTO trial_end
  FROM public.users
  WHERE id = user_id;
  
  RETURN trial_end IS NOT NULL AND NOW() < trial_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user subscription status
CREATE OR REPLACE FUNCTION public.get_user_subscription_status(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_status TEXT;
  trial_active BOOLEAN;
BEGIN
  -- Check trial status
  SELECT is_user_in_trial(user_id) INTO trial_active;
  
  IF trial_active THEN
    RETURN 'trial';
  END IF;
  
  -- Check subscription status
  SELECT subscription_status INTO user_status
  FROM public.users
  WHERE id = user_id;
  
  RETURN COALESCE(user_status, 'expired');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate permission levels
CREATE OR REPLACE FUNCTION public.validate_permission_level(permission_value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN permission_value IN ('no_access', 'view_only', 'full_access');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get permission level for a module
CREATE OR REPLACE FUNCTION public.get_module_permission(permissions JSONB, module_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(permissions->>module_key, 'no_access');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if user has permission for a module
CREATE OR REPLACE FUNCTION public.has_module_permission(
  user_id UUID, 
  module_key TEXT, 
  required_level TEXT DEFAULT 'view_only'
)
RETURNS BOOLEAN AS $$
DECLARE
  user_permission TEXT;
  permission_levels TEXT[] := ARRAY['no_access', 'view_only', 'full_access'];
  user_level_index INTEGER;
  required_level_index INTEGER;
BEGIN
  -- Get user's permission for the module
  SELECT get_module_permission(permissions, module_key) INTO user_permission
  FROM public.user_profiles
  WHERE user_profiles.user_id = user_id AND is_active = true
  LIMIT 1;
  
  -- If no active profile found, return false
  IF user_permission IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get level indices
  SELECT array_position(permission_levels, user_permission) INTO user_level_index;
  SELECT array_position(permission_levels, required_level) INTO required_level_index;
  
  -- Return true if user's level is >= required level
  RETURN user_level_index >= required_level_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX idx_users_trial_end_date ON public.users(trial_end_date);
CREATE INDEX idx_users_stripe_customer_id ON public.users(stripe_customer_id);
CREATE INDEX idx_users_stripe_subscription_id ON public.users(stripe_subscription_id);
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_is_active ON public.user_profiles(is_active);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_pin ON public.user_profiles(pin);
CREATE INDEX idx_user_invitations_company_id ON public.user_invitations(company_id);
CREATE INDEX idx_user_invitations_status ON public.user_invitations(status);
CREATE INDEX idx_user_invitations_expires_at ON public.user_invitations(expires_at);

-- JSONB indexes for permissions queries
CREATE INDEX idx_user_profiles_permissions_gin ON public.user_profiles USING GIN (permissions);
CREATE INDEX idx_user_invitations_permissions_gin ON public.user_invitations USING GIN (permissions);

-- Comments for documentation
COMMENT ON TABLE public.users IS 'Main users table extending auth.users with business data';
COMMENT ON TABLE public.user_profiles IS 'Multi-user profiles with granular permissions';
COMMENT ON TABLE public.user_invitations IS 'User invitations for multi-user functionality';

COMMENT ON COLUMN public.user_profiles.permissions IS 'JSONB object with module keys and permission levels (no_access, view_only, full_access)';
COMMENT ON COLUMN public.user_profiles.pin IS 'PIN code for profile switching security';
COMMENT ON COLUMN public.user_invitations.permissions IS 'JSONB object with module keys and permission levels (no_access, view_only, full_access)';

