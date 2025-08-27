-- Credit Insurance Applications Schema
-- This schema creates the necessary tables for the credit insurance service

-- Credit Insurance Applications Table
CREATE TABLE IF NOT EXISTS credit_insurance_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telephone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    sector VARCHAR(100) NOT NULL,
    activity_description TEXT NOT NULL,
    annual_turnover DECIMAL(15,2) NOT NULL,
    top_customers TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credit_insurance_applications_email ON credit_insurance_applications(email);
CREATE INDEX IF NOT EXISTS idx_credit_insurance_applications_status ON credit_insurance_applications(status);
CREATE INDEX IF NOT EXISTS idx_credit_insurance_applications_created_at ON credit_insurance_applications(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_insurance_applications_sector ON credit_insurance_applications(sector);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_credit_insurance_applications_updated_at ON credit_insurance_applications;
CREATE TRIGGER update_credit_insurance_applications_updated_at 
    BEFORE UPDATE ON credit_insurance_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample sectors (optional, for reference)
-- These are already defined in the frontend, but you can add them here if needed
-- INSERT INTO sectors (value, label) VALUES
--     ('construction', 'Construction'),
--     ('manufacturing', 'Fabrication'),
--     ('retail', 'Commerce de détail'),
--     ('services', 'Services'),
--     ('technology', 'Technologie'),
--     ('healthcare', 'Santé'),
--     ('finance', 'Finance'),
--     ('other', 'Autre');

-- Grant permissions (adjust according to your Supabase setup)
-- GRANT ALL ON credit_insurance_applications TO authenticated;
-- GRANT ALL ON credit_insurance_applications TO service_role;

-- Enable Row Level Security (RLS) if needed
-- ALTER TABLE credit_insurance_applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if needed
-- CREATE POLICY "Users can view their own applications" ON credit_insurance_applications
--     FOR SELECT USING (auth.uid()::text = email);
-- 
-- CREATE POLICY "Users can insert their own applications" ON credit_insurance_applications
--     FOR INSERT WITH CHECK (true);
-- 
-- CREATE POLICY "Only admins can update applications" ON credit_insurance_applications
--     FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
