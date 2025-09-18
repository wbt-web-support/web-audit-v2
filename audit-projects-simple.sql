-- Simple Audit Projects Table Setup (No Recursion)
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

-- Simple RLS Policies for audit_projects table (No recursion)

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

-- Admins can view all audit projects (using JWT to avoid recursion)
CREATE POLICY "Admins can view all audit projects" ON public.audit_projects
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'admin'
  );

-- Admins can update all audit projects (using JWT to avoid recursion)
CREATE POLICY "Admins can update all audit projects" ON public.audit_projects
  FOR UPDATE USING (
    (auth.jwt() ->> 'role') = 'admin'
  );

-- Admins can delete all audit projects (using JWT to avoid recursion)
CREATE POLICY "Admins can delete all audit projects" ON public.audit_projects
  FOR DELETE USING (
    (auth.jwt() ->> 'role') = 'admin'
  );

-- Create updated_at trigger for audit_projects
CREATE TRIGGER update_audit_projects_updated_at
  BEFORE UPDATE ON public.audit_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Test the table
SELECT 'Audit projects table created successfully' as status;
