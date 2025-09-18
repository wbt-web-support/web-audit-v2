-- Add Technologies fields to audit_projects table
-- Run this in your Supabase SQL editor

-- Add technologies detection and details columns
ALTER TABLE public.audit_projects 
ADD COLUMN IF NOT EXISTS technologies JSONB,
ADD COLUMN IF NOT EXISTS technologies_confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (technologies_confidence >= 0.0 AND technologies_confidence <= 1.0),
ADD COLUMN IF NOT EXISTS technologies_detection_method TEXT,
ADD COLUMN IF NOT EXISTS technologies_metadata JSONB;

-- Create indexes for technologies-related queries
CREATE INDEX IF NOT EXISTS idx_audit_projects_technologies ON public.audit_projects USING GIN (technologies);
CREATE INDEX IF NOT EXISTS idx_audit_projects_technologies_confidence ON public.audit_projects(technologies_confidence);

-- Add comments for documentation
COMMENT ON COLUMN public.audit_projects.technologies IS 'Array of detected technologies with metadata (name, version, confidence, category)';
COMMENT ON COLUMN public.audit_projects.technologies_confidence IS 'Overall confidence score for technology detection (0.0 to 1.0)';
COMMENT ON COLUMN public.audit_projects.technologies_detection_method IS 'Method used to detect technologies (e.g., meta_tags, scripts, headers)';
COMMENT ON COLUMN public.audit_projects.technologies_metadata IS 'Additional technology detection metadata and statistics';
