-- Add CMS-specific fields to audit_projects table
-- Run this in your Supabase SQL editor

-- Add CMS detection and details columns
ALTER TABLE public.audit_projects 
ADD COLUMN IF NOT EXISTS cms_type TEXT,
ADD COLUMN IF NOT EXISTS cms_version TEXT,
ADD COLUMN IF NOT EXISTS cms_plugins JSONB,
ADD COLUMN IF NOT EXISTS cms_themes JSONB,
ADD COLUMN IF NOT EXISTS cms_components JSONB,
ADD COLUMN IF NOT EXISTS cms_confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (cms_confidence >= 0.0 AND cms_confidence <= 1.0),
ADD COLUMN IF NOT EXISTS cms_detection_method TEXT,
ADD COLUMN IF NOT EXISTS cms_metadata JSONB;

-- Create indexes for CMS-related queries
CREATE INDEX IF NOT EXISTS idx_audit_projects_cms_type ON public.audit_projects(cms_type);
CREATE INDEX IF NOT EXISTS idx_audit_projects_cms_detected ON public.audit_projects(cms_detected);
CREATE INDEX IF NOT EXISTS idx_audit_projects_cms_confidence ON public.audit_projects(cms_confidence);

-- Add comments for documentation
COMMENT ON COLUMN public.audit_projects.cms_type IS 'Type of CMS detected (e.g., WordPress, Drupal, Joomla)';
COMMENT ON COLUMN public.audit_projects.cms_version IS 'Version of the detected CMS';
COMMENT ON COLUMN public.audit_projects.cms_plugins IS 'Array of detected CMS plugins with metadata';
COMMENT ON COLUMN public.audit_projects.cms_themes IS 'Array of detected CMS themes with metadata';
COMMENT ON COLUMN public.audit_projects.cms_components IS 'Array of detected CMS components/modules';
COMMENT ON COLUMN public.audit_projects.cms_confidence IS 'Confidence score for CMS detection (0.0 to 1.0)';
COMMENT ON COLUMN public.audit_projects.cms_detection_method IS 'Method used to detect CMS (e.g., meta_tags, file_structure, api_endpoints)';
COMMENT ON COLUMN public.audit_projects.cms_metadata IS 'Additional CMS-related metadata and configuration';
