-- SQL script to add images and links columns to audit_projects table
-- Run this in your Supabase SQL editor or database management tool

-- Add the images column to store aggregated image data from all pages
ALTER TABLE audit_projects 
ADD COLUMN IF NOT EXISTS images JSONB;

-- Add the links column to store aggregated link data from all pages
ALTER TABLE audit_projects 
ADD COLUMN IF NOT EXISTS links JSONB;

-- Add comments to document the columns
COMMENT ON COLUMN audit_projects.images IS 'Stores aggregated image data from all scraped pages as JSON array';
COMMENT ON COLUMN audit_projects.links IS 'Stores aggregated link data from all scraped pages as JSON array';

-- Optional: Create indexes for better query performance (if needed)
-- CREATE INDEX IF NOT EXISTS idx_audit_projects_images 
-- ON audit_projects USING GIN (images);

-- CREATE INDEX IF NOT EXISTS idx_audit_projects_links 
-- ON audit_projects USING GIN (links);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'audit_projects' 
AND column_name IN ('images', 'links');
