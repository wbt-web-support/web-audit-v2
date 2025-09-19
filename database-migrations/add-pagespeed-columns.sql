-- Add PageSpeed Insights columns to audit_projects table
-- Run this SQL in your Supabase SQL editor or database management tool

-- Add the new columns for PageSpeed Insights data
ALTER TABLE audit_projects 
ADD COLUMN IF NOT EXISTS pagespeed_insights_data JSONB,
ADD COLUMN IF NOT EXISTS pagespeed_insights_loading BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pagespeed_insights_error TEXT;

-- Add comments to document the new columns
COMMENT ON COLUMN audit_projects.pagespeed_insights_data IS 'Stores the complete PageSpeed Insights API response data';
COMMENT ON COLUMN audit_projects.pagespeed_insights_loading IS 'Indicates if PageSpeed Insights data is currently being fetched';
COMMENT ON COLUMN audit_projects.pagespeed_insights_error IS 'Stores any error message from PageSpeed Insights API call';

-- Create an index on the JSONB column for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_projects_pagespeed_data 
ON audit_projects USING GIN (pagespeed_insights_data);

-- Optional: Add a check constraint to ensure loading is boolean
ALTER TABLE audit_projects 
ADD CONSTRAINT chk_pagespeed_loading_boolean 
CHECK (pagespeed_insights_loading IN (TRUE, FALSE));

-- Verify the columns were added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'audit_projects' 
AND column_name LIKE 'pagespeed%'
ORDER BY column_name;
