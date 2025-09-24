-- SQL script to add the all_pages_html column to audit_projects table
-- Run this in your Supabase SQL editor or database management tool

-- Add the all_pages_html column to store HTML content from all scraped pages
ALTER TABLE audit_projects 
ADD COLUMN IF NOT EXISTS all_pages_html JSONB;

-- Add a comment to document the column
COMMENT ON COLUMN audit_projects.all_pages_html IS 'Stores HTML content from all scraped pages as JSON array';

-- Optional: Create an index for better query performance (if needed)
-- CREATE INDEX IF NOT EXISTS idx_audit_projects_all_pages_html 
-- ON audit_projects USING GIN (all_pages_html);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'audit_projects' 
AND column_name = 'all_pages_html';
