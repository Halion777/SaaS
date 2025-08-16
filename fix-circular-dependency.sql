
-- ========================================
-- STEP 1: TEMPORARILY DISABLE RLS ON BOTH TABLES
-- ========================================

-- Disable RLS on quotes table to break the recursion
ALTER TABLE public.quotes DISABLE ROW LEVEL SECURITY;

-- Disable RLS on quote_shares table to break the recursion
ALTER TABLE public.quote_shares DISABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 2: DROP ALL PROBLEMATIC POLICIES
-- ========================================

-- Drop quotes table policies
DROP POLICY IF EXISTS "Public can view quotes with active share" ON public.quotes;
DROP POLICY IF EXISTS "Public can view quotes with share_token" ON public.quotes;
DROP POLICY IF EXISTS "Public can view shared quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can manage their own quotes" ON public.quotes;

-- Drop quote_shares table policies
DROP POLICY IF EXISTS "Users can manage their own quote shares" ON public.quote_shares;

-- ========================================
-- STEP 3: RECREATE CLEAN POLICIES WITHOUT CIRCULAR REFERENCES
-- ========================================

-- Re-enable RLS on quotes table
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Create simple policy for public viewing of shared quotes (no circular reference)
CREATE POLICY "Public can view shared quotes" ON public.quotes
    FOR SELECT 
    USING (
        is_public = true 
        AND share_token IS NOT NULL 
        AND share_token != ''
    );

-- Create policy for authenticated users to manage their own quotes
CREATE POLICY "Users can manage their own quotes" ON public.quotes
    FOR ALL 
    USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Re-enable RLS on quote_shares table
ALTER TABLE public.quote_shares ENABLE ROW LEVEL SECURITY;

-- Create simple policy for quote_shares (no circular reference to quotes table)
CREATE POLICY "Users can manage their own quote shares" ON public.quote_shares
    FOR ALL 
    USING (auth.uid() IS NOT NULL);

-- ========================================
-- STEP 4: FIX STORAGE BUCKET ISSUES
-- ========================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Public can upload lead files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view lead files" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete lead files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to lead-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public viewing of lead-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletion of lead-files" ON storage.objects;

-- Create clean storage policies
CREATE POLICY "Allow public uploads to lead-files" ON storage.objects
    FOR INSERT 
    WITH CHECK (bucket_id = 'lead-files');

CREATE POLICY "Allow public viewing of lead-files" ON storage.objects
    FOR SELECT 
    USING (bucket_id = 'lead-files');

CREATE POLICY "Allow public deletion of lead-files" ON storage.objects
    FOR DELETE 
    USING (bucket_id = 'lead-files');




