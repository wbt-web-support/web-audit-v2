-- Audit Projects Table Setup
-- Run this in your Supabase SQL editor

-- Create audit_projects table
CREATE TABLE IF NOT EXISTS public.audit_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  site_url TEXT NOT NULL,
  page_type TEXT NOT NULL CHECK (page_type IN ('single', 'multiple')),
  brand_consistency BOOLEAN DEFAULT FALSE,
  hidden_urls BOOLEAN DEFAULT FALSE,
  keys_check BOOLEAN DEFAULT FALSE,
  
  -- Brand consistency data (stored as JSONB for flexibility)
  brand_data JSONB,
  
  -- Hidden URLs data (stored as JSONB array)
  hidden_urls_data JSONB,
  
  -- Project status and metadata
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  issues_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_audit_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_projects_user_id ON public.audit_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_projects_status ON public.audit_projects(status);
CREATE INDEX IF NOT EXISTS idx_audit_projects_created_at ON public.audit_projects(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_projects_site_url ON public.audit_projects(site_url);

-- Enable Row Level Security
ALTER TABLE public.audit_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_projects table

-- Users can view their own audit projects
CREATE POLICY "Users can view own audit projects" ON public.audit_projects
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own audit projects
CREATE POLICY "Users can create own audit projects" ON public.audit_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own audit projects
CREATE POLICY "Users can update own audit projects" ON public.audit_projects
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own audit projects
CREATE POLICY "Users can delete own audit projects" ON public.audit_projects
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all audit projects
CREATE POLICY "Admins can view all audit projects" ON public.audit_projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all audit projects
CREATE POLICY "Admins can update all audit projects" ON public.audit_projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete all audit projects
CREATE POLICY "Admins can delete all audit projects" ON public.audit_projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to get user's audit projects
CREATE OR REPLACE FUNCTION public.get_user_audit_projects()
RETURNS TABLE (
  id UUID,
  site_url TEXT,
  page_type TEXT,
  brand_consistency BOOLEAN,
  hidden_urls BOOLEAN,
  keys_check BOOLEAN,
  brand_data JSONB,
  hidden_urls_data JSONB,
  status TEXT,
  progress INTEGER,
  score INTEGER,
  issues_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  last_audit_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.id,
    ap.site_url,
    ap.page_type,
    ap.brand_consistency,
    ap.hidden_urls,
    ap.keys_check,
    ap.brand_data,
    ap.hidden_urls_data,
    ap.status,
    ap.progress,
    ap.score,
    ap.issues_count,
    ap.created_at,
    ap.updated_at,
    ap.last_audit_at
  FROM public.audit_projects ap
  WHERE ap.user_id = auth.uid()
  ORDER BY ap.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create new audit project
CREATE OR REPLACE FUNCTION public.create_audit_project(
  p_site_url TEXT,
  p_page_type TEXT,
  p_brand_consistency BOOLEAN DEFAULT FALSE,
  p_hidden_urls BOOLEAN DEFAULT FALSE,
  p_keys_check BOOLEAN DEFAULT FALSE,
  p_brand_data JSONB DEFAULT NULL,
  p_hidden_urls_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  project_id UUID;
BEGIN
  INSERT INTO public.audit_projects (
    user_id,
    site_url,
    page_type,
    brand_consistency,
    hidden_urls,
    keys_check,
    brand_data,
    hidden_urls_data
  ) VALUES (
    auth.uid(),
    p_site_url,
    p_page_type,
    p_brand_consistency,
    p_hidden_urls,
    p_keys_check,
    p_brand_data,
    p_hidden_urls_data
  ) RETURNING id INTO project_id;
  
  RETURN project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update audit project
CREATE OR REPLACE FUNCTION public.update_audit_project(
  p_id UUID,
  p_site_url TEXT DEFAULT NULL,
  p_page_type TEXT DEFAULT NULL,
  p_brand_consistency BOOLEAN DEFAULT NULL,
  p_hidden_urls BOOLEAN DEFAULT NULL,
  p_keys_check BOOLEAN DEFAULT NULL,
  p_brand_data JSONB DEFAULT NULL,
  p_hidden_urls_data JSONB DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_progress INTEGER DEFAULT NULL,
  p_score INTEGER DEFAULT NULL,
  p_issues_count INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.audit_projects 
  SET 
    site_url = COALESCE(p_site_url, site_url),
    page_type = COALESCE(p_page_type, page_type),
    brand_consistency = COALESCE(p_brand_consistency, brand_consistency),
    hidden_urls = COALESCE(p_hidden_urls, hidden_urls),
    keys_check = COALESCE(p_keys_check, keys_check),
    brand_data = COALESCE(p_brand_data, brand_data),
    hidden_urls_data = COALESCE(p_hidden_urls_data, hidden_urls_data),
    status = COALESCE(p_status, status),
    progress = COALESCE(p_progress, progress),
    score = COALESCE(p_score, score),
    issues_count = COALESCE(p_issues_count, issues_count),
    updated_at = NOW(),
    last_audit_at = CASE 
      WHEN p_status = 'completed' OR p_status = 'in_progress' THEN NOW()
      ELSE last_audit_at
    END
  WHERE id = p_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to delete audit project
CREATE OR REPLACE FUNCTION public.delete_audit_project(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM public.audit_projects 
  WHERE id = p_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at trigger for audit_projects
CREATE TRIGGER update_audit_projects_updated_at
  BEFORE UPDATE ON public.audit_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
