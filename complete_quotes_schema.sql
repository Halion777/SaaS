-- Complete Quotes Schema for SaaS Application
-- This schema includes all components for quote creation and management
-- Note: Clients table schema is already created separately

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Company profiles table for storing company branding and information
CREATE TABLE IF NOT EXISTS public.company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    logo_path VARCHAR(500),
    logo_filename VARCHAR(255),
    logo_size INTEGER,
    logo_mime_type VARCHAR(100),
    signature_path VARCHAR(500),
    signature_filename VARCHAR(255),
    signature_size INTEGER,
    signature_mime_type VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    vat_number VARCHAR(100),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotes table for storing quote information
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    company_profile_id UUID REFERENCES public.company_profiles(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    title TEXT,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, accepted, rejected, expired
    project_categories TEXT[] DEFAULT '{}', -- Array of project categories (plomberie, electricite, etc.)
    custom_category TEXT, -- Custom category when "autre" is selected
    total_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    final_amount DECIMAL(15,2) DEFAULT 0,
    valid_until DATE,
    terms_conditions TEXT, -- Terms and conditions for the quote
    share_token VARCHAR(100) UNIQUE,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_date DATE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    reject_reason TEXT
);

-- Quote tasks table for storing individual tasks within a quote
CREATE TABLE IF NOT EXISTS public.quote_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'piece', -- hour, piece, meter, kg, etc.
    unit_price DECIMAL(15,2) DEFAULT 0,
    total_price DECIMAL(15,2) DEFAULT 0,
    duration DECIMAL(10,2), -- for time-based tasks
    duration_unit VARCHAR(20) DEFAULT 'minutes', -- minutes, hours, days, weeks
    pricing_type VARCHAR(50) DEFAULT 'flat', -- flat, hourly, per_unit
    hourly_rate DECIMAL(15,2), -- for hourly pricing
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quote materials table for storing materials associated with tasks
CREATE TABLE IF NOT EXISTS public.quote_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    quote_task_id UUID REFERENCES public.quote_tasks(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'piece',
    unit_price DECIMAL(15,2) DEFAULT 0,
    total_price DECIMAL(15,2) DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quote files table for storing files associated with quotes
CREATE TABLE IF NOT EXISTS public.quote_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    file_category VARCHAR(100), -- attachment, logo, signature, etc.
    uploaded_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quote drafts table for storing auto-saved drafts
CREATE TABLE IF NOT EXISTS public.quote_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    draft_data JSONB NOT NULL DEFAULT '{}',
    last_saved TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);



-- Quote financial configs table for detailed financial settings
CREATE TABLE IF NOT EXISTS public.quote_financial_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    vat_config JSONB DEFAULT '{}', -- rate, amount, is_inclusive
    advance_config JSONB DEFAULT '{}', -- percentage, amount, due_date
    marketing_banner JSONB DEFAULT '{}', -- text, color, position
    payment_terms JSONB DEFAULT '{}', -- net_days, early_payment_discount
    discount_config JSONB DEFAULT '{}', -- rate, amount, type
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quote signatures table for electronic signatures
CREATE TABLE IF NOT EXISTS public.quote_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    signer_name VARCHAR(255) NOT NULL,
    signer_email VARCHAR(255),
    signature_data TEXT, -- Base64 encoded signature or file path
    signature_mode VARCHAR(50) DEFAULT 'draw', -- draw, upload, typed
    signature_type VARCHAR(50) DEFAULT 'client', -- client, company, both
    signature_file_path VARCHAR(500),
    signature_filename VARCHAR(255),
    signature_size INTEGER,
    signature_mime_type VARCHAR(100),
    customer_comment TEXT, -- Customer comment when signing the quote
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predefined tasks table for reusable task templates
CREATE TABLE IF NOT EXISTS public.predefined_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    default_duration DECIMAL(10,2),
    default_price DECIMAL(15,2),
    icon_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_global BOOLEAN DEFAULT false, -- available to all users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predefined materials table for reusable material templates
CREATE TABLE IF NOT EXISTS public.predefined_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    default_unit VARCHAR(50),
    default_price DECIMAL(15,2),
    icon_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_global BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quote workflow history table for audit trail
CREATE TABLE IF NOT EXISTS public.quote_workflow_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- created, updated, sent, viewed, etc.
    status_from VARCHAR(50),
    status_to VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quote shares table for public sharing configuration
CREATE TABLE IF NOT EXISTS public.quote_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    share_token VARCHAR(100) UNIQUE NOT NULL,
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);




-- Storage files table for centralized file management
CREATE TABLE IF NOT EXISTS public.storage_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    file_category VARCHAR(100), -- logo, signature, attachment, etc.
    storage_bucket VARCHAR(100),
    is_public BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id ON public.company_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_profile_id ON public.company_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_is_default ON public.company_profiles(is_default);

CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_profile_id ON public.quotes(profile_id);
CREATE INDEX IF NOT EXISTS idx_quotes_company_profile_id ON public.quotes(company_profile_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON public.quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON public.quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_share_token ON public.quotes(share_token);
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON public.quotes(valid_until);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_quotes_is_public ON public.quotes(is_public);


CREATE INDEX IF NOT EXISTS idx_quote_tasks_quote_id ON public.quote_tasks(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_tasks_order_index ON public.quote_tasks(order_index);
CREATE INDEX IF NOT EXISTS idx_quote_tasks_pricing_type ON public.quote_tasks(pricing_type);

CREATE INDEX IF NOT EXISTS idx_quote_materials_quote_id ON public.quote_materials(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_materials_quote_task_id ON public.quote_materials(quote_task_id);
CREATE INDEX IF NOT EXISTS idx_quote_materials_order_index ON public.quote_materials(order_index);

CREATE INDEX IF NOT EXISTS idx_quote_files_quote_id ON public.quote_files(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_files_file_category ON public.quote_files(file_category);

CREATE INDEX IF NOT EXISTS idx_quote_drafts_user_id ON public.quote_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_drafts_profile_id ON public.quote_drafts(profile_id);
CREATE INDEX IF NOT EXISTS idx_quote_drafts_draft_data_gin ON public.quote_drafts USING GIN (draft_data);





CREATE INDEX IF NOT EXISTS idx_quote_financial_configs_quote_id ON public.quote_financial_configs(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_financial_configs_vat_config_gin ON public.quote_financial_configs USING GIN (vat_config);
CREATE INDEX IF NOT EXISTS idx_quote_financial_configs_discount_config_gin ON public.quote_financial_configs USING GIN (discount_config);

CREATE INDEX IF NOT EXISTS idx_quote_signatures_quote_id ON public.quote_signatures(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_signatures_signer_email ON public.quote_signatures(signer_email);

CREATE INDEX IF NOT EXISTS idx_predefined_tasks_user_id ON public.predefined_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_predefined_tasks_category ON public.predefined_tasks(category);
CREATE INDEX IF NOT EXISTS idx_predefined_tasks_is_global ON public.predefined_tasks(is_global);

CREATE INDEX IF NOT EXISTS idx_predefined_materials_user_id ON public.predefined_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_predefined_materials_category ON public.predefined_materials(category);
CREATE INDEX IF NOT EXISTS idx_predefined_materials_is_global ON public.predefined_materials(is_global);

CREATE INDEX IF NOT EXISTS idx_quote_workflow_history_quote_id ON public.quote_workflow_history(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_workflow_history_action ON public.quote_workflow_history(action);
CREATE INDEX IF NOT EXISTS idx_quote_workflow_history_created_at ON public.quote_workflow_history(created_at);

CREATE INDEX IF NOT EXISTS idx_quote_shares_quote_id ON public.quote_shares(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_shares_share_token ON public.quote_shares(share_token);

CREATE INDEX IF NOT EXISTS idx_quote_access_logs_quote_id ON public.quote_access_logs(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_access_logs_action ON public.quote_access_logs(action);
CREATE INDEX IF NOT EXISTS idx_quote_access_logs_accessed_at ON public.quote_access_logs(accessed_at);

CREATE INDEX IF NOT EXISTS idx_quote_events_quote_id_type ON public.quote_events(quote_id, type);
CREATE INDEX IF NOT EXISTS idx_quote_events_timestamp ON public.quote_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_quote_categories_user_id ON public.quote_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_categories_is_active ON public.quote_categories(is_active);

CREATE INDEX IF NOT EXISTS idx_quote_tags_quote_id ON public.quote_tags(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_tags_tag ON public.quote_tags(tag);

CREATE INDEX IF NOT EXISTS idx_storage_files_user_id ON public.storage_files(user_id);
CREATE INDEX IF NOT EXISTS idx_storage_files_file_category ON public.storage_files(file_category);
CREATE INDEX IF NOT EXISTS idx_storage_files_is_public ON public.storage_files(is_public);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_drafts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.quote_financial_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predefined_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predefined_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_workflow_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_profiles
CREATE POLICY "Users can manage their own company profiles" ON public.company_profiles
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for quotes
CREATE POLICY "Users can manage their own quotes" ON public.quotes
    FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Public can view shared quotes" ON public.quotes
    FOR SELECT USING (is_public = true AND share_token IS NOT NULL);

-- RLS Policies for quote_tasks
CREATE POLICY "Users can manage their own quote tasks" ON public.quote_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.quotes 
            WHERE quotes.id = quote_tasks.quote_id 
            AND quotes.user_id = auth.uid()
        )
    );

-- RLS Policies for quote_materials
CREATE POLICY "Users can manage their own quote materials" ON public.quote_materials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.quotes 
            WHERE quotes.id = quote_materials.quote_id 
            AND quotes.user_id = auth.uid()
        )
    );

-- RLS Policies for quote_files
CREATE POLICY "Users can manage their own quote files" ON public.quote_files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.quotes 
            WHERE quotes.id = quote_files.quote_id 
            AND quotes.user_id = auth.uid()
        )
    );

-- RLS Policies for quote_drafts
CREATE POLICY "Users can manage their own quote drafts" ON public.quote_drafts
    FOR ALL USING (user_id = auth.uid());



-- RLS Policies for quote_financial_configs
CREATE POLICY "Users can manage their own quote financial configs" ON public.quote_financial_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.quotes 
            WHERE quotes.id = quote_financial_configs.quote_id 
            AND quotes.user_id = auth.uid()
        )
    );

-- RLS Policies for quote_signatures
CREATE POLICY "Users can manage their own quote signatures" ON public.quote_signatures
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.quotes 
            WHERE quotes.id = quote_signatures.quote_id 
            AND quotes.user_id = auth.uid()
        )
    );

-- RLS Policies for predefined_tasks
CREATE POLICY "Users can manage their own predefined tasks" ON public.predefined_tasks
    FOR ALL USING (user_id = auth.uid() OR is_global = true);

-- RLS Policies for predefined_materials
CREATE POLICY "Users can manage their own predefined materials" ON public.predefined_materials
    FOR ALL USING (user_id = auth.uid() OR is_global = true);

