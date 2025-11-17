-- Add image_scan_credits column to plans table
-- This column stores the number of free image scan credits provided with each plan

ALTER TABLE IF EXISTS public.plans
  ADD COLUMN IF NOT EXISTS image_scan_credits INTEGER NOT NULL DEFAULT 0;

-- Add comment to column
COMMENT ON COLUMN public.plans.image_scan_credits IS 'Number of free image scan credits provided with this plan when user subscribes or updates their plan.';

-- Optional: Add a check constraint to ensure credits are non-negative
ALTER TABLE IF EXISTS public.plans
  DROP CONSTRAINT IF EXISTS check_plans_image_scan_credits_non_negative;

ALTER TABLE IF EXISTS public.plans
  ADD CONSTRAINT check_plans_image_scan_credits_non_negative 
  CHECK (image_scan_credits >= 0);

