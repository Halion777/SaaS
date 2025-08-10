-- Clients Table Schema for SaaS Application
-- This table stores client information with multi-tenancy support

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table for storing client information
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    client_type VARCHAR(50) DEFAULT 'individual', -- individual, company, government
    contact_person VARCHAR(255),
    company_size VARCHAR(50), -- small, medium, large
    vat_number VARCHAR(100),
    peppol_id VARCHAR(100),
    peppol_enabled BOOLEAN DEFAULT false,
    communication_preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON public.clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON public.clients(is_active);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own clients
CREATE POLICY "Users can manage their own clients" ON public.clients
    FOR ALL USING (user_id = auth.uid());

-- RLS Policy: Users can view their own clients
CREATE POLICY "Users can view their own clients" ON public.clients
    FOR SELECT USING (user_id = auth.uid());

-- RLS Policy: Users can insert their own clients
CREATE POLICY "Users can insert their own clients" ON public.clients
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policy: Users can update their own clients
CREATE POLICY "Users can update their own clients" ON public.clients
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policy: Users can delete their own clients
CREATE POLICY "Users can delete their own clients" ON public.clients
    FOR DELETE USING (user_id = auth.uid());

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON public.clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.clients IS 'Stores client information with multi-tenancy support';
COMMENT ON COLUMN public.clients.id IS 'Unique identifier for the client';
COMMENT ON COLUMN public.clients.user_id IS 'Reference to the user who owns this client';
COMMENT ON COLUMN public.clients.name IS 'Client name or company name';
COMMENT ON COLUMN public.clients.email IS 'Client email address';
COMMENT ON COLUMN public.clients.phone IS 'Client phone number';
COMMENT ON COLUMN public.clients.address IS 'Client address';
COMMENT ON COLUMN public.clients.city IS 'Client city';
COMMENT ON COLUMN public.clients.country IS 'Client country';
COMMENT ON COLUMN public.clients.postal_code IS 'Client postal/zip code';
COMMENT ON COLUMN public.clients.client_type IS 'Type of client: individual, company, or government';
COMMENT ON COLUMN public.clients.contact_person IS 'Primary contact person for company clients';
COMMENT ON COLUMN public.clients.company_size IS 'Company size classification: small, medium, large';
COMMENT ON COLUMN public.clients.vat_number IS 'VAT registration number for tax purposes';
COMMENT ON COLUMN public.clients.peppol_id IS 'PEPPOL identifier for e-invoicing';
COMMENT ON COLUMN public.clients.peppol_enabled IS 'Whether client supports PEPPOL e-invoicing';
COMMENT ON COLUMN public.clients.communication_preferences IS 'JSON object storing communication preferences';
COMMENT ON COLUMN public.clients.is_active IS 'Whether the client is currently active';
COMMENT ON COLUMN public.clients.created_at IS 'Timestamp when the client was created';
COMMENT ON COLUMN public.clients.updated_at IS 'Timestamp when the client was last updated';
