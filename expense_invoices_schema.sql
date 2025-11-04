-- Expense Invoices Database Schema
-- Essential tables for expense invoice management with file uploads

-- Main expense invoices table
CREATE TABLE expense_invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_email VARCHAR(255),
    supplier_vat_number VARCHAR(50),
    amount DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2),
    vat_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    category TEXT,
    source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual', 'peppol')),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    payment_method VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: File attachments are stored directly in Supabase Storage (invoice-uploads bucket)
-- No database table is needed for attachment metadata

-- Basic indexes for performance
CREATE INDEX idx_expense_invoices_status ON expense_invoices(status);
CREATE INDEX idx_expense_invoices_category ON expense_invoices(category);
CREATE INDEX idx_expense_invoices_issue_date ON expense_invoices(issue_date);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_expense_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_expense_invoices_updated_at 
    BEFORE UPDATE ON expense_invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_expense_column();


