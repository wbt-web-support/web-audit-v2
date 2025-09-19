-- Add SEO analysis column to audit_projects table
-- Run this SQL in your Supabase SQL editor or database management tool

-- Add the new column for SEO analysis data
ALTER TABLE audit_projects 
ADD COLUMN IF NOT EXISTS seo_analysis JSONB;

-- Add comment to document the new column
COMMENT ON COLUMN audit_projects.seo_analysis IS 'Stores the complete SEO analysis results including score, issues, and recommendations';

-- Create an index on the JSONB column for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_projects_seo_analysis 
ON audit_projects USING GIN (seo_analysis);

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'audit_projects' 
AND column_name = 'seo_analysis'
ORDER BY column_name;
