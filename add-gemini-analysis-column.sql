-- SQL script to add gemini_analysis column to scraped_pages table
-- Run this in your Supabase SQL editor or database management tool

-- Add the gemini_analysis column to store Gemini AI analysis results
ALTER TABLE scraped_pages 
ADD COLUMN IF NOT EXISTS gemini_analysis JSONB;

-- Add comment to document the column
COMMENT ON COLUMN scraped_pages.gemini_analysis IS 'Stores Gemini AI analysis results including grammar, consistency, and readability scores with detailed issues and recommendations';

-- Optional: Create index for better query performance (if needed)
-- CREATE INDEX IF NOT EXISTS idx_scraped_pages_gemini_analysis 
-- ON scraped_pages USING GIN (gemini_analysis);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'scraped_pages' 
AND column_name = 'gemini_analysis';