-- RLS Policies for quote_workflow_history
CREATE POLICY "Users can view their own quote workflow history" ON public.quote_workflow_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quotes 
            WHERE quotes.id = quote_workflow_history.quote_id 
            AND quotes.user_id = auth.uid()
        )
    );

-- RLS Policies for quote_shares
CREATE POLICY "Users can manage their own quote shares" ON public.quote_shares
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.quotes 
            WHERE quotes.id = quote_shares.quote_id 
            AND quotes.user_id = auth.uid()
        )
    );

-- RLS Policies for quote_access_logs
CREATE POLICY "Users can view their own quote access logs" ON public.quote_access_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quotes 
            WHERE quotes.id = quote_access_logs.quote_id 
            AND quotes.user_id = auth.uid()
        )
    );

-- RLS Policies for quote_categories
CREATE POLICY "Users can manage their own quote categories" ON public.quote_categories
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for quote_tags
CREATE POLICY "Users can manage their own quote tags" ON public.quote_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.quotes 
            WHERE quotes.id = quote_tags.quote_id 
            AND quotes.user_id = auth.uid()
        )
    );

-- RLS Policies for storage_files
CREATE POLICY "Users can manage their own storage files" ON public.storage_files
    FOR ALL USING (user_id = auth.uid() OR is_public = true);

-- Storage Bucket RLS Policies (CRITICAL for file uploads)
-- Company Assets Bucket - Allow users to upload to their own folder
CREATE POLICY "Users can upload to their own company assets folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'company-assets' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view their own company assets" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'company-assets' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their own company assets" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'company-assets' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own company assets" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'company-assets' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Quote Files Bucket
CREATE POLICY "Users can upload to their own quote files folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'quote-files' AND 
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.quotes WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own quote files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'quote-files' AND 
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.quotes WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own quote files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'quote-files' AND 
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.quotes WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own quote files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'quote-files' AND 
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.quotes WHERE user_id = auth.uid()
        )
    );

-- Signatures Bucket
CREATE POLICY "Users can upload to their own signatures folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'signatures' AND 
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.quotes WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own signatures" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'signatures' AND 
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.quotes WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own signatures" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'signatures' AND 
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.quotes WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own signatures" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'signatures' AND 
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.quotes WHERE user_id = auth.uid()
        )
    );

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at columns
CREATE TRIGGER update_company_profiles_updated_at 
    BEFORE UPDATE ON public.company_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at 
    BEFORE UPDATE ON public.quotes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_tasks_updated_at 
    BEFORE UPDATE ON public.quote_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_materials_updated_at 
    BEFORE UPDATE ON public.quote_materials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_drafts_updated_at 
    BEFORE UPDATE ON public.quote_drafts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



CREATE TRIGGER update_quote_financial_configs_updated_at 
    BEFORE UPDATE ON public.quote_financial_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_predefined_tasks_updated_at 
    BEFORE UPDATE ON public.predefined_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_predefined_materials_updated_at 
    BEFORE UPDATE ON public.predefined_materials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_categories_updated_at 
    BEFORE UPDATE ON public.quote_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_storage_files_updated_at 
    BEFORE UPDATE ON public.storage_files 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for quote management
CREATE OR REPLACE FUNCTION generate_quote_number(user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    next_number INTEGER;
    quote_number VARCHAR;
BEGIN
    -- Get the next sequential number for this user
    SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 9) AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.quotes
    WHERE user_id = $1;
    
    -- Format: DEV-YYYY-XXXXXX (e.g., DEV-2024-000001)
    quote_number := 'DEV-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN quote_number;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_quote_totals(quote_id UUID)
RETURNS VOID AS $$
DECLARE
    subtotal DECIMAL(15,2);
    tax_rate DECIMAL(5,4);
    discount_rate DECIMAL(5,4);
