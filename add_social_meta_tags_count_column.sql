-- Column already exists, just update existing records
-- Update existing records to calculate the count from social_meta_tags JSONB column
UPDATE public.scraped_pages 
SET social_meta_tags_count = COALESCE(jsonb_array_length(social_meta_tags), 0)
WHERE social_meta_tags IS NOT NULL;

-- Set default value for records where social_meta_tags is null
UPDATE public.scraped_pages 
SET social_meta_tags_count = 0
WHERE social_meta_tags IS NULL;

-- Add index for better query performance (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_scraped_pages_social_meta_tags_count 
ON public.scraped_pages (social_meta_tags_count) 
TABLESPACE pg_default;
