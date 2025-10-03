-- Test script to check if plans table exists and is accessible
-- Run this in Supabase SQL Editor to debug the issue

-- Check if plans table exists
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename = 'plans';

-- Check table structure if it exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'plans'
ORDER BY ordinal_position;

-- Check RLS policies on plans table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'plans';

-- Test basic select (this should work if table exists and policies are correct)
SELECT COUNT(*) as plan_count FROM plans;

-- Test select with specific fields
SELECT id, name, plan_type, is_active FROM plans LIMIT 5;
