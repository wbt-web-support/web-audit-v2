-- SQL script to add performance_analysis column to scraped_pages table
-- Run this in your Supabase SQL editor or database management tool

-- Add the performance_analysis column to store PageSpeed Insights analysis results
ALTER TABLE scraped_pages 
ADD COLUMN IF NOT EXISTS performance_analysis JSONB;

-- Add comment to document the column
COMMENT ON COLUMN scraped_pages.performance_analysis IS 'Stores PageSpeed Insights analysis results including performance scores, metrics, and recommendations';

-- Optional: Create index for better query performance (if needed)
-- CREATE INDEX IF NOT EXISTS idx_scraped_pages_performance_analysis 
-- ON scraped_pages USING GIN (performance_analysis);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'scraped_pages' 
AND column_name = 'performance_analysis';
