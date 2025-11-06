-- Add image_scan_credits column to users table
-- This column stores the number of credits available for image scanning

ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS image_scan_credits INTEGER NOT NULL DEFAULT 0;

-- Add comment to column
COMMENT ON COLUMN public.users.image_scan_credits IS 'Number of credits available for reverse image search scans. Each scan costs 1 credit.';

-- Create index for querying users by credits (optional, for admin queries)
CREATE INDEX IF NOT EXISTS idx_users_image_scan_credits ON public.users (image_scan_credits);

-- Optional: Add a check constraint to ensure credits are non-negative
ALTER TABLE IF EXISTS public.users
  ADD CONSTRAINT IF NOT EXISTS check_image_scan_credits_non_negative 
  CHECK (image_scan_credits >= 0);

