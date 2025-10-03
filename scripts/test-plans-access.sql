-- Test script to verify plans table access
-- Run this in Supabase SQL Editor to check if everything is working

-- Check if table exists and has data
SELECT 'Table exists' as status, COUNT(*) as plan_count FROM plans;

-- Check RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'plans';

-- Check policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'plans';

-- Test basic select (should work for everyone)
SELECT id, name, plan_type, is_active 
FROM plans 
ORDER BY sort_order;

-- Test with specific conditions
SELECT id, name, plan_type, is_active 
FROM plans 
WHERE is_active = true
ORDER BY sort_order;
