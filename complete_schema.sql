
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

-- Clients table for storing client information
CREATE TABLE public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  vat_number TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'FR',
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotes table for storing quote information
CREATE TABLE public.quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  quote_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  project_categories TEXT[] DEFAULT '{}',
  custom_category TEXT,
  project_description TEXT,
  deadline DATE,
  total_amount DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 20.00,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_with_tax DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  validity_days INTEGER DEFAULT 30,
  notes TEXT,
  terms_conditions TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quote tasks table for storing individual tasks within a quote
CREATE TABLE public.quote_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quote materials table for storing materials associated with tasks
CREATE TABLE public.quote_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_task_id UUID REFERENCES public.quote_tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit TEXT DEFAULT 'piece',
  unit_price DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quote files table for storing files associated with quotes
CREATE TABLE public.quote_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quote drafts table for storing auto-saved drafts
CREATE TABLE public.quote_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  draft_data JSONB NOT NULL DEFAULT '{}',
  last_saved TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_drafts ENABLE ROW LEVEL SECURITY;

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

-- Clients policies
CREATE POLICY "Users can view own clients" ON public.clients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own clients" ON public.clients
  FOR ALL USING (user_id = auth.uid());

-- Quotes policies
CREATE POLICY "Users can view own quotes" ON public.quotes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own quotes" ON public.quotes
  FOR ALL USING (user_id = auth.uid());

-- Quote tasks policies
CREATE POLICY "Users can view own quote tasks" ON public.quote_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_tasks.quote_id 
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own quote tasks" ON public.quote_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_tasks.quote_id 
      AND quotes.user_id = auth.uid()
    )
  );

-- Quote materials policies
CREATE POLICY "Users can view own quote materials" ON public.quote_materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      JOIN public.quote_tasks qt ON q.id = qt.quote_id
      WHERE qt.id = quote_materials.quote_task_id 
      AND q.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own quote materials" ON public.quote_materials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      JOIN public.quote_tasks qt ON q.id = qt.quote_id
      WHERE qt.id = quote_materials.quote_task_id 
      AND q.user_id = auth.uid()
    )
  );

-- Quote files policies
CREATE POLICY "Users can view own quote files" ON public.quote_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_files.quote_id 
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own quote files" ON public.quote_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_files.quote_id 
      AND quotes.user_id = auth.uid()
    )
  );

-- Quote drafts policies
CREATE POLICY "Users can view own quote drafts" ON public.quote_drafts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own quote drafts" ON public.quote_drafts
  FOR ALL USING (user_id = auth.uid());

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

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quote_tasks_updated_at
  BEFORE UPDATE ON public.quote_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quote_materials_updated_at
  BEFORE UPDATE ON public.quote_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quote_drafts_updated_at
  BEFORE UPDATE ON public.quote_drafts
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

-- Function to generate unique quote number
CREATE OR REPLACE FUNCTION public.generate_quote_number(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  sequence_num INTEGER;
  quote_num TEXT;
BEGIN
  year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Get the next sequence number for this user and year
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 'DEV-' || year || '-(.+)') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.quotes
  WHERE user_id = generate_quote_number.user_id 
    AND quote_number LIKE 'DEV-' || year || '-%';
  
  -- Format: DEV-YYYY-XXXXXX (6 digits)
  quote_num := 'DEV-' || year || '-' || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN quote_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate quote totals
CREATE OR REPLACE FUNCTION public.calculate_quote_totals(quote_id UUID)
RETURNS VOID AS $$
DECLARE
  task_total DECIMAL(10,2);
  material_total DECIMAL(10,2);
  tax_rate DECIMAL(5,2);
  tax_amount DECIMAL(10,2);
BEGIN
  -- Calculate total from tasks
  SELECT COALESCE(SUM(total_price), 0) INTO task_total
  FROM public.quote_tasks
  WHERE quote_id = calculate_quote_totals.quote_id;
  
  -- Calculate total from materials
  SELECT COALESCE(SUM(qm.total_price), 0) INTO material_total
  FROM public.quote_materials qm
  JOIN public.quote_tasks qt ON qm.quote_task_id = qt.id
  WHERE qt.quote_id = calculate_quote_totals.quote_id;
  
  -- Get tax rate
  SELECT tax_rate INTO tax_rate
  FROM public.quotes
  WHERE id = calculate_quote_totals.quote_id;
  
  -- Calculate totals
  tax_amount := (task_total + material_total) * (tax_rate / 100);
  
  -- Update quote with calculated totals
  UPDATE public.quotes
  SET 
    total_amount = task_total + material_total,
    tax_amount = tax_amount,
    total_with_tax = task_total + material_total + tax_amount,
    updated_at = NOW()
  WHERE id = calculate_quote_totals.quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update quote expiration
