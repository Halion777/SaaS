-- Lead Management Spam Reporting Update
-- This migration adds spam reporting functionality to the lead management system

-- ========================================
-- ADD SPAM REPORTING COLUMNS TO LEAD_REQUESTS
-- ========================================

-- Add spam reporting columns to lead_requests table
ALTER TABLE public.lead_requests 
ADD COLUMN IF NOT EXISTS is_spam BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spam_reason TEXT,
ADD COLUMN IF NOT EXISTS reported_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reported_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS spam_reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS spam_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS spam_review_status VARCHAR(50) DEFAULT 'pending'; -- pending, approved, rejected

-- Add indexes for spam reporting queries
CREATE INDEX IF NOT EXISTS idx_lead_requests_is_spam ON public.lead_requests(is_spam);
CREATE INDEX IF NOT EXISTS idx_lead_requests_spam_review_status ON public.lead_requests(spam_review_status);
CREATE INDEX IF NOT EXISTS idx_lead_requests_reported_by ON public.lead_requests(reported_by_user_id);

-- ========================================
-- CREATE SPAM REPORTS TABLE (for tracking multiple reports)
-- ========================================

CREATE TABLE IF NOT EXISTS public.lead_spam_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.lead_requests(id) ON DELETE CASCADE,
    reported_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Report details
    reason TEXT NOT NULL,
    report_type VARCHAR(50) DEFAULT 'spam', -- spam, inappropriate, fake, other
    additional_details TEXT,
    
    -- Review details
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    review_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(lead_id, reported_by_user_id) -- One report per user per lead
);

