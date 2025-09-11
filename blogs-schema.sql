-- ========================================
-- BLOGS TABLE SCHEMA
-- ========================================

-- Create blogs table
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image TEXT, -- URL to image in storage
    category TEXT DEFAULT 'general' CHECK (category IN ('technology', 'business', 'tutorials', 'news', 'general')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    meta_title TEXT,
    meta_description TEXT,
    tags TEXT[], -- Array of tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_blogs_status ON public.blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON public.blogs(published_at);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON public.blogs(category);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON public.blogs(slug);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_blogs_updated_at 
    BEFORE UPDATE ON public.blogs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- RLS POLICIES (VERY SIMPLE)
-- ========================================

-- Enable RLS
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
DROP POLICY IF EXISTS "Anyone can read published blogs" ON public.blogs;
DROP POLICY IF EXISTS "Authenticated users can read all blogs" ON public.blogs;
DROP POLICY IF EXISTS "Superadmins can manage blogs" ON public.blogs;

-- Anyone can read published blogs (including non-authenticated users)
CREATE POLICY "Anyone can read published blogs" ON public.blogs
    FOR SELECT USING (status = 'published');

-- Only superadmins can insert/update/delete blogs
CREATE POLICY "Superadmins can manage blogs" ON public.blogs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- ========================================
-- STORAGE BUCKET SETUP
-- ========================================

-- Create public bucket for blog images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'blog-images',
    'blog-images', 
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for blog images
CREATE POLICY "Anyone can view blog images" ON storage.objects
    FOR SELECT USING (bucket_id = 'blog-images');

CREATE POLICY "Superadmins can upload blog images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'blog-images' AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

CREATE POLICY "Superadmins can update blog images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'blog-images' AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );

CREATE POLICY "Superadmins can delete blog images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'blog-images' AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'superadmin'
        )
    );
