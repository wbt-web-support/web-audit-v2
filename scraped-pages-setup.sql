-- Create scraped-pages table
CREATE TABLE IF NOT EXISTS public.scraped_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_project_id UUID REFERENCES public.audit_projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    status_code INTEGER,
    title TEXT,
    description TEXT,
    html_content TEXT,
    html_content_length INTEGER,
    links_count INTEGER DEFAULT 0,
    images_count INTEGER DEFAULT 0,
    meta_tags_count INTEGER DEFAULT 0,
    technologies_count INTEGER DEFAULT 0,
    technologies TEXT[],
    cms_type TEXT,
    cms_version TEXT,
    cms_plugins TEXT[],
    is_external BOOLEAN DEFAULT false,
    response_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scraped_pages_audit_project_id ON public.scraped_pages(audit_project_id);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_user_id ON public.scraped_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_url ON public.scraped_pages(url);

-- Enable RLS
ALTER TABLE public.scraped_pages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own scraped pages" ON public.scraped_pages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scraped pages" ON public.scraped_pages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scraped pages" ON public.scraped_pages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scraped pages" ON public.scraped_pages
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_scraped_pages_updated_at 
    BEFORE UPDATE ON public.scraped_pages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