BEGIN
    -- Calculate subtotal from tasks and materials
    SELECT COALESCE(SUM(total_price), 0)
    INTO subtotal
    FROM (
        SELECT total_price FROM public.quote_tasks WHERE quote_id = $1
        UNION ALL
        SELECT total_price FROM public.quote_materials WHERE quote_id = $1
    ) AS items;
    
    -- Get tax and discount rates from financial config
    SELECT 
        COALESCE((vat_config->>'rate')::DECIMAL(5,4), 0),
        COALESCE((discount_config->>'rate')::DECIMAL(5,4), 0)
    INTO tax_rate, discount_rate
    FROM public.quote_financial_configs
    WHERE quote_id = $1;
    
    -- Update quote with calculated amounts
    UPDATE public.quotes 
    SET 
        total_amount = subtotal,
        tax_amount = subtotal * tax_rate,
        discount_amount = subtotal * discount_rate,
        final_amount = subtotal + (subtotal * tax_rate) - (subtotal * discount_rate)
    WHERE id = $1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_quote_expiration(quote_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.quotes 
    SET status = 'expired'
    WHERE id = $1 
    AND valid_until < CURRENT_DATE 
    AND status IN ('draft', 'sent');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_quote_expired(quote_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    quote_valid_until DATE;
BEGIN
    SELECT valid_until INTO quote_valid_until
    FROM public.quotes
    WHERE id = $1;
    
    RETURN quote_valid_until < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-expire quotes when valid_until date passes
CREATE OR REPLACE FUNCTION public.auto_expire_quotes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update quotes that have passed their valid_until date
  UPDATE public.quotes 
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE 
    status IN ('sent', 'draft') 
    AND valid_until IS NOT NULL 
    AND valid_until < NOW();

  -- Log events for expired quotes
  INSERT INTO public.quote_events (quote_id, type, meta, user_id)
  SELECT 
    id,
    'quote_expired',
    jsonb_build_object(
      'expired_at', NOW(),
      'valid_until', valid_until
    ),
    NULL
  FROM public.quotes 
  WHERE 
    status = 'expired' 
    AND updated_at >= NOW() - INTERVAL '1 minute';
END;
$$;

-- Function to handle client actions (accept/reject) and update quote status
CREATE OR REPLACE FUNCTION public.update_quote_status_on_client_action(
  p_quote_id UUID,
  p_action TEXT,
  p_client_signature JSONB DEFAULT NULL,
  p_rejection_reason TEXT DEFAULT NULL,
  p_share_token TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quote_status TEXT;
  v_client_signature_id UUID;
  v_event_meta JSONB;
BEGIN
  -- Validate action
  IF p_action NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid action: %', p_action;
  END IF;

  -- Get current quote status
  SELECT status INTO v_quote_status
  FROM public.quotes
  WHERE id = p_quote_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;

  -- Check if quote can be modified
  IF v_quote_status NOT IN ('sent', 'draft') THEN
    RAISE EXCEPTION 'Quote cannot be modified in current status: %', v_quote_status;
  END IF;

  -- Update quote status
  UPDATE public.quotes
  SET 
    status = p_action,
    updated_at = NOW()
  WHERE id = p_quote_id;

  -- Handle client signature if accepting
  IF p_action = 'accepted' AND p_client_signature IS NOT NULL THEN
    -- Save client signature
    INSERT INTO public.quote_signatures (
      quote_id,
      signer_email,
      signer_name,
      signature_type,
      signature_data,
      signature_mode,
      customer_comment,
      signed_at
    ) VALUES (
      p_quote_id,
      p_client_signature->>'clientEmail',
      p_client_signature->>'clientName',
      'client',
      p_client_signature->>'signature',
      'draw',
      p_client_signature->>'clientComment',
      COALESCE(p_client_signature->>'signedAt', NOW())
    ) RETURNING id INTO v_client_signature_id;

    v_event_meta := jsonb_build_object(
      'signature_id', v_client_signature_id,
      'client_email', p_client_signature->>'clientEmail',
      'client_name', p_client_signature->>'clientName'
    );
  ELSIF p_action = 'rejected' THEN
    v_event_meta := jsonb_build_object(
      'rejection_reason', p_rejection_reason,
      'share_token', p_share_token
    );
  END IF;

  -- Log the event
  INSERT INTO public.quote_events (
    quote_id,
    type,
    meta,
    user_id
  ) VALUES (
    p_quote_id,
    'quote_' || p_action,
    v_event_meta,
    NULL
  );

  -- Log to workflow history
  INSERT INTO public.quote_workflow_history (
    quote_id,
    user_id,
    action,
    status_from,
    status_to,
    metadata
  ) VALUES (
    p_quote_id,
    NULL,
    'quote_' || p_action,
    'sent',
    p_action,
    v_event_meta
  );

  -- Log to access logs for tracking
  INSERT INTO public.quote_access_logs (
    quote_id,
    share_token,
    action
  ) VALUES (
    p_quote_id,
    p_share_token,
    p_action
  );

  -- Update quote_shares table access count and last_accessed
  IF p_share_token IS NOT NULL THEN
    UPDATE public.quote_shares
    SET 
      access_count = access_count + 1,
      last_accessed = NOW()
    WHERE quote_id = p_quote_id AND share_token = p_share_token;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'action', p_action,
    'quote_id', p_quote_id,
    'signature_id', v_client_signature_id
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.auto_expire_quotes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_quote_status_on_client_action(UUID, TEXT, JSONB, TEXT, TEXT) TO authenticated;

-- Create index for quote access logs to improve tracking performance
CREATE INDEX IF NOT EXISTS idx_quote_access_logs_quote_id ON public.quote_access_logs(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_access_logs_action ON public.quote_access_logs(action);
CREATE INDEX IF NOT EXISTS idx_quote_access_logs_accessed_at ON public.quote_access_logs(accessed_at);

-- Create index for quote events to improve status tracking performance
CREATE INDEX IF NOT EXISTS idx_quote_events_quote_id_type ON public.quote_events(quote_id, type);
CREATE INDEX IF NOT EXISTS idx_quote_events_timestamp ON public.quote_events(timestamp);

-- Add RLS policies for quote_access_logs
ALTER TABLE public.quote_access_logs ENABLE ROW LEVEL SECURITY;

-- Allow artisans to view access logs for their quotes
CREATE POLICY "Artisans can view access logs for their quotes" ON public.quote_access_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_access_logs.quote_id
      AND q.user_id = auth.uid()
    )
  );

-- Allow system to insert access logs (for tracking)
CREATE POLICY "System can insert access logs" ON public.quote_access_logs
  FOR INSERT WITH CHECK (true);

-- Add RLS policies for quote_events
ALTER TABLE public.quote_events ENABLE ROW LEVEL SECURITY;

-- Allow artisans to view events for their quotes
CREATE POLICY "Artisans can view events for their quotes" ON public.quote_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_events.quote_id
      AND q.user_id = auth.uid()
    )
  );

-- Allow system to insert events (for client actions)
CREATE POLICY "System can insert events" ON public.quote_events
  FOR INSERT WITH CHECK (true);

