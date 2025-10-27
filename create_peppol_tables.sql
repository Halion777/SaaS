-- =====================================================
-- STEP 2: CREATE PEPPOL SUPPORT TABLES
-- Creates all Peppol-specific tables for tracking and management
-- RUN THIS SECOND (after step1)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PEPPOL SETTINGS
CREATE TABLE IF NOT EXISTS public.peppol_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    peppol_id VARCHAR(100) NOT NULL UNIQUE,
    business_name VARCHAR(255) NOT NULL,
    country_code VARCHAR(2) NOT NULL DEFAULT 'BE',
    contact_person_name VARCHAR(255),
    contact_person_email VARCHAR(255),
    contact_person_phone VARCHAR(50),
    contact_person_language VARCHAR(10) DEFAULT 'en-US',
    supported_document_types TEXT[] DEFAULT ARRAY['INVOICE', 'CREDIT_NOTE']::TEXT[],
    limited_to_outbound_traffic BOOLEAN DEFAULT false,
    sandbox_mode BOOLEAN DEFAULT true,
    is_configured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_tested TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_peppol_settings_user_id ON public.peppol_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_peppol_settings_peppol_id ON public.peppol_settings(peppol_id);

-- 2. PEPPOL PARTICIPANTS
CREATE TABLE IF NOT EXISTS public.peppol_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    peppol_identifier VARCHAR(100) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    
    country_code VARCHAR(2) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    street_address TEXT,
    city VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100),
    supported_document_types TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_registered BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_verified TIMESTAMP WITH TIME ZONE,
    verification_status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, peppol_identifier)
);

CREATE INDEX IF NOT EXISTS idx_peppol_participants_user_id ON public.peppol_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_peppol_participants_peppol_id ON public.peppol_participants(peppol_identifier);

-- 3. PEPPOL INVOICES (tracking table)
CREATE TABLE IF NOT EXISTS public.peppol_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    document_type VARCHAR(50) NOT NULL DEFAULT 'INVOICE',
    reference_number VARCHAR(100),
    direction VARCHAR(10) NOT NULL,
    sender_id UUID REFERENCES public.peppol_participants(id) ON DELETE SET NULL,
    sender_peppol_id VARCHAR(100),
    sender_name VARCHAR(255),
    sender_vat_number VARCHAR(50),
    sender_email VARCHAR(255),
    receiver_id UUID REFERENCES public.peppol_participants(id) ON DELETE SET NULL,
    receiver_peppol_id VARCHAR(100),
    receiver_name VARCHAR(255),
    receiver_vat_number VARCHAR(50),
    receiver_email VARCHAR(255),
    issue_date DATE NOT NULL,
    due_date DATE,
    delivery_date DATE,
    payment_terms TEXT,
    buyer_reference VARCHAR(100),
    currency VARCHAR(3) DEFAULT 'EUR',
    subtotal_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    ubl_xml TEXT,
    pdf_url TEXT,
    attachment_urls TEXT[],
    status VARCHAR(50) DEFAULT 'pending',
    peppol_message_id VARCHAR(255),
    transmission_id VARCHAR(255),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    client_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    supplier_invoice_id INTEGER REFERENCES public.expense_invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (direction IN ('outbound', 'inbound')),
    CHECK (status IN ('pending', 'sent', 'delivered', 'received', 'processed', 'failed', 'rejected', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_peppol_invoices_user_id ON public.peppol_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_peppol_invoices_direction ON public.peppol_invoices(direction);
CREATE INDEX IF NOT EXISTS idx_peppol_invoices_status ON public.peppol_invoices(status);
CREATE INDEX IF NOT EXISTS idx_peppol_invoices_peppol_message_id ON public.peppol_invoices(peppol_message_id);
CREATE INDEX IF NOT EXISTS idx_peppol_invoices_client_invoice_id ON public.peppol_invoices(client_invoice_id);
CREATE INDEX IF NOT EXISTS idx_peppol_invoices_supplier_invoice_id ON public.peppol_invoices(supplier_invoice_id);

-- Enable RLS on all tables
ALTER TABLE public.peppol_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peppol_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peppol_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own peppol_settings" ON public.peppol_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own peppol_participants" ON public.peppol_participants FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own peppol_invoices" ON public.peppol_invoices FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.peppol_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.peppol_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.peppol_invoices TO authenticated;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_peppol_settings_updated_at BEFORE UPDATE ON public.peppol_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_peppol_participants_updated_at BEFORE UPDATE ON public.peppol_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_peppol_invoices_updated_at BEFORE UPDATE ON public.peppol_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ STEP 2 COMPLETE!';
  RAISE NOTICE '📊 Created 3 Peppol tables (simplified)';
  RAISE NOTICE '🔐 RLS enabled on all tables';
  RAISE NOTICE '⚙️  Triggers created';
  RAISE NOTICE '';
  RAISE NOTICE '➡️  Next: Run step3_add_invoice_attachments.sql';
END $$;

