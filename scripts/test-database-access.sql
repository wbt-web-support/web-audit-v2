-- Test database access and RLS policies
-- Run this in Supabase SQL Editor to verify everything is working

-- Test 1: Check if we can read plans (should work for everyone)
SELECT 'Test 1: Reading plans' as test_name;
SELECT COUNT(*) as plan_count FROM plans WHERE is_active = true;

-- Test 2: Check if we can read all plans (should work for authenticated users)
SELECT 'Test 2: Reading all plans' as test_name;
SELECT COUNT(*) as total_plans FROM plans;

-- Test 3: Check RLS policies
SELECT 'Test 3: Checking RLS policies' as test_name;
SELECT 
  policyname,
  cmd,
  roles,
  permissive
FROM pg_policies 
WHERE tablename = 'plans'
ORDER BY policyname;

-- Test 4: Check table permissions
SELECT 'Test 4: Checking table permissions' as test_name;
SELECT 
  grantee,
  privilege_type
FROM information_schema.table_privileges 
WHERE table_name = 'plans'
ORDER BY grantee, privilege_type;

-- Test 5: Try to insert a test plan (should work for admins)
SELECT 'Test 5: Testing insert permissions' as test_name;
-- This will only work if you're logged in as an admin
INSERT INTO plans (name, description, plan_type, amount, currency, interval_type, features, limits, is_active, is_popular, color, sort_order) 
VALUES (
  'Test Plan',
  'Test plan for database testing',
  'free',
  0,
  'INR',
  'monthly',
  '[]'::jsonb,
  '{}'::jsonb,
  true,
  false,
  'gray',
  999
) 
ON CONFLICT DO NOTHING;

-- Test 6: Check if test plan was inserted
SELECT 'Test 6: Checking test plan' as test_name;
SELECT id, name, plan_type FROM plans WHERE name = 'Test Plan';

-- Test 7: Clean up test plan
SELECT 'Test 7: Cleaning up test plan' as test_name;
DELETE FROM plans WHERE name = 'Test Plan';

-- Test 8: Final verification
SELECT 'Test 8: Final verification' as test_name;
SELECT COUNT(*) as final_plan_count FROM plans WHERE is_active = true;