-- Add RLS policies for quote_signatures
ALTER TABLE public.quote_signatures ENABLE ROW LEVEL SECURITY;

-- Allow artisans to view signatures for their quotes
CREATE POLICY "Artisans can view signatures for their quotes" ON public.quote_signatures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_signatures.quote_id
      AND q.user_id = auth.uid()
    )
  );

-- Allow system to insert client signatures
CREATE POLICY "System can insert client signatures" ON public.quote_signatures
  FOR INSERT WITH CHECK (true);

-- Add RLS policies for quote_workflow_history
ALTER TABLE public.quote_workflow_history ENABLE ROW LEVEL SECURITY;

-- Allow artisans to view workflow history for their quotes
CREATE POLICY "Artisans can view workflow history for their quotes" ON public.quote_workflow_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_workflow_history.quote_id
      AND q.user_id = auth.uid()
    )
  );

-- Allow system to insert workflow events
CREATE POLICY "System can insert workflow events" ON public.quote_workflow_history
  FOR INSERT WITH CHECK (true);

-- Add RLS policies for quote_shares
ALTER TABLE public.quote_shares ENABLE ROW LEVEL SECURITY;

-- Allow artisans to view share tokens for their quotes
CREATE POLICY "Artisans can view share tokens for their quotes" ON public.quote_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_shares.quote_id
      AND q.user_id = auth.uid()
    )
  );

-- Allow system to insert share tokens
CREATE POLICY "System can insert share tokens" ON public.quote_shares
  FOR INSERT WITH CHECK (true);

-- Allow system to update share tokens (for access count updates)
CREATE POLICY "System can update share tokens" ON public.quote_shares
  FOR UPDATE USING (true);

-- Schedule auto-expire quotes function to run daily at 2 AM
SELECT cron.schedule('auto-expire-quotes', '0 2 * * *', 'SELECT public.auto_expire_quotes();');

CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS VARCHAR AS $$
BEGIN
    RETURN 'qt_' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_quote_access(quote_id UUID, share_token VARCHAR, action VARCHAR)
RETURNS VOID AS $$
BEGIN
    -- Log the access
    INSERT INTO public.quote_access_logs (quote_id, share_token, action)
    VALUES ($1, $2, $3);
    
    -- Update share access count
    UPDATE public.quote_shares 
    SET 
        access_count = access_count + 1,
        last_accessed = NOW()
    WHERE share_token = $2;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_default_company_profile(user_id UUID, profile_id UUID)
RETURNS UUID AS $$
DECLARE
    company_profile_id UUID;
BEGIN
    INSERT INTO public.company_profiles (user_id, profile_id, company_name, is_default)
    VALUES ($1, $2, 'My Company', true)
    RETURNING id INTO company_profile_id;
    
    RETURN company_profile_id;
END;
$$ LANGUAGE plpgsql;

-- Add comprehensive comments for documentation
COMMENT ON TABLE public.company_profiles IS 'Stores company branding and information for quotes';
COMMENT ON TABLE public.quotes IS 'Main quotes table with project details and financial information';
COMMENT ON TABLE public.quote_tasks IS 'Individual tasks within a quote with pricing and duration';
COMMENT ON TABLE public.quote_materials IS 'Materials associated with quote tasks';
COMMENT ON TABLE public.quote_files IS 'Files attached to quotes including logos and signatures';
COMMENT ON TABLE public.quote_drafts IS 'Auto-saved draft data for quotes';

COMMENT ON TABLE public.quote_financial_configs IS 'Detailed financial settings for quotes';
COMMENT ON TABLE public.quote_signatures IS 'Electronic signatures for quote approval';
COMMENT ON TABLE public.predefined_tasks IS 'Reusable task templates for quotes';
COMMENT ON TABLE public.predefined_materials IS 'Reusable material templates for quotes';
COMMENT ON TABLE public.quote_workflow_history IS 'Audit trail of quote lifecycle events';
COMMENT ON TABLE public.quote_shares IS 'Public sharing configuration for quotes';
COMMENT ON TABLE public.quote_access_logs IS 'Analytics on quote access and views';
COMMENT ON TABLE public.quote_categories IS 'Organization categories for quotes';
COMMENT ON TABLE public.storage_files IS 'Centralized file storage metadata';

-- Column comments for the new frontend fields
COMMENT ON COLUMN public.quotes.project_categories IS 'Array of project categories (e.g., ["plomberie", "electricite", "menuiserie", "autre"])';
COMMENT ON COLUMN public.quotes.custom_category IS 'Custom category when "autre" is selected from predefined categories';
COMMENT ON COLUMN public.quotes.terms_conditions IS 'Terms and conditions text for the quote';

-- Column comments for quote signatures
COMMENT ON COLUMN public.quote_signatures.customer_comment IS 'Customer comment when signing the quote';

-- Create a scheduled job to auto-expire quotes (if using pg_cron extension)
-- SELECT cron.schedule('auto-expire-quotes', '0 1 * * *', 'SELECT auto_expire_quotes();');

-- ================================
-- Quotes Follow-up Backend Schema
-- Backend-only: no frontend changes required
-- ================================

-- Rules for follow-ups per user (delays, quiet hours, max stages)
CREATE TABLE IF NOT EXISTS public.quote_follow_up_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    -- Stage delays in days, e.g., {3,7,14}
    stage_delays INTEGER[] NOT NULL DEFAULT '{3,7,14}',
    max_stages SMALLINT NOT NULL DEFAULT 3,
    default_channel VARCHAR(20) NOT NULL DEFAULT 'email',
    timezone TEXT DEFAULT 'UTC',
    quiet_hours_start SMALLINT, -- 0-23 local hour
    quiet_hours_end SMALLINT,   -- 0-23 local hour
    weekdays JSONB DEFAULT '[1,2,3,4,5]'::jsonb, -- 1=Mon ... 7=Sun
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id)
);

