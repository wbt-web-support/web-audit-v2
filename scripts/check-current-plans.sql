-- Check current state of plans table
-- Run this first to see what we're working with

SELECT 'Current plans in database:' as status;
SELECT 
    id,
    name,
    plan_type,
    is_active,
    created_at
FROM plans 
ORDER BY plan_type, name;

SELECT 'Plan type counts:' as status;
SELECT 
    plan_type,
    COUNT(*) as count
FROM plans 
GROUP BY plan_type
ORDER BY plan_type;
