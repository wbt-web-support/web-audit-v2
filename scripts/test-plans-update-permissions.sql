-- Script to test plans table update permissions
-- This will help identify if there are RLS policy issues preventing updates

-- Check current RLS policies on plans table
SELECT '--- Current RLS Policies on Plans Table ---' as status;
SELECT 
    polname as policy_name,
    polcmd as command,
    polroles::regrole[] as roles,
    polqual as using_clause,
    polwithcheck as with_check_clause
FROM pg_policy 
WHERE polrelid = 'public.plans'::regclass;

-- Check table permissions
SELECT '--- Table Permissions ---' as status;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'plans' 
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- Test update permissions (this will show if the user can update)
SELECT '--- Testing Update Permissions ---' as status;
-- This query will show if the current user can update plans
SELECT 
    has_table_privilege('plans', 'UPDATE') as can_update,
    has_table_privilege('plans', 'SELECT') as can_select,
    has_table_privilege('plans', 'INSERT') as can_insert,
    has_table_privilege('plans', 'DELETE') as can_delete;

-- Check if there are any constraints that might prevent updates
SELECT '--- Table Constraints ---' as status;
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.plans'::regclass;

-- Check current user and role
SELECT '--- Current User Info ---' as status;
SELECT 
    current_user as current_user,
    session_user as session_user,
    current_role as current_role;

-- Test a simple update to see what happens
SELECT '--- Testing Simple Update ---' as status;
-- This will attempt a simple update to see if it works
UPDATE plans 
SET updated_at = NOW() 
WHERE id = (SELECT id FROM plans LIMIT 1)
RETURNING id, name, updated_at;

-- If the above fails, check for specific error messages
SELECT '--- Update Test Complete ---' as status;
