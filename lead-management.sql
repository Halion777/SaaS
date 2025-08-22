-- Updated Lead Management System Schema
-- This migration updates the lead management system to use country and region/province matching
-- instead of radius-based matching

-- ========================================
-- DROP EXISTING FUNCTIONS AND TRIGGERS ONLY
-- ========================================

-- Drop triggers first (due to dependencies)
DROP TRIGGER IF EXISTS trigger_auto_assign_lead ON public.lead_requests;
DROP TRIGGER IF EXISTS trigger_update_lead_status_on_max_quotes ON public.lead_quotes;
DROP TRIGGER IF EXISTS trigger_lead_assignment_notification ON public.lead_assignments;
DROP TRIGGER IF EXISTS trigger_quote_notification ON public.lead_quotes;
DROP TRIGGER IF EXISTS trigger_new_lead_notification ON public.lead_requests;

-- Drop functions
DROP FUNCTION IF EXISTS public.auto_assign_lead_to_artisans();
DROP FUNCTION IF EXISTS public.can_lead_receive_quotes(UUID);
DROP FUNCTION IF EXISTS public.update_lead_status_on_max_quotes();
DROP FUNCTION IF EXISTS public.create_client_from_lead(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_lead_data_for_quote(UUID);
DROP FUNCTION IF EXISTS public.update_lead_status_on_quote_sent(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS public.send_lead_assignment_email();
DROP FUNCTION IF EXISTS public.send_quote_notification_email();
DROP FUNCTION IF EXISTS public.send_new_lead_notification();
DROP FUNCTION IF EXISTS public.get_leads_for_artisan(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.create_quote_from_lead(UUID, UUID, UUID, JSONB);
DROP FUNCTION IF EXISTS public.get_lead_details_for_quote_creation(UUID);
DROP FUNCTION IF EXISTS public.send_quote_email_notification(UUID, UUID, UUID);

-- Drop views
DROP VIEW IF EXISTS public.artisan_available_leads;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Public can create lead requests" ON public.lead_requests;
DROP POLICY IF EXISTS "Artisans can view active leads in their area" ON public.lead_requests;
DROP POLICY IF EXISTS "Public can view active leads" ON public.lead_requests;
DROP POLICY IF EXISTS "Artisans can view leads they can quote" ON public.lead_requests;
DROP POLICY IF EXISTS "Artisans can view their own assignments" ON public.lead_assignments;
DROP POLICY IF EXISTS "Artisans can update their own assignments" ON public.lead_assignments;
DROP POLICY IF EXISTS "System can create assignments" ON public.lead_assignments;
DROP POLICY IF EXISTS "Users can manage their own lead preferences" ON public.artisan_lead_preferences;
DROP POLICY IF EXISTS "Artisans can view their own quotes" ON public.lead_quotes;
DROP POLICY IF EXISTS "Artisans can create quotes for leads" ON public.lead_quotes;
DROP POLICY IF EXISTS "Artisans can update their own quotes" ON public.lead_quotes;
DROP POLICY IF EXISTS "Artisans can view their own notifications" ON public.lead_notifications;
DROP POLICY IF EXISTS "System can create clients from leads" ON public.clients;
DROP POLICY IF EXISTS "Public can view email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can view their own email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Service can insert email logs" ON public.email_logs;

-- Note: Tables are NOT dropped - only functions, triggers, and policies are recreated
-- This preserves any existing data in your tables

-- ========================================
-- CREATE FRESH SYSTEM
-- ========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- LEAD REQUESTS TABLE (from find-artisan form)
-- ========================================
CREATE TABLE IF NOT EXISTS public.lead_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Lead details
    project_categories TEXT[] NOT NULL DEFAULT '{}', -- Array of selected categories
    custom_category TEXT, -- Custom category when "other" is selected
    project_description TEXT NOT NULL,
    price_range VARCHAR(50), -- e.g., "1000-2500", "5000+"
    completion_date DATE,
    
    -- Location details
    country VARCHAR(10) NOT NULL DEFAULT 'BE', -- Country code (BE, FR, NL, LU, etc.)
    region VARCHAR(100) NOT NULL, -- Region/province within the country
    street_number VARCHAR(50),
    full_address TEXT NOT NULL,
    city VARCHAR(100) DEFAULT 'N/A',
    zip_code VARCHAR(20) NOT NULL,
    
    -- Client contact information
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    client_address TEXT NOT NULL,
    communication_preferences JSONB DEFAULT '{"email": true, "phone": false, "sms": false}',
    
    -- Project images (stored as file paths)
    project_images TEXT[] DEFAULT '{}',
    
    -- Lead status
    status VARCHAR(50) DEFAULT 'active', -- active, assigned, completed, expired
    is_public BOOLEAN DEFAULT true, -- whether this lead is visible to artisans
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure existing schema matches new requirements (if table already existed)
ALTER TABLE public.lead_requests ALTER COLUMN city DROP NOT NULL;
ALTER TABLE public.lead_requests ALTER COLUMN city SET DEFAULT 'N/A';
UPDATE public.lead_requests SET city = COALESCE(city, 'N/A') WHERE city IS NULL;

-- ========================================
-- ARTISAN LEAD PREFERENCES TABLE (settings from leads-management)
-- ========================================
CREATE TABLE IF NOT EXISTS public.artisan_lead_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    
    -- Location preferences (replaces radius-based system)
    countries_served JSONB NOT NULL DEFAULT '{}', -- e.g., {"BE": true, "FR": true, "NL": false}
    regions_served JSONB NOT NULL DEFAULT '{}', -- e.g., {"BE": ["Brussels-Capital Region", "Antwerp"], "FR": ["Île-de-France"]}
    
    -- Work category preferences
    work_categories JSONB NOT NULL DEFAULT '{}', -- e.g., {"plumbing": true, "electrical": false}
    other_work_category TEXT, -- Custom category when "autres" is selected
    
    -- Lead preferences
    receive_leads BOOLEAN DEFAULT false,
    max_leads_per_day INTEGER DEFAULT 10,
    min_lead_value DECIMAL(10, 2), -- Minimum project value to consider
    max_lead_value DECIMAL(10, 2), -- Maximum project value to consider
    
    -- Notification preferences
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- ========================================
-- LEAD ASSIGNMENTS TABLE (which artisans get which leads)
-- ========================================
CREATE TABLE IF NOT EXISTS public.lead_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.lead_requests(id) ON DELETE CASCADE,
    artisan_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    artisan_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    
    -- Assignment details
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'assigned', -- assigned, quote_sent, quote_accepted, declined
    
    -- Quote information (when artisan sends a quote)
    quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    quote_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(lead_id, artisan_user_id) -- One artisan per lead
);

-- ========================================
-- LEAD QUOTES TABLE (quotes sent for specific leads)
-- ========================================
CREATE TABLE IF NOT EXISTS public.lead_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.lead_requests(id) ON DELETE CASCADE,
    artisan_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    artisan_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    
    -- Quote details
    quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE, -- Links to main quote system
    quote_amount DECIMAL(15, 2),
    quote_currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Quote status
    status VARCHAR(50) DEFAULT 'sent', -- sent, viewed, accepted, rejected, expired
    
    -- Client interaction
    viewed_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    client_response TEXT, -- Client's response or feedback
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(lead_id, artisan_user_id) -- One quote per artisan per lead
);

-- ========================================
-- LEAD NOTIFICATIONS TABLE (for tracking notifications sent)
-- ========================================
CREATE TABLE IF NOT EXISTS public.lead_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.lead_requests(id) ON DELETE CASCADE,
    artisan_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Notification details
    type VARCHAR(50) NOT NULL, -- new_lead, lead_assigned, quote_requested, etc.
    channel VARCHAR(50) DEFAULT 'email', -- email, push, sms
    subject TEXT,
    message TEXT,
    
    -- Delivery status
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, failed
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Lead requests indexes
CREATE INDEX IF NOT EXISTS idx_lead_requests_status ON public.lead_requests(status);
CREATE INDEX IF NOT EXISTS idx_lead_requests_country ON public.lead_requests(country);
CREATE INDEX IF NOT EXISTS idx_lead_requests_region ON public.lead_requests(region);
CREATE INDEX IF NOT EXISTS idx_lead_requests_city ON public.lead_requests(city);
CREATE INDEX IF NOT EXISTS idx_lead_requests_zip_code ON public.lead_requests(zip_code);
CREATE INDEX IF NOT EXISTS idx_lead_requests_created_at ON public.lead_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_requests_categories ON public.lead_requests USING GIN(project_categories array_ops);
CREATE INDEX IF NOT EXISTS idx_lead_requests_location ON public.lead_requests(country, region, city);

-- Artisan preferences indexes
CREATE INDEX IF NOT EXISTS idx_artisan_lead_preferences_user_id ON public.artisan_lead_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_artisan_lead_preferences_countries ON public.artisan_lead_preferences USING GIN(countries_served jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_artisan_lead_preferences_regions ON public.artisan_lead_preferences USING GIN(regions_served jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_artisan_lead_preferences_categories ON public.artisan_lead_preferences USING GIN(work_categories jsonb_path_ops);

-- Lead assignments indexes
CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead_id ON public.lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_artisan_user_id ON public.lead_assignments(artisan_user_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_status ON public.lead_assignments(status);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_assigned_at ON public.lead_assignments(assigned_at);

-- Lead quotes indexes
CREATE INDEX IF NOT EXISTS idx_lead_quotes_lead_id ON public.lead_quotes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_quotes_artisan_user_id ON public.lead_quotes(artisan_user_id);
CREATE INDEX IF NOT EXISTS idx_lead_quotes_status ON public.lead_quotes(status);
CREATE INDEX IF NOT EXISTS idx_lead_quotes_created_at ON public.lead_quotes(created_at);

-- Lead notifications indexes
CREATE INDEX IF NOT EXISTS idx_lead_notifications_lead_id ON public.lead_notifications(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notifications_artisan_user_id ON public.lead_notifications(artisan_user_id);
CREATE INDEX IF NOT EXISTS idx_lead_notifications_status ON public.lead_notifications(status);

-- ========================================
-- FUNCTIONS AND TRIGGERS
-- ========================================

-- Function to automatically assign leads to matching artisans based on country and region
CREATE OR REPLACE FUNCTION public.auto_assign_lead_to_artisans()
RETURNS TRIGGER AS $$
DECLARE
    artisan_record RECORD;
    assignment_count INTEGER;
BEGIN
    -- Only process new active leads
    IF NEW.status != 'active' OR NEW.is_public != true THEN
        RETURN NEW;
    END IF;
    
    -- Find matching artisans based on preferences
    FOR artisan_record IN 
        SELECT 
            alp.user_id,
            alp.profile_id,
            alp.countries_served,
            alp.regions_served,
            alp.work_categories
        FROM public.artisan_lead_preferences alp
        WHERE alp.receive_leads = true
        AND (
            -- Country must match
            alp.countries_served ? NEW.country
            AND
            -- Region must match for that country
            (
                alp.regions_served ? NEW.country
                AND 
                alp.regions_served->NEW.country ? NEW.region
            )
        )
        AND (
            alp.work_categories ?| NEW.project_categories
            OR (alp.other_work_category IS NOT NULL AND NEW.custom_category IS NOT NULL)
        )
    LOOP
        -- Check if artisan already has an assignment for this lead
        SELECT COUNT(*) INTO assignment_count
        FROM public.lead_assignments
        WHERE lead_id = NEW.id AND artisan_user_id = artisan_record.user_id;
        
        -- If no existing assignment, create one
        IF assignment_count = 0 THEN
            INSERT INTO public.lead_assignments (
                lead_id, 
                artisan_user_id, 
                artisan_profile_id
            ) VALUES (
                NEW.id, 
                artisan_record.user_id, 
                artisan_record.profile_id
            );
            
            -- Create notification for artisan
            INSERT INTO public.lead_notifications (
                lead_id,
                artisan_user_id,
                type,
                subject,
                message
            ) VALUES (
                NEW.id,
                artisan_record.user_id,
                'new_lead',
                'Nouveau projet disponible',
                'Un nouveau projet correspondant à vos compétences est disponible dans votre zone d''intervention.'
            );
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically assign leads when they're created
CREATE TRIGGER trigger_auto_assign_lead
    AFTER INSERT ON public.lead_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_lead_to_artisans();

-- Function to get leads for a specific artisan based on their preferences
CREATE OR REPLACE FUNCTION public.get_leads_for_artisan(
    artisan_user_uuid UUID,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    lead_id UUID,
    project_description TEXT,
    project_categories TEXT[],
    custom_category TEXT,
    completion_date DATE,
    price_range VARCHAR(50),
    client_name VARCHAR(255),
    country VARCHAR(10),
    region VARCHAR(100),
    city VARCHAR(100),
    zip_code VARCHAR(20),
    street_number VARCHAR(50),
    full_address TEXT,
    project_images TEXT[],
    quotes_sent_count BIGINT,
    can_send_quote BOOLEAN,
    match_priority INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lr.id as lead_id,
        lr.project_description,
        lr.project_categories,
        lr.custom_category,
        lr.completion_date,
        lr.price_range,
        lr.client_name,
        lr.country,
        lr.region,
        lr.city,
        lr.zip_code,
        lr.street_number,
        lr.full_address,
        COALESCE(lr.project_images, ARRAY[]::TEXT[]) as project_images,
        COALESCE(quote_counts.quotes_sent, 0) as quotes_sent_count,
        (COALESCE(quote_counts.quotes_sent, 0) < 3 AND NOT EXISTS (
            SELECT 1 FROM public.lead_quotes lq2 
            WHERE lq2.lead_id = lr.id 
            AND lq2.artisan_user_id = artisan_user_uuid
        )) as can_send_quote,
        CASE 
            -- Country and region match = highest priority (1)
            WHEN alp.countries_served ? lr.country 
                AND alp.regions_served ? lr.country 
                AND alp.regions_served->lr.country ? lr.region THEN 1
            -- Country match only = second priority (2)
            WHEN alp.countries_served ? lr.country THEN 2
            ELSE 3
        END as match_priority,
        lr.created_at
    FROM public.lead_requests lr
    LEFT JOIN (
        SELECT 
            lq.lead_id,
            COUNT(*) as quotes_sent
        FROM public.lead_quotes lq
        WHERE lq.status != 'declined'
        GROUP BY lq.lead_id
    ) quote_counts ON lr.id = quote_counts.lead_id
    CROSS JOIN public.artisan_lead_preferences alp
    WHERE lr.status = 'active'
    AND lr.is_public = true
    AND alp.user_id = artisan_user_uuid
    AND alp.receive_leads = true
            AND (
        -- Country must match
        alp.countries_served ? lr.country
        AND
        -- Region must match for that country
        (
            alp.regions_served ? lr.country
            AND 
            alp.regions_served->lr.country ? lr.region
        )
        )
    AND (
        alp.work_categories ?| lr.project_categories
        OR (alp.other_work_category IS NOT NULL AND lr.custom_category IS NOT NULL)
    )
    AND COALESCE(quote_counts.quotes_sent, 0) < 3
    ORDER BY match_priority ASC, lr.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.lead_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisan_lead_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notifications ENABLE ROW LEVEL SECURITY;

-- Lead requests policies
CREATE POLICY "Public can create lead requests" ON public.lead_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Artisans can view active leads in their area" ON public.lead_requests
    FOR SELECT USING (
        status = 'active' 
        AND is_public = true
        AND EXISTS (
            SELECT 1 FROM public.artisan_lead_preferences alp
            WHERE alp.user_id = auth.uid()
            AND alp.receive_leads = true
            AND alp.countries_served ? country
            AND (
                alp.regions_served ? country
                AND 
                alp.regions_served->country ? region
            )
            AND (
                -- Work categories must match
                alp.work_categories ?| project_categories
                OR (alp.other_work_category IS NOT NULL AND custom_category IS NOT NULL)
            )
        )
    );

-- Allow anonymous/public users to view active, public leads
CREATE POLICY "Public can view active leads" ON public.lead_requests
    FOR SELECT USING (
        status = 'active' AND is_public = true
    );

-- Basic privileges for anon/authenticated roles
GRANT INSERT ON public.lead_requests TO anon, authenticated;
GRANT SELECT ON public.lead_requests TO anon, authenticated;

-- Lead assignments policies
CREATE POLICY "Artisans can view their own assignments" ON public.lead_assignments
    FOR SELECT USING (artisan_user_id = auth.uid());

CREATE POLICY "Artisans can update their own assignments" ON public.lead_assignments
    FOR UPDATE USING (artisan_user_id = auth.uid());

CREATE POLICY "System can create assignments" ON public.lead_assignments
    FOR INSERT WITH CHECK (true);

-- Artisan preferences policies
CREATE POLICY "Users can manage their own lead preferences" ON public.artisan_lead_preferences
    FOR ALL USING (user_id = auth.uid());

-- Lead quotes policies
CREATE POLICY "Artisans can view their own quotes" ON public.lead_quotes
    FOR SELECT USING (artisan_user_id = auth.uid());

CREATE POLICY "Artisans can create quotes for leads" ON public.lead_quotes
    FOR INSERT WITH CHECK (artisan_user_id = auth.uid());

CREATE POLICY "Artisans can update their own quotes" ON public.lead_quotes
    FOR UPDATE USING (artisan_user_id = auth.uid());

-- Lead notifications policies
CREATE POLICY "Artisans can view their own notifications" ON public.lead_notifications
    FOR SELECT USING (artisan_user_id = auth.uid());

-- ========================================
-- ADDITIONAL FUNCTIONS FOR COMPLETE INTEGRATION
-- ========================================

-- Function to create a client from lead data
CREATE OR REPLACE FUNCTION public.create_client_from_lead(
    lead_uuid UUID,
    artisan_user_uuid UUID
)
RETURNS UUID AS $$
DECLARE
    lead_data RECORD;
    new_client_id UUID;
BEGIN
    -- Get lead data
    SELECT 
        client_name,
        client_email,
        client_phone,
        client_address,
        city,
        zip_code,
        communication_preferences
    INTO lead_data
    FROM public.lead_requests
    WHERE id = lead_uuid;
    
    -- Check if client already exists for this artisan
    SELECT id INTO new_client_id
    FROM public.clients
    WHERE user_id = artisan_user_uuid 
    AND email = lead_data.client_email
    AND name = lead_data.client_name;
    
    -- If client doesn't exist, create new one
   IF new_client_id IS NULL THEN
    INSERT INTO public.clients (
        user_id,
        name,
        email,
        phone,
        address,
        city,
        country,
        postal_code,
        client_type,
        contact_person,
        company_size,
        vat_number,
        peppol_id,
        peppol_enabled,
        communication_preferences,
        is_active
    ) VALUES (
        artisan_user_uuid,
        lead_data.client_name,
        lead_data.client_email,
        lead_data.client_phone,
        lead_data.client_address,
        NULL, -- city
        NULL, -- country
        NULL, -- postal_code
        'individual', -- Always individual
        NULL, -- contact_person
        NULL, -- company_size
        NULL, -- vat_number
        NULL, -- peppol_id
        false, -- peppol_enabled
        lead_data.communication_preferences,
        true
    ) RETURNING id INTO new_client_id;
END IF;
    
    RETURN new_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get lead details for quote creation
CREATE OR REPLACE FUNCTION public.get_lead_details_for_quote_creation(
    lead_uuid UUID
)
RETURNS TABLE (
    lead_id UUID,
    project_description TEXT,
    project_categories TEXT[],
    custom_category TEXT,
    completion_date DATE,
    price_range VARCHAR(50),
    country VARCHAR(10),
    region VARCHAR(100),
    street_number VARCHAR(50),
    full_address TEXT,
    city VARCHAR(100),
    zip_code VARCHAR(20),
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    client_address TEXT,
    communication_preferences JSONB,
    project_images TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lr.id,
        lr.project_description,
        lr.project_categories,
        lr.custom_category,
        lr.completion_date,
        lr.price_range,
        lr.country,
        lr.region,
        lr.street_number,
        lr.full_address,
        lr.city,
        lr.zip_code,
        lr.client_name,
        lr.client_email,
        lr.client_phone,
        lr.client_address,
        lr.communication_preferences,
        lr.project_images
    FROM public.lead_requests lr
    WHERE lr.id = lead_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update lead status when quote is sent
CREATE OR REPLACE FUNCTION public.update_lead_status_on_quote_sent(
    lead_uuid UUID,
    quote_uuid UUID,
    artisan_user_uuid UUID
)
RETURNS VOID AS $$
BEGIN
    -- Update lead assignment status
    UPDATE public.lead_assignments
    SET status = 'quote_sent',
        quote_id = quote_uuid,
        quote_sent_at = NOW()
    WHERE lead_id = lead_uuid 
    AND artisan_user_id = artisan_user_uuid;
    
    -- Create lead quote record
    INSERT INTO public.lead_quotes (
        lead_id,
        artisan_user_id,
        quote_id,
        status
    ) VALUES (
        lead_uuid,
        artisan_user_uuid,
        quote_uuid,
        'sent'
    );
    
    -- Update lead status if max quotes reached
    PERFORM public.update_lead_status_on_max_quotes();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if lead can receive more quotes (max 3)
CREATE OR REPLACE FUNCTION public.can_lead_receive_quotes(lead_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    quote_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO quote_count
    FROM public.lead_quotes
    WHERE lead_id = lead_uuid AND status != 'declined';
    
    RETURN quote_count < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update lead status when max quotes reached
CREATE OR REPLACE FUNCTION public.update_lead_status_on_max_quotes()
RETURNS TRIGGER AS $$
DECLARE
    quote_count INTEGER;
BEGIN
    -- Count active quotes for this lead
    SELECT COUNT(*) INTO quote_count
    FROM public.lead_quotes
    WHERE lead_id = NEW.lead_id AND status != 'declined';
    
    -- If max quotes reached, update lead status
    IF quote_count >= 3 THEN
        UPDATE public.lead_requests 
        SET status = 'max_quotes_reached', updated_at = NOW()
        WHERE id = NEW.lead_id;
        
        -- Create notification for all assigned artisans
    INSERT INTO public.lead_notifications (
        lead_id,
        artisan_user_id,
        type,
            channel,
        subject,
        message,
        status
        )
        SELECT 
            NEW.lead_id,
            artisan_user_id,
            'max_quotes_reached',
            'email',
            'Maximum Quotes Reached',
            'This lead has reached the maximum number of quotes (3). No more quotes can be sent.',
        'pending'
        FROM public.lead_assignments
        WHERE lead_id = NEW.lead_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update lead status when max quotes reached
CREATE TRIGGER trigger_update_lead_status_on_max_quotes
    AFTER INSERT ON public.lead_quotes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_lead_status_on_max_quotes();

-- Function to create quote from lead data
CREATE OR REPLACE FUNCTION public.create_quote_from_lead(
    lead_uuid UUID,
    artisan_user_uuid UUID,
    artisan_profile_uuid UUID,
    quote_data JSONB
)
RETURNS UUID AS $$
DECLARE
    new_client_id UUID;
    new_quote_id UUID;
    lead_info RECORD;
BEGIN
    -- Get lead information
    SELECT * INTO lead_info
    FROM public.lead_requests
    WHERE id = lead_uuid;
    
    -- Create or get existing client
    SELECT public.create_client_from_lead(lead_uuid, artisan_user_uuid) INTO new_client_id;
    
    -- Create the quote using existing quote system
    INSERT INTO public.quotes (
        user_id,
        profile_id,
        company_profile_id,
        client_id,
        title,
        description,
        project_categories,
        custom_category,
        deadline,
        valid_until,
        status,
        start_date
    ) VALUES (
        artisan_user_uuid,
        artisan_profile_uuid,
        quote_data->>'company_profile_id',
        new_client_id,
        COALESCE(quote_data->>'title', 'Devis pour ' || lead_info.client_name),
        lead_info.project_description,
        lead_info.project_categories,
        lead_info.custom_category,
        lead_info.completion_date,
        lead_info.completion_date,
        'draft',
        CURRENT_DATE
    ) RETURNING id INTO new_quote_id;
    
    -- Update lead assignment status
    PERFORM public.update_lead_status_on_quote_sent(lead_uuid, new_quote_id, artisan_user_uuid);
    
    RETURN new_quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- VIEWS FOR EASIER QUERYING
-- ========================================

-- View for artisan dashboard showing available leads
CREATE OR REPLACE VIEW public.artisan_available_leads AS
SELECT 
    lr.id as lead_id,
    lr.project_description,
    lr.project_categories,
    lr.custom_category,
    lr.completion_date,
    lr.price_range,
    lr.client_name,
    lr.country,
    lr.region,
    lr.city,
    lr.zip_code,
    lr.created_at,
    COALESCE(quote_counts.quotes_sent, 0) as quotes_sent_count,
    CASE 
        WHEN COALESCE(quote_counts.quotes_sent, 0) >= 3 THEN 'max_quotes_reached'
        WHEN la.id IS NOT NULL THEN 'already_assigned'
        ELSE 'available'
    END as lead_status
FROM public.lead_requests lr
LEFT JOIN (
    SELECT 
        lead_id,
        COUNT(*) as quotes_sent
    FROM public.lead_quotes
    WHERE status != 'declined'
    GROUP BY lead_id
) quote_counts ON lr.id = quote_counts.lead_id
LEFT JOIN public.lead_assignments la ON lr.id = la.lead_id AND la.artisan_user_id = auth.uid()
WHERE lr.status = 'active'
AND lr.is_public = true;

-- Grant access to the view
GRANT SELECT ON public.artisan_available_leads TO authenticated;

-- ========================================
-- COMMENTS AND DOCUMENTATION
-- ========================================

COMMENT ON TABLE public.lead_requests IS 'Lead requests from the find-artisan form submitted by potential clients';
COMMENT ON TABLE public.artisan_lead_preferences IS 'Artisan preferences for receiving leads including countries and regions they serve';
COMMENT ON TABLE public.lead_assignments IS 'Assignments of leads to artisans based on preferences and location';
COMMENT ON TABLE public.lead_quotes IS 'Quotes sent by artisans for specific leads';
COMMENT ON TABLE public.lead_notifications IS 'Notifications sent to artisans about new leads and updates';

COMMENT ON COLUMN public.lead_requests.country IS 'Country code where the lead is located (e.g., BE, FR, NL, LU)';
COMMENT ON COLUMN public.lead_requests.region IS 'Region/province within the country where the lead is located';
COMMENT ON COLUMN public.artisan_lead_preferences.countries_served IS 'JSONB object with country codes as keys and boolean values for countries the artisan serves';
COMMENT ON COLUMN public.artisan_lead_preferences.regions_served IS 'JSONB object with country codes as keys and arrays of region names as values for regions the artisan serves';
COMMENT ON FUNCTION public.auto_assign_lead_to_artisans() IS 'Automatically assigns leads to artisans based on country, region, and work category matching';

COMMENT ON FUNCTION public.get_leads_for_artisan IS 'Returns leads that match an artisan''s country, region, and work category preferences';
COMMENT ON FUNCTION public.create_quote_from_lead IS 'Creates a complete quote from lead data including client creation';
COMMENT ON FUNCTION public.get_lead_details_for_quote_creation IS 'Returns all lead details needed to pre-fill quote creation form';
COMMENT ON COLUMN public.lead_requests.project_images IS 'Array of public URLs for project images stored in Supabase Storage';
