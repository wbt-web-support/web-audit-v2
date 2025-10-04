-- Simple debugging script for plans table (no pg_cron required)

SELECT '--- Current Plan Count ---' as section;
SELECT COUNT(*) as total_plans FROM plans;

SELECT '--- Plans by Type ---' as section;
SELECT 
    plan_type,
    COUNT(*) as count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM plans 
GROUP BY plan_type 
ORDER BY plan_type;

SELECT '--- Recent Plans (last 10) ---' as section;
SELECT 
    id,
    name,
    plan_type,
    created_at,
    created_by
FROM plans 
ORDER BY created_at DESC 
LIMIT 10;

SELECT '--- Plans Created Today ---' as section;
SELECT COUNT(*) as plans_created_today
FROM plans 
WHERE created_at >= CURRENT_DATE;

SELECT '--- Plans Created in Last Hour ---' as section;
SELECT COUNT(*) as plans_created_last_hour
FROM plans 
WHERE created_at >= NOW() - INTERVAL '1 hour';

SELECT '--- Plans Created in Last 10 Minutes ---' as section;
SELECT COUNT(*) as plans_created_last_10_minutes
FROM plans 
WHERE created_at >= NOW() - INTERVAL '10 minutes';

SELECT '--- Plans with Same Name and Type ---' as section;
SELECT 
    name,
    plan_type,
    COUNT(*) as duplicate_count
FROM plans 
GROUP BY name, plan_type 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

SELECT '--- End of Simple Debug Script ---' as section;
