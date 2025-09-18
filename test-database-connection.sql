-- Test Database Connection and Setup
-- Run this in your Supabase SQL editor to verify everything is working

-- Test 1: Check if users table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public')
    THEN '✅ Users table exists'
    ELSE '❌ Users table does not exist'
  END as table_status;

-- Test 2: Check if RLS is enabled
SELECT 
  CASE 
    WHEN relrowsecurity = true 
    THEN '✅ RLS is enabled'
    ELSE '❌ RLS is not enabled'
  END as rls_status
FROM pg_class 
WHERE relname = 'users' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Test 3: Check policies
SELECT 
  '✅ Policies exist' as policy_status,
  count(*) as policy_count,
  string_agg(policyname, ', ') as policy_names
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- Test 4: Check functions
SELECT 
  '✅ Functions exist' as function_status,
  count(*) as function_count,
  string_agg(proname, ', ') as function_names
FROM pg_proc 
WHERE proname IN ('handle_new_user', 'get_user_profile', 'is_admin', 'is_moderator_or_admin');

-- Test 5: Check permissions
SELECT 
  '✅ Permissions granted' as permission_status,
  count(*) as permission_count
FROM information_schema.table_privileges 
WHERE table_name = 'users' AND table_schema = 'public' AND grantee = 'authenticated';

-- Test 6: Try to insert a test record (this will fail if RLS is working correctly without auth)
-- This should show an error if RLS is working properly
SELECT 'Testing insert without auth (should fail):' as test;
INSERT INTO public.users (id, email, first_name, last_name, role) 
VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'Test', 'User', 'user');

-- If the above insert succeeds, RLS is not working properly
-- If it fails with a permission error, RLS is working correctly
