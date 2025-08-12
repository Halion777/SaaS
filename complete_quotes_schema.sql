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
    profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    company_profile_id UUID REFERENCES public.company_profiles(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    title TEXT,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, viewed, accepted, rejected, expired
    project_categories TEXT[] DEFAULT '{}', -- Array of project categories (plomberie, electricite, etc.)
    custom_category TEXT, -- Custom category when "autre" is selected
    deadline DATE, -- Project deadline date
    total_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    final_amount DECIMAL(15,2) DEFAULT 0,
    valid_until DATE,
    terms_conditions TEXT, -- Terms and conditions for the quote
    share_token VARCHAR(100) UNIQUE,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Quote access logs table for analytics
CREATE TABLE IF NOT EXISTS public.quote_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    share_token VARCHAR(100),
    action VARCHAR(100), -- viewed, downloaded, shared
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quote categories table for organization
CREATE TABLE IF NOT EXISTS public.quote_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quote tags table for flexible tagging
CREATE TABLE IF NOT EXISTS public.quote_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_quotes_project_categories_gin ON public.quotes USING GIN (project_categories);
CREATE INDEX IF NOT EXISTS idx_quotes_deadline ON public.quotes(deadline);

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
CREATE INDEX IF NOT EXISTS idx_quote_access_logs_share_token ON public.quote_access_logs(share_token);
CREATE INDEX IF NOT EXISTS idx_quote_access_logs_accessed_at ON public.quote_access_logs(accessed_at);

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

CREATE OR REPLACE FUNCTION auto_expire_quotes()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE public.quotes 
    SET status = 'expired'
    WHERE valid_until < CURRENT_DATE 
    AND status IN ('draft', 'sent');
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

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
COMMENT ON TABLE public.quote_tags IS 'Flexible tagging system for quotes';
COMMENT ON TABLE public.storage_files IS 'Centralized file storage metadata';

-- Column comments for the new frontend fields
COMMENT ON COLUMN public.quotes.project_categories IS 'Array of project categories (e.g., ["plomberie", "electricite", "menuiserie", "autre"])';
COMMENT ON COLUMN public.quotes.custom_category IS 'Custom category when "autre" is selected from predefined categories';
COMMENT ON COLUMN public.quotes.deadline IS 'Project deadline date for quote completion';
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

-- Email outbox/queue (processed by Edge Function/worker)
CREATE TABLE IF NOT EXISTS public.email_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follow_up_id UUID REFERENCES public.quote_follow_ups(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    html TEXT,
    text TEXT,
    provider VARCHAR(50) DEFAULT 'resend',
    provider_message_id TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'queued', -- queued, sending, sent, delivered, opened, bounced, failed
    error TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quote events timeline
CREATE TABLE IF NOT EXISTS public.quote_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- sent, viewed, followup_scheduled, followup_sent, delivered, opened, bounced, accepted, rejected
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for follow-up subsystem
CREATE INDEX IF NOT EXISTS idx_quote_follow_up_rules_user_id ON public.quote_follow_up_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_follow_ups_quote_id ON public.quote_follow_ups(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_follow_ups_user_id ON public.quote_follow_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_follow_ups_scheduled_at ON public.quote_follow_ups(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_outbox_status ON public.email_outbox(status);
CREATE INDEX IF NOT EXISTS idx_email_outbox_user_id ON public.email_outbox(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_events_quote_id ON public.quote_events(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_events_type ON public.quote_events(type);

-- Enable RLS
ALTER TABLE public.quote_follow_up_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;
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
  FOR SELECT USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_quote_follow_up_rules_updated_at
  BEFORE UPDATE ON public.quote_follow_up_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_follow_ups_updated_at
  BEFORE UPDATE ON public.quote_follow_ups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_outbox_updated_at
  BEFORE UPDATE ON public.email_outbox
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