-- Scheduled follow-ups for quotes
CREATE TABLE IF NOT EXISTS public.quote_follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    stage SMALLINT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    next_attempt_at TIMESTAMP WITH TIME ZONE,
    attempts SMALLINT NOT NULL DEFAULT 0,
    max_attempts SMALLINT NOT NULL DEFAULT 3,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, scheduled, sent, failed, stopped
    channel VARCHAR(20) NOT NULL DEFAULT 'email',  -- email (others later)
    template_subject TEXT,
    template_html TEXT,
    template_text TEXT,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);



-- Quote events timeline
CREATE TABLE IF NOT EXISTS public.quote_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    user_id UUID NULL, -- Allow null for system events
    type VARCHAR(50) NOT NULL, -- sent, viewed, followup_scheduled, followup_sent, delivered, opened, bounced, accepted, rejected
    share_token VARCHAR(100), -- Add dedicated column for share token tracking
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    constraint quote_events_pkey primary key (id),
    constraint quote_events_quote_id_fkey foreign KEY (quote_id) references quotes (id) on delete CASCADE,
    constraint quote_events_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
    constraint quote_events_user_id_check check (
      user_id is not null or 
      (user_id is null and type in ('email_sent', 'system_event', 'quote_created', 'quote_updated'))
    )
) TABLESPACE pg_default;