-- Add indexes for spam reports
CREATE INDEX IF NOT EXISTS idx_lead_spam_reports_lead_id ON public.lead_spam_reports(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_spam_reports_reported_by ON public.lead_spam_reports(reported_by_user_id);
CREATE INDEX IF NOT EXISTS idx_lead_spam_reports_review_status ON public.lead_spam_reports(review_status);
CREATE INDEX IF NOT EXISTS idx_lead_spam_reports_created_at ON public.lead_spam_reports(created_at);

-- ========================================
-- FUNCTIONS FOR SPAM REPORTING
-- ========================================

-- Function to report a lead as spam
CREATE OR REPLACE FUNCTION public.report_lead_as_spam(
    lead_uuid UUID,
    reporter_user_uuid UUID,
    spam_reason_text TEXT,
    report_type_text VARCHAR(50) DEFAULT 'spam',
    additional_details_text TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    lead_exists BOOLEAN;
    report_exists BOOLEAN;
BEGIN
    -- Check if lead exists
    SELECT EXISTS(SELECT 1 FROM public.lead_requests WHERE id = lead_uuid) INTO lead_exists;
    IF NOT lead_exists THEN
        RAISE EXCEPTION 'Lead not found';
    END IF;
    
    -- Check if user already reported this lead
    SELECT EXISTS(SELECT 1 FROM public.lead_spam_reports WHERE lead_id = lead_uuid AND reported_by_user_id = reporter_user_uuid) INTO report_exists;
    IF report_exists THEN
        RAISE EXCEPTION 'User has already reported this lead';
    END IF;
    
    -- Insert spam report
    INSERT INTO public.lead_spam_reports (
        lead_id,
        reported_by_user_id,
        reason,
        report_type,
        additional_details
    ) VALUES (
        lead_uuid,
        reporter_user_uuid,
        spam_reason_text,
        report_type_text,
        additional_details_text
    );
    
    -- Update lead_requests table with spam flag
    UPDATE public.lead_requests 
    SET 
        is_spam = true,
        spam_reason = spam_reason_text,
        reported_by_user_id = reporter_user_uuid,
        reported_at = NOW(),
        spam_review_status = 'pending',
        updated_at = NOW()
    WHERE id = lead_uuid;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to review spam report (superadmin action)
CREATE OR REPLACE FUNCTION public.review_spam_report(
    lead_uuid UUID,
    reviewer_user_uuid UUID,
    review_status_text VARCHAR(50),
    review_notes_text TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    lead_exists BOOLEAN;
BEGIN
    -- Check if lead exists
    SELECT EXISTS(SELECT 1 FROM public.lead_requests WHERE id = lead_uuid) INTO lead_exists;
    IF NOT lead_exists THEN
        RAISE EXCEPTION 'Lead not found';
    END IF;
    
    -- Update lead_requests table
    UPDATE public.lead_requests 
    SET 
        spam_reviewed_by = reviewer_user_uuid,
        spam_reviewed_at = NOW(),
        spam_review_status = review_status_text,
        updated_at = NOW()
    WHERE id = lead_uuid;
    
    -- Update all spam reports for this lead
    UPDATE public.lead_spam_reports 
    SET 
        reviewed_by = reviewer_user_uuid,
        reviewed_at = NOW(),
        review_status = review_status_text,
        review_notes = review_notes_text,
        updated_at = NOW()
    WHERE lead_id = lead_uuid;
    
    -- If spam is rejected, remove spam flag
    IF review_status_text = 'rejected' THEN
        UPDATE public.lead_requests 
        SET 
            is_spam = false,
            spam_reason = NULL,
            reported_by_user_id = NULL,
            reported_at = NULL,
            spam_reviewed_by = reviewer_user_uuid,
            spam_reviewed_at = NOW(),
            spam_review_status = 'rejected',
            updated_at = NOW()
        WHERE id = lead_uuid;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get spam reports for superadmin
CREATE OR REPLACE FUNCTION public.get_spam_reports(
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    report_id UUID,
    lead_id UUID,
    lead_client_name VARCHAR(255),
    lead_project_description TEXT,
    lead_created_at TIMESTAMP WITH TIME ZONE,
    reported_by_user_id UUID,
    reported_by_name VARCHAR(255),
    reported_by_email VARCHAR(255),
    reason TEXT,
    report_type VARCHAR(50),
    additional_details TEXT,
    review_status VARCHAR(50),
    review_notes TEXT,
    reviewed_by_name VARCHAR(255),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    report_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lsr.id as report_id,
        lsr.lead_id,
        lr.client_name as lead_client_name,
        lr.project_description as lead_project_description,
        lr.created_at as lead_created_at,
        lsr.reported_by_user_id,
        u.full_name as reported_by_name,
        u.email as reported_by_email,
        lsr.reason,
        lsr.report_type,
        lsr.additional_details,
        lsr.review_status,
        lsr.review_notes,
        reviewer.full_name as reviewed_by_name,
        lsr.reviewed_at,
        lsr.created_at as report_created_at
    FROM public.lead_spam_reports lsr
    JOIN public.lead_requests lr ON lsr.lead_id = lr.id
    JOIN public.users u ON lsr.reported_by_user_id = u.id
    LEFT JOIN public.users reviewer ON lsr.reviewed_by = reviewer.id
    ORDER BY lsr.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on spam reports table
ALTER TABLE public.lead_spam_reports ENABLE ROW LEVEL SECURITY;

-- Spam reports policies
CREATE POLICY "Users can create spam reports" ON public.lead_spam_reports
    FOR INSERT WITH CHECK (reported_by_user_id = auth.uid());

CREATE POLICY "Users can view their own spam reports" ON public.lead_spam_reports
    FOR SELECT USING (reported_by_user_id = auth.uid());

CREATE POLICY "Superadmins can view all spam reports" ON public.lead_spam_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'superadmin'
        )
    );

CREATE POLICY "Superadmins can update spam reports" ON public.lead_spam_reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'superadmin'
        )
    );

-- Grant permissions
GRANT INSERT ON public.lead_spam_reports TO authenticated;
GRANT SELECT ON public.lead_spam_reports TO authenticated;
GRANT UPDATE ON public.lead_spam_reports TO authenticated;

-- ========================================
-- UPDATE EXISTING FUNCTIONS TO HANDLE SPAM
-- ========================================

-- Update the get_leads_for_artisan function to exclude spam leads
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
    AND lr.is_spam = false  -- Exclude spam leads
    AND lr.spam_review_status != 'approved'  -- Exclude approved spam
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
-- COMMENTS AND DOCUMENTATION
-- ========================================

COMMENT ON TABLE public.lead_spam_reports IS 'Reports of spam or inappropriate leads submitted by users';
COMMENT ON COLUMN public.lead_requests.is_spam IS 'Whether this lead has been reported as spam';
COMMENT ON COLUMN public.lead_requests.spam_reason IS 'Reason for spam report';
COMMENT ON COLUMN public.lead_requests.reported_by_user_id IS 'User who reported this lead as spam';
COMMENT ON COLUMN public.lead_requests.spam_review_status IS 'Status of spam review: pending, approved, rejected';

COMMENT ON FUNCTION public.report_lead_as_spam IS 'Report a lead as spam with reason and details';
COMMENT ON FUNCTION public.review_spam_report IS 'Review and approve/reject spam reports (superadmin only)';
COMMENT ON FUNCTION public.get_spam_reports IS 'Get all spam reports for superadmin review';
