-- SQL script to add images and links columns to scraped_pages table
-- Run this in your Supabase SQL editor or database management tool

-- Add the images column to store actual image data
ALTER TABLE scraped_pages 
ADD COLUMN IF NOT EXISTS images JSONB;

-- Add the links column to store actual link data
ALTER TABLE scraped_pages 
ADD COLUMN IF NOT EXISTS links JSONB;

-- Add comments to document the columns
COMMENT ON COLUMN scraped_pages.images IS 'Stores actual image data as JSON array with src, alt, title, width, height, etc.';
COMMENT ON COLUMN scraped_pages.links IS 'Stores actual link data as JSON array with href, text, title, target, etc.';

-- Optional: Create indexes for better query performance (if needed)
-- CREATE INDEX IF NOT EXISTS idx_scraped_pages_images 
-- ON scraped_pages USING GIN (images);

-- CREATE INDEX IF NOT EXISTS idx_scraped_pages_links 
-- ON scraped_pages USING GIN (links);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'scraped_pages' 
AND column_name IN ('images', 'links');
