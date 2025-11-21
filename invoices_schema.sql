-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Invoices table for storing invoice information
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) NOT NULL,
    quote_number VARCHAR(50),
    title TEXT,
    description TEXT,
    status VARCHAR(50) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'overdue', 'cancelled')),
    amount DECIMAL(15,2) NOT NULL,
    net_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    final_amount DECIMAL(15,2) NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    payment_method VARCHAR(100),
    payment_terms TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    converted_from_quote_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON public.invoices(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_net_amount ON public.invoices(net_amount);

-- Create composite unique constraint (user_id, invoice_number)
-- This ensures invoice numbers are unique per user, not globally
-- Different users can have the same invoice number (e.g., both can have FACT-000001)
ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_invoice_number_key;

ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_user_id_invoice_number_key 
UNIQUE (user_id, invoice_number);

-- Create composite index for the unique constraint
CREATE INDEX IF NOT EXISTS idx_invoices_user_id_invoice_number 
ON public.invoices(user_id, invoice_number);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_invoice_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON public.invoices 
    FOR EACH ROW EXECUTE FUNCTION update_invoice_updated_at_column();

-- Function to generate unique invoice numbers per user
-- Uses advisory locks to prevent race conditions during concurrent requests
CREATE OR REPLACE FUNCTION generate_invoice_number(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    generated_invoice_number TEXT;  -- Renamed to avoid conflict with column name
    lock_key BIGINT;
    max_attempts INTEGER := 10;
    attempt INTEGER := 0;
BEGIN
    -- Generate a unique lock key based on user_id
    -- Using hashtext to convert UUID to integer for advisory lock
    lock_key := hashtext(user_id::TEXT);
    
    -- Acquire an advisory lock for this user_id
    -- This ensures only one invoice number generation happens per user at a time
    -- Other users can still generate numbers concurrently
    PERFORM pg_advisory_xact_lock(lock_key);
    
    -- Now safely get the next number (no race condition possible)
    SELECT COALESCE(MAX(CAST(SUBSTRING(inv.invoice_number FROM 'FACT-([0-9]+)') AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.invoices inv
    WHERE inv.user_id = $1;
    
    generated_invoice_number := 'FACT-' || LPAD(next_number::TEXT, 6, '0');
    
    -- Double-check that this number doesn't exist (safety check)
    -- The lock should prevent this, but this is an extra safeguard
    -- FIXED: Use renamed variable to avoid ambiguity with column name
    WHILE EXISTS (
        SELECT 1 
        FROM public.invoices inv2
        WHERE inv2.user_id = $1 
        AND inv2.invoice_number = generated_invoice_number
    ) LOOP
        next_number := next_number + 1;
        generated_invoice_number := 'FACT-' || LPAD(next_number::TEXT, 6, '0');
        
        attempt := attempt + 1;
        IF attempt >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique invoice number after % attempts', max_attempts;
        END IF;
    END LOOP;
    
    -- Lock is automatically released when transaction commits/rolls back
    RETURN generated_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Public can view invoices" ON public.invoices
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own invoices" ON public.invoices
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own invoices" ON public.invoices
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own invoices" ON public.invoices
    FOR DELETE USING (user_id = auth.uid());