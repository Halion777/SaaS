-- Peppol Integration Database Schema for Haliqo

-- Peppol Participants Table
CREATE TABLE IF NOT EXISTS public.peppol_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    vat_number TEXT,
    peppol_identifier TEXT UNIQUE,
    address TEXT,
    city TEXT,
    zip_code TEXT,
    country TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    participant_type TEXT CHECK (participant_type IN ('sender', 'receiver', 'both')) DEFAULT 'both',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Peppol Invoices Table
CREATE TABLE IF NOT EXISTS public.peppol_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number TEXT NOT NULL,
    sender_id UUID REFERENCES public.peppol_participants(id),
    receiver_id UUID REFERENCES public.peppol_participants(id),
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    status TEXT CHECK (status IN ('pending', 'sent', 'received', 'delivered', 'accepted', 'rejected', 'mlr_received', 'error')) DEFAULT 'pending',
    document_type TEXT CHECK (document_type IN ('invoice', 'credit_note')) DEFAULT 'invoice',
    ubl_document TEXT,
    peppol_message_id TEXT,
    peppol_delivery_ack TEXT,
    peppol_mlr TEXT,
    peppol_response TEXT,
    issue_date DATE,
    due_date DATE,
    sent_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    mlr_received_at TIMESTAMP WITH TIME ZONE,
    response_received_at TIMESTAMP WITH TIME ZONE,
    response_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Peppol Invoice Lines Table
CREATE TABLE IF NOT EXISTS public.peppol_invoice_lines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID REFERENCES public.peppol_invoices(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    description TEXT,
    quantity DECIMAL(10,3) DEFAULT 1,
    unit_price DECIMAL(10,2) DEFAULT 0,
    taxable_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    vat_code TEXT DEFAULT 'S',
    vat_percentage DECIMAL(5,2) DEFAULT 21,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Peppol Validation Errors Table
CREATE TABLE IF NOT EXISTS public.peppol_validation_errors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id TEXT,
    validation_errors JSONB,
    document TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_peppol_participant_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_peppol_invoice_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DROP TRIGGER IF EXISTS update_peppol_participants_updated_at ON public.peppol_participants;
CREATE TRIGGER update_peppol_participants_updated_at
    BEFORE UPDATE ON public.peppol_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_peppol_participant_updated_at_column();

DROP TRIGGER IF EXISTS update_peppol_invoices_updated_at ON public.peppol_invoices;
CREATE TRIGGER update_peppol_invoices_updated_at
    BEFORE UPDATE ON public.peppol_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_peppol_invoice_updated_at_column();

-- Enable RLS
ALTER TABLE public.peppol_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peppol_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peppol_invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peppol_validation_errors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Peppol Participants
DROP POLICY IF EXISTS "Superadmins can manage all peppol participants" ON public.peppol_participants;
CREATE POLICY "Superadmins can manage all peppol participants" ON public.peppol_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'superadmin'
        )
    );

DROP POLICY IF EXISTS "Admins can view all peppol participants" ON public.peppol_participants;
CREATE POLICY "Admins can view all peppol participants" ON public.peppol_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'superadmin')
        )
    );

-- RLS Policies for Peppol Invoices
DROP POLICY IF EXISTS "Superadmins can manage all peppol invoices" ON public.peppol_invoices;
CREATE POLICY "Superadmins can manage all peppol invoices" ON public.peppol_invoices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'superadmin'
        )
    );

DROP POLICY IF EXISTS "Admins can view all peppol invoices" ON public.peppol_invoices;
CREATE POLICY "Admins can view all peppol invoices" ON public.peppol_invoices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'superadmin')
        )
    );

-- RLS Policies for Peppol Invoice Lines
DROP POLICY IF EXISTS "Superadmins can manage all peppol invoice lines" ON public.peppol_invoice_lines;
CREATE POLICY "Superadmins can manage all peppol invoice lines" ON public.peppol_invoice_lines
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'superadmin'
        )
    );

DROP POLICY IF EXISTS "Admins can view all peppol invoice lines" ON public.peppol_invoice_lines;
CREATE POLICY "Admins can view all peppol invoice lines" ON public.peppol_invoice_lines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'superadmin')
        )
    );

-- RLS Policies for Peppol Validation Errors
DROP POLICY IF EXISTS "Superadmins can manage all peppol validation errors" ON public.peppol_validation_errors;
CREATE POLICY "Superadmins can manage all peppol validation errors" ON public.peppol_validation_errors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'superadmin'
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_peppol_participants_peppol_identifier ON public.peppol_participants(peppol_identifier);
CREATE INDEX IF NOT EXISTS idx_peppol_participants_vat_number ON public.peppol_participants(vat_number);
CREATE INDEX IF NOT EXISTS idx_peppol_participants_participant_type ON public.peppol_participants(participant_type);

CREATE INDEX IF NOT EXISTS idx_peppol_invoices_invoice_number ON public.peppol_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_peppol_invoices_status ON public.peppol_invoices(status);
CREATE INDEX IF NOT EXISTS idx_peppol_invoices_document_type ON public.peppol_invoices(document_type);
CREATE INDEX IF NOT EXISTS idx_peppol_invoices_peppol_message_id ON public.peppol_invoices(peppol_message_id);
CREATE INDEX IF NOT EXISTS idx_peppol_invoices_sender_id ON public.peppol_invoices(sender_id);
CREATE INDEX IF NOT EXISTS idx_peppol_invoices_receiver_id ON public.peppol_invoices(receiver_id);
CREATE INDEX IF NOT EXISTS idx_peppol_invoices_created_at ON public.peppol_invoices(created_at);

CREATE INDEX IF NOT EXISTS idx_peppol_invoice_lines_invoice_id ON public.peppol_invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_peppol_invoice_lines_line_number ON public.peppol_invoice_lines(line_number);

CREATE INDEX IF NOT EXISTS idx_peppol_validation_errors_message_id ON public.peppol_validation_errors(message_id);
CREATE INDEX IF NOT EXISTS idx_peppol_validation_errors_created_at ON public.peppol_validation_errors(created_at);
