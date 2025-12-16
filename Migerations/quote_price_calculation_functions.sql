-- =====================================================
-- Centralized Quote Price Calculation Functions
-- =====================================================
-- These functions ensure consistent price calculations
-- across the application, matching the centralized
-- JavaScript utility in src/utils/quotePriceCalculator.js
-- =====================================================

-- Drop existing functions if they exist (to handle parameter name changes)
DROP FUNCTION IF EXISTS public.calculate_quote_totals(uuid);
DROP FUNCTION IF EXISTS public.calculate_quote_totals(uuid, uuid); -- Handle any variations
DROP FUNCTION IF EXISTS public.generate_invoice_number(uuid);

-- Function: calculate_quote_totals
-- Calculates total amount, tax amount, discount amount, and final amount for a quote
-- This matches the logic in calculateQuoteTotals() JavaScript function
CREATE OR REPLACE FUNCTION public.calculate_quote_totals(quote_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    subtotal DECIMAL(15,2);
    tax_rate DECIMAL(5,4);
    discount_rate DECIMAL(5,4);
    discount_enabled BOOLEAN;
    vat_enabled BOOLEAN;
    vat_amount DECIMAL(15,2);
    discount_amount DECIMAL(15,2);
    net_amount DECIMAL(15,2);
    final_amount DECIMAL(15,2);
BEGIN
    -- Calculate subtotal from tasks and materials
    -- Note: Materials use total_price (already multiplied by quantity)
    -- Tasks use total_price or calculate from quantity * unit_price
    SELECT COALESCE(SUM(item_total), 0)
    INTO subtotal
    FROM (
        -- Task totals (labor)
        SELECT COALESCE(total_price, (COALESCE(quantity, 1) * COALESCE(unit_price, 0))) AS item_total
        FROM public.quote_tasks 
        WHERE quote_id = quote_id_param
        
        UNION ALL
        
        -- Material totals (already total prices, no multiplication needed)
        SELECT COALESCE(total_price, unit_price, 0) AS item_total
        FROM public.quote_materials 
        WHERE quote_id = quote_id_param
    ) AS items;
    
    -- Get VAT and discount configuration from financial config
    SELECT 
        COALESCE((vat_config->>'display')::BOOLEAN, false),
        COALESCE((vat_config->>'rate')::DECIMAL(5,4), 0),
        COALESCE((discount_config->>'enabled')::BOOLEAN, false),
        COALESCE((discount_config->>'rate')::DECIMAL(5,4), 0)
    INTO vat_enabled, tax_rate, discount_enabled, discount_rate
    FROM public.quote_financial_configs
    WHERE quote_id = quote_id_param
    LIMIT 1;
    
    -- Calculate VAT amount (only if enabled)
    IF vat_enabled AND tax_rate > 0 THEN
        vat_amount := subtotal * (tax_rate / 100);
    ELSE
        vat_amount := 0;
    END IF;
    
    -- Calculate discount amount (only if enabled)
    IF discount_enabled AND discount_rate > 0 THEN
        discount_amount := subtotal * (discount_rate / 100);
    ELSE
        discount_amount := 0;
    END IF;
    
    -- Calculate net amount (after discount, before VAT)
    net_amount := subtotal - discount_amount;
    
    -- Calculate final amount (net amount + VAT)
    final_amount := net_amount + vat_amount;
    
    -- Update quote with calculated amounts
    UPDATE public.quotes 
    SET 
        total_amount = subtotal,
        tax_amount = vat_amount,
        discount_amount = discount_amount,
        final_amount = final_amount,
        updated_at = NOW()
    WHERE id = quote_id_param;
END;
$$;

-- Function: generate_invoice_number
-- Generates a unique invoice number for a user
-- Format: INV-000000001, INV-000000002, etc. (9 digits for future-proofing)
-- Uses advisory locks to prevent race conditions
-- Handles migration from FACT- to INV- format by checking both patterns
-- Also handles migration from 6-digit to 9-digit format seamlessly
CREATE OR REPLACE FUNCTION public.generate_invoice_number(user_id uuid)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    next_number INTEGER;
    generated_invoice_number TEXT;
    lock_key BIGINT;
    max_attempts INTEGER := 10;
    attempt INTEGER := 0;
    max_fact_number INTEGER;
    max_inv_number INTEGER;
BEGIN
    -- Generate a unique lock key based on user_id
    -- Using hashtext to convert UUID to integer for advisory lock
    lock_key := hashtext(user_id::TEXT);
    
    -- Acquire an advisory lock for this user_id
    -- This ensures only one invoice number generation happens per user at a time
    -- Other users can still generate numbers concurrently
    PERFORM pg_advisory_xact_lock(lock_key);
    
    -- Get max number from both FACT- and INV- formats to ensure continuity
    -- This handles migration from old FACT- format to new INV- format
    SELECT COALESCE(MAX(CAST(SUBSTRING(inv.invoice_number FROM 'FACT-([0-9]+)') AS INTEGER)), 0)
    INTO max_fact_number
    FROM public.invoices inv
    WHERE inv.user_id = generate_invoice_number.user_id
    AND inv.invoice_number ~ '^FACT-[0-9]+$';
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(inv.invoice_number FROM 'INV-([0-9]+)') AS INTEGER)), 0)
    INTO max_inv_number
    FROM public.invoices inv
    WHERE inv.user_id = generate_invoice_number.user_id
    AND inv.invoice_number ~ '^INV-[0-9]+$';
    
    -- Use the maximum of both formats + 1
    next_number := GREATEST(max_fact_number, max_inv_number) + 1;
    
    -- Generate new invoice number with INV- prefix (9 digits for future-proofing)
    generated_invoice_number := 'INV-' || LPAD(next_number::TEXT, 9, '0');
    
    -- Double-check that this number doesn't exist (safety check)
    -- The lock should prevent this, but this is an extra safeguard
    WHILE EXISTS (
        SELECT 1 
        FROM public.invoices inv2
        WHERE inv2.user_id = generate_invoice_number.user_id 
        AND inv2.invoice_number = generated_invoice_number
    ) LOOP
        next_number := next_number + 1;
        generated_invoice_number := 'INV-' || LPAD(next_number::TEXT, 9, '0');
        
        attempt := attempt + 1;
        IF attempt >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique invoice number after % attempts', max_attempts;
        END IF;
    END LOOP;
    
    -- Lock is automatically released when transaction commits/rolls back
    RETURN generated_invoice_number;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.calculate_quote_totals(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_invoice_number(uuid) TO authenticated;

