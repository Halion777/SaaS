-- ========================================
-- SIMPLE SUPERADMIN LEAD ACCESS
-- ========================================
-- Minimal RLS policies for superadmin to access lead data

-- Superadmin can view and manage all leads
CREATE POLICY "Superadmins can manage all leads" ON public.lead_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'superadmin'
        )
    );