-- Indexes for follow-up subsystem
CREATE INDEX IF NOT EXISTS idx_quote_follow_up_rules_user_id ON public.quote_follow_up_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_follow_ups_quote_id ON public.quote_follow_ups(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_follow_ups_user_id ON public.quote_follow_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_follow_ups_scheduled_at ON public.quote_follow_ups(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_quote_events_quote_id ON public.quote_events(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_events_type ON public.quote_events(type);
CREATE INDEX IF NOT EXISTS idx_quote_events_share_token ON public.quote_events(share_token);

-- Enable RLS
ALTER TABLE public.quote_follow_up_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users manage their own follow-up rules" ON public.quote_follow_up_rules
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users manage their own follow-ups" ON public.quote_follow_ups
  FOR ALL USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users manage their own outbox" ON public.email_outbox
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users view their own quote events" ON public.quote_events
  FOR SELECT USING (
    user_id = auth.uid() OR 
    user_id IS NULL -- Allow viewing system events
  );

CREATE POLICY "Users insert their own quote events" ON public.quote_events
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR 
    (user_id IS NULL AND type IN ('email_sent', 'system_event', 'quote_created', 'quote_updated'))
  );

CREATE POLICY "Users can update their own quote events" ON public.quote_events
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    user_id IS NULL -- Allow updating system events
  );

CREATE POLICY "Users can delete their own quote events" ON public.quote_events
  FOR DELETE USING (
    user_id = auth.uid() OR 
    user_id IS NULL -- Allow deleting system events
  );

-- Triggers for updated_at
CREATE TRIGGER update_quote_follow_up_rules_updated_at
  BEFORE UPDATE ON public.quote_follow_up_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_follow_ups_updated_at
  BEFORE UPDATE ON public.quote_follow_ups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



-- Helper: get delay for a given stage with user defaults
CREATE OR REPLACE FUNCTION public.get_follow_up_delay_days(p_user_id UUID, p_stage SMALLINT)
RETURNS INTEGER AS $$
DECLARE
  delays INTEGER[];
  d INTEGER;
BEGIN
  SELECT stage_delays INTO delays
  FROM public.quote_follow_up_rules
  WHERE user_id = p_user_id;

  IF delays IS NULL OR array_length(delays, 1) IS NULL THEN
    delays := '{3,7,14}';
  END IF;

  IF p_stage <= array_length(delays, 1) THEN
    d := delays[p_stage];
  ELSE
    d := 14; -- fallback
  END IF;

  RETURN d;
END;
$$ LANGUAGE plpgsql;

-- Create a follow-up for a quote at a specific stage
CREATE OR REPLACE FUNCTION public.create_follow_up_for_quote(p_quote_id UUID, p_stage SMALLINT)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_client_id UUID;
  v_delay_days INTEGER;
  v_follow_up_id UUID;
BEGIN
  SELECT user_id, client_id INTO v_user_id, v_client_id
  FROM public.quotes WHERE id = p_quote_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Quote not found: %', p_quote_id;
  END IF;

  v_delay_days := public.get_follow_up_delay_days(v_user_id, p_stage);

  INSERT INTO public.quote_follow_ups (
    quote_id, user_id, client_id, stage, scheduled_at, status, channel
  ) VALUES (
    p_quote_id, v_user_id, v_client_id, p_stage, NOW() + make_interval(days => v_delay_days), 'pending', 'email'
  ) RETURNING id INTO v_follow_up_id;

  INSERT INTO public.quote_events (quote_id, user_id, type, meta)
  VALUES (p_quote_id, v_user_id, 'followup_scheduled', jsonb_build_object('stage', p_stage, 'in_days', v_delay_days));

  RETURN v_follow_up_id;
END;
$$ LANGUAGE plpgsql;

-- On quote status change to 'sent', create stage 1 follow-up
CREATE OR REPLACE FUNCTION public.on_quote_status_sent()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.create_follow_up_for_quote(NEW.id, 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_on_quote_sent ON public.quotes;
CREATE TRIGGER trg_on_quote_sent
  AFTER UPDATE ON public.quotes
  FOR EACH ROW
  WHEN (NEW.status = 'sent' AND (OLD.status IS DISTINCT FROM NEW.status))
  EXECUTE FUNCTION public.on_quote_status_sent();

-- Stop follow-ups when quote is accepted or rejected
CREATE OR REPLACE FUNCTION public.on_quote_finalized()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.quote_follow_ups SET status = 'stopped'
  WHERE quote_id = NEW.id AND status IN ('pending','scheduled');

  INSERT INTO public.quote_events (quote_id, user_id, type)
  VALUES (NEW.id, NEW.user_id, CASE WHEN NEW.status = 'accepted' THEN 'accepted' ELSE 'rejected' END);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_on_quote_finalized ON public.quotes;
CREATE TRIGGER trg_on_quote_finalized
  AFTER UPDATE ON public.quotes
  FOR EACH ROW
  WHEN (NEW.status IN ('accepted','rejected') AND (OLD.status IS DISTINCT FROM NEW.status))
  EXECUTE FUNCTION public.on_quote_finalized();

-- Convenience RPCs
CREATE OR REPLACE FUNCTION public.schedule_all_followups_for_quote(p_quote_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_max SMALLINT;
  i SMALLINT := 1;
BEGIN
  SELECT user_id INTO v_user_id FROM public.quotes WHERE id = p_quote_id;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Quote not found: %', p_quote_id;
  END IF;
  SELECT COALESCE(max_stages, 3) INTO v_max FROM public.quote_follow_up_rules WHERE user_id = v_user_id;
  IF v_max IS NULL THEN v_max := 3; END IF;

  WHILE i <= v_max LOOP
    PERFORM public.create_follow_up_for_quote(p_quote_id, i);
    i := i + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.quote_follow_up_rules IS 'Per-user rules controlling quote follow-up scheduling';
COMMENT ON TABLE public.quote_follow_ups IS 'Scheduled follow-up actions for quotes';
COMMENT ON TABLE public.email_outbox IS 'Outbox/queue for transactional emails to be sent by a worker';
COMMENT ON TABLE public.quote_events IS 'Timeline of events related to quotes (follow-ups, deliveries, opens, etc.)';





-- Email templates table for managing all email communications
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    template_type VARCHAR(100) NOT NULL, -- quote_sent, followup_not_viewed, followup_viewed_no_action, client_accepted, client_rejected, general_followup
    template_name VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT NOT NULL,
    variables JSONB DEFAULT '{}', -- Available variables for personalization
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- Default template for the type
    language VARCHAR(10) DEFAULT 'fr', -- fr, en, nl
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email template variables reference table
CREATE TABLE IF NOT EXISTS public.email_template_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variable_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    example_value TEXT,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default email template variables
INSERT INTO public.email_template_variables (variable_name, description, example_value, is_required) VALUES
('client_name', 'Client full name', 'Jean Dupont', true),
('client_first_name', 'Client first name only', 'Jean', false),
('quote_number', 'Quote reference number', 'Q-2024-001', true),
('quote_title', 'Project title from quote', 'Rénovation salle de bain', true),
('quote_amount', 'Total quote amount', '2,500.00€', true),
('company_name', 'Your company name', 'Maçonnerie Pro', true),
('sender_name', 'Name of person sending email', 'Marie Martin', false),
('sender_email', 'Email of person sending', 'marie@maconnerie-pro.fr', false),
('quote_link', 'Direct link to view quote', 'https://app.com/quote/abc123', true),
('valid_until', 'Quote validity date', '31 décembre 2024', false),
('days_since_sent', 'Days since quote was sent', '3', false),
('next_followup_date', 'Suggested next follow-up date', '15 janvier 2025', false);

-- Insert default email templates for all scenarios
INSERT INTO public.email_templates (template_type, template_name, subject, html_content, text_content, variables, is_default, language) VALUES
-- Quote Sent Template
('quote_sent', 'Devis envoyé', 
 'Devis {quote_number} - {quote_title}',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Devis {quote_number}</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{quote_title}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Votre devis est prêt !</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0; font-weight: bold; color: #333;">Montant : {quote_amount}</p>
      <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Valable jusqu''au {valid_until}</p>
    </div>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">Voir le devis</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>',
 'Devis {quote_number} - {quote_title}

Bonjour {client_name},

Votre devis est prêt !
Montant : {quote_amount}
Valable jusqu''au {valid_until}

Voir le devis : {quote_link}

{company_name}',
 '{"client_name": true, "quote_number": true, "quote_title": true, "quote_amount": true, "quote_link": true, "valid_until": true, "company_name": true}',
 true, 'fr'),

-- Follow-up: Client Not Opened Email
('followup_not_viewed', 'Relance - Email non ouvert', 
 'Devis {quote_number} - Avez-vous reçu notre proposition ?',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Relance</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Devis {quote_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Nous avons envoyé notre devis il y a <strong>{days_since_sent} jours</strong>.</p>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Avez-vous bien reçu notre proposition ?</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);">Voir le devis</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>',
 'Relance - Devis {quote_number}

Bonjour {client_name},

Nous avons envoyé notre devis il y a {days_since_sent} jours.
Avez-vous bien reçu notre proposition ?

Voir le devis : {quote_link}

{company_name}',
 '{"client_name": true, "quote_number": true, "days_since_sent": true, "quote_link": true, "company_name": true}',
 true, 'fr'),

-- Follow-up: Client Viewed But No Action
('followup_viewed_no_action', 'Relance - Vue sans action', 
 'Devis {quote_number} - Des questions sur notre proposition ?',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Relance</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Devis {quote_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Vous avez consulté notre devis il y a <strong>{days_since_sent} jours</strong>.</p>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Des questions ? Nous sommes là pour vous aider !</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #feca57; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(254, 202, 87, 0.3);">Relire le devis</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>',
 'Relance - Devis {quote_number}

Bonjour {client_name},

Vous avez consulté notre devis il y a {days_since_sent} jours.
Des questions ? Nous sommes là pour vous aider !

Relire le devis : {quote_link}

{company_name}',
 '{"client_name": true, "quote_number": true, "days_since_sent": true, "quote_link": true, "company_name": true}',
 true, 'fr'),

-- Client Accepted Quote
('client_accepted', 'Devis accepté', 
 'Devis {quote_number} accepté - Merci !',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Devis accepté !</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{quote_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Merci d''avoir accepté notre devis !</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #48dbfb;">
      <p style="margin: 0; font-weight: bold; color: #333;">Montant accepté : {quote_amount}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Notre équipe vous contacte bientôt pour la suite !</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #48dbfb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(72, 219, 251, 0.3);">Voir le devis</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>',
 'Devis {quote_number} accepté - Merci !

Bonjour {client_name},

Merci d''avoir accepté notre devis !
Montant accepté : {quote_amount}

Notre équipe vous contacte bientôt pour la suite !

Voir le devis : {quote_link}

{company_name}',
 '{"client_name": true, "quote_number": true, "quote_amount": true, "quote_link": true, "company_name": true}',
 true, 'fr'),

-- Client Rejected Quote
('client_rejected', 'Devis refusé', 
 'Devis {quote_number} - Merci pour votre retour',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #a55eea 0%, #8b5cf6 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Devis {quote_number}</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Merci pour votre retour</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Merci pour votre retour sur notre devis.</p>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Nous restons à votre disposition pour de futurs projets.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>',
 'Devis {quote_number} - Merci pour votre retour

Bonjour {client_name},

Merci pour votre retour sur notre devis.
Nous restons à votre disposition pour de futurs projets.

{company_name}',
 '{"client_name": true, "quote_number": true, "company_name": true}',
 true, 'fr'),

-- General Follow-up Template
('general_followup', 'Relance générale', 
 'Devis {quote_number} - Rappel',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Rappel</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Devis {quote_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Rappel de notre devis pour votre projet.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0; font-weight: bold; color: #333;">Montant : {quote_amount}</p>
    </div>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">Voir le devis</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>',
 'Rappel - Devis {quote_number}

Bonjour {client_name},

Rappel de notre devis pour votre projet.
Montant : {quote_amount}

Voir le devis : {quote_link}

{company_name}',
 '{"client_name": true, "quote_number": true, "quote_amount": true, "quote_link": true, "company_name": true}',
 true, 'fr'),

-- Welcome Client Template
('welcome_client', 'Bienvenue client', 
 'Bienvenue - Votre projet a été reçu',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Bienvenue !</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Votre projet a été reçu</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Nous sommes ravis de vous accueillir sur notre plateforme !</p>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Votre demande de projet a été reçue avec succès. Nos artisans qualifiés vont l''examiner et vous proposer des devis dans les plus brefs délais.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>',
 'Bienvenue - Votre projet a été reçu

Bonjour {client_name},

Nous sommes ravis de vous accueillir sur notre plateforme !
Votre demande de projet a été reçue avec succès. Nos artisans qualifiés vont l''examiner et vous proposer des devis dans les plus brefs délais.

Merci de votre confiance !

{company_name}',
 '{"client_name": true, "company_name": true}',
 true, 'fr');

-- Create indexes for email templates
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON public.email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_template_type ON public.email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_default ON public.email_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_email_templates_language ON public.email_templates(language);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON public.email_templates(is_active);

-- Enable Row Level Security for email templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own email templates
CREATE POLICY "Users can manage their own email templates" ON public.email_templates
    FOR ALL USING (user_id = auth.uid());

-- RLS Policy: Users can view default templates (system-wide)
CREATE POLICY "Users can view default templates" ON public.email_templates
    FOR SELECT USING (is_default = true);

-- Add email template metadata to quote_follow_ups table
ALTER TABLE public.quote_follow_ups 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.email_templates(id),
ADD COLUMN IF NOT EXISTS template_variables JSONB DEFAULT '{}';

-- Create index for template_id in quote_follow_ups
CREATE INDEX IF NOT EXISTS idx_quote_follow_ups_template_id ON public.quote_follow_ups(template_id);

-- Add comments for documentation
COMMENT ON TABLE public.email_templates IS 'Email templates for all quote-related communications';
COMMENT ON TABLE public.email_template_variables IS 'Available variables for email template personalization';
COMMENT ON COLUMN public.email_templates.template_type IS 'Type of email: quote_sent, followup_not_viewed, followup_viewed_no_action, client_accepted, client_rejected, general_followup';
COMMENT ON COLUMN public.email_templates.variables IS 'JSON object defining available variables for this template';
COMMENT ON COLUMN public.quote_follow_ups.template_id IS 'Reference to the email template used for this follow-up';
COMMENT ON COLUMN public.quote_follow_ups.template_variables IS 'JSON object with actual values for template variables';


