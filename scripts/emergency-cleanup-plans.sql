-- EMERGENCY CLEANUP SCRIPT FOR PLANS TABLE
-- This will remove duplicate plans and keep only one of each type

-- IMPORTANT: BACKUP YOUR DATABASE BEFORE RUNNING THIS!
-- CREATE TABLE plans_backup AS SELECT * FROM plans;

SELECT '--- Starting Emergency Cleanup ---' as status;

-- Step 1: Show what will be deleted
SELECT '--- Plans to be deleted (duplicates) ---' as section;
SELECT 
    p.id,
    p.name,
    p.plan_type,
    p.created_at,
    'WILL BE DELETED' as action
FROM plans p
JOIN (
    SELECT plan_type, MIN(created_at) as min_created_at
    FROM plans
    GROUP BY plan_type
    HAVING COUNT(*) > 1
) AS duplicates ON p.plan_type = duplicates.plan_type 
WHERE p.created_at > duplicates.min_created_at
ORDER BY p.plan_type, p.created_at;

-- Step 2: Count how many will be deleted
SELECT '--- Count of plans to be deleted ---' as section;
SELECT COUNT(*) as plans_to_delete
FROM plans p
JOIN (
    SELECT plan_type, MIN(created_at) as min_created_at
    FROM plans
    GROUP BY plan_type
    HAVING COUNT(*) > 1
) AS duplicates ON p.plan_type = duplicates.plan_type 
WHERE p.created_at > duplicates.min_created_at;

-- Step 3: ACTUAL DELETION (uncomment to execute)
-- DELETE FROM plans
-- WHERE id IN (
--     SELECT p.id
--     FROM plans p
--     JOIN (
--         SELECT plan_type, MIN(created_at) as min_created_at
--         FROM plans
--         GROUP BY plan_type
--         HAVING COUNT(*) > 1
--     ) AS duplicates ON p.plan_type = duplicates.plan_type 
--     WHERE p.created_at > duplicates.min_created_at
-- );

SELECT '--- Cleanup script ready ---' as status;
SELECT 'Uncomment the DELETE statement above to execute the cleanup' as status;
SELECT 'This will keep only the OLDEST plan of each type' as status;
