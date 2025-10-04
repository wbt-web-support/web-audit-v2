-- Script to verify RLS policies on the plans table

-- Check if RLS is enabled
SELECT '--- RLS Status ---' as section;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'plans';

-- List all policies on the plans table
SELECT '--- RLS Policies ---' as section;
SELECT 
    polname as policy_name,
    polcmd as command,
    polroles::regrole[] as roles,
    polqual as using_clause,
    polwithcheck as with_check_clause
FROM pg_policy 
WHERE polrelid = 'public.plans'::regclass;

-- Check table permissions
SELECT '--- Table Permissions ---' as section;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'plans' 
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- Check constraints
SELECT '--- Table Constraints ---' as section;
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.plans'::regclass;

-- Check indexes
SELECT '--- Table Indexes ---' as section;
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'plans' 
AND schemaname = 'public';

-- Test data access (this should work for everyone)
SELECT '--- Test Data Access ---' as section;
SELECT COUNT(*) as total_plans FROM plans;

-- Show current plans
SELECT '--- Current Plans ---' as section;
SELECT 
    id,
    name,
    plan_type,
    price,
    max_projects,
    is_active,
    created_at
FROM plans 
ORDER BY plan_type;
