-- Cleanup script to remove duplicate plans
-- This script will help clean up any duplicate plans that were created

-- First, let's see what we have
SELECT 'Current plans before cleanup:' as status;
SELECT 
    id,
    name,
    plan_type,
    is_active,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY plan_type ORDER BY created_at) as row_num
FROM plans 
ORDER BY plan_type, created_at;

-- Delete duplicate plans, keeping only the first one of each type
WITH duplicate_plans AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY plan_type ORDER BY created_at) as row_num
    FROM plans
    WHERE plan_type = 'Starter'
)
DELETE FROM plans 
WHERE id IN (
    SELECT id 
    FROM duplicate_plans 
    WHERE row_num > 1
);

-- Show remaining plans after cleanup
SELECT 'Plans after cleanup:' as status;
SELECT 
    id,
    name,
    plan_type,
    is_active,
    created_at
FROM plans 
ORDER BY plan_type, created_at;

-- Show count by plan type
SELECT 'Plan counts after cleanup:' as status;
SELECT 
    plan_type,
    COUNT(*) as count
FROM plans 
GROUP BY plan_type
ORDER BY plan_type;