CREATE OR REPLACE FUNCTION public.update_quote_expiration(quote_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.quotes
  SET 
    expires_at = created_at + (validity_days || ' days')::INTERVAL,
    updated_at = NOW()
  WHERE id = update_quote_expiration.quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if quote is expired
CREATE OR REPLACE FUNCTION public.is_quote_expired(quote_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT expires_at INTO expires_at
  FROM public.quotes
  WHERE id = quote_id;
  
  RETURN expires_at IS NOT NULL AND NOW() > expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-expire quotes
CREATE OR REPLACE FUNCTION public.auto_expire_quotes()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.quotes
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE status IN ('draft', 'sent') 
    AND expires_at IS NOT NULL 
    AND NOW() > expires_at;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
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

-- Client indexes
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_status ON public.clients(status);

-- Quote indexes
CREATE INDEX idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX idx_quotes_profile_id ON public.quotes(profile_id);
CREATE INDEX idx_quotes_client_id ON public.quotes(client_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_quotes_quote_number ON public.quotes(quote_number);
CREATE INDEX idx_quotes_created_at ON public.quotes(created_at);
CREATE INDEX idx_quotes_expires_at ON public.quotes(expires_at);

-- Quote task indexes
CREATE INDEX idx_quote_tasks_quote_id ON public.quote_tasks(quote_id);
CREATE INDEX idx_quote_tasks_order_index ON public.quote_tasks(order_index);

-- Quote material indexes
CREATE INDEX idx_quote_materials_task_id ON public.quote_materials(quote_task_id);
CREATE INDEX idx_quote_materials_order_index ON public.quote_materials(order_index);

-- Quote file indexes
CREATE INDEX idx_quote_files_quote_id ON public.quote_files(quote_id);

-- Quote draft indexes
CREATE INDEX idx_quote_drafts_user_id ON public.quote_drafts(user_id);
CREATE INDEX idx_quote_drafts_profile_id ON public.quote_drafts(profile_id);

-- JSONB indexes for permissions queries
CREATE INDEX idx_user_profiles_permissions_gin ON public.user_profiles USING GIN (permissions);
CREATE INDEX idx_user_invitations_permissions_gin ON public.user_invitations USING GIN (permissions);
CREATE INDEX idx_quote_drafts_draft_data_gin ON public.quote_drafts USING GIN (draft_data);

-- Comments for documentation
COMMENT ON TABLE public.users IS 'Main users table extending auth.users with business data';
COMMENT ON TABLE public.user_profiles IS 'Multi-user profiles with granular permissions';
COMMENT ON TABLE public.user_invitations IS 'User invitations for multi-user functionality';
COMMENT ON TABLE public.clients IS 'Client information for quotes and projects';
COMMENT ON TABLE public.quotes IS 'Main quotes table with project details and financial information';
COMMENT ON TABLE public.quote_tasks IS 'Individual tasks within a quote with pricing';
COMMENT ON TABLE public.quote_materials IS 'Materials associated with quote tasks';
COMMENT ON TABLE public.quote_files IS 'Files attached to quotes';
COMMENT ON TABLE public.quote_drafts IS 'Auto-saved draft data for quotes';

COMMENT ON COLUMN public.user_profiles.permissions IS 'JSONB object with module keys and permission levels (no_access, view_only, full_access)';
COMMENT ON COLUMN public.user_profiles.pin IS 'PIN code for profile switching security';
COMMENT ON COLUMN public.user_invitations.permissions IS 'JSONB object with module keys and permission levels (no_access, view_only, full_access)';
COMMENT ON COLUMN public.quotes.project_categories IS 'Array of project categories (e.g., ["plomberie", "électricité", "autre"])';
COMMENT ON COLUMN public.quotes.custom_category IS 'Custom category when "autre" is selected';
COMMENT ON COLUMN public.quotes.status IS 'Quote status: draft, sent, accepted, rejected, expired';
COMMENT ON COLUMN public.quotes.validity_days IS 'Number of days the quote is valid from creation date';
COMMENT ON COLUMN public.quote_tasks.unit_price IS 'Price per unit (hour, piece, meter, etc.)';
COMMENT ON COLUMN public.quote_materials.unit IS 'Unit of measurement (piece, meter, kg, etc.)';
COMMENT ON COLUMN public.quote_drafts.draft_data IS 'JSONB object containing all draft form data';

-- Create a cron job function to auto-expire quotes (if using pg_cron extension)
-- SELECT cron.schedule('auto-expire-quotes', '0 2 * * *', 'SELECT public.auto_expire_quotes();');

