-- Add project limits column to plans table
-- This column will store the maximum number of projects a user can create with this plan

-- Add the column
ALTER TABLE plans 
ADD COLUMN max_projects INTEGER DEFAULT 1;

-- Add a comment to explain the column
COMMENT ON COLUMN plans.max_projects IS 'Maximum number of projects a user can create with this plan. -1 means unlimited.';

-- Update existing plans with default project limits based on plan type
-- Free plans get 1 project
UPDATE plans 
SET max_projects = 1
WHERE plan_type = 'Starter';

-- Pro plans get 10 projects
UPDATE plans 
SET max_projects = 10
WHERE plan_type = 'Growth';

-- Enterprise plans get unlimited (-1)
UPDATE plans 
SET max_projects = -1
WHERE plan_type = 'Scale';

-- Verify the changes
SELECT 
  id, 
  name, 
  plan_type, 
  max_projects,
  CASE 
    WHEN max_projects = -1 THEN 'Unlimited'
    ELSE max_projects::text
  END as project_limit_display
FROM plans 
ORDER BY plan_type, sort_order;
