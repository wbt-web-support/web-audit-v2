-- Check admin role setup
-- Run this in Supabase SQL Editor to verify admin role configuration

-- Check current user's role
SELECT 
  auth.uid() as current_user_id,
  u.email,
  u.raw_user_meta_data->>'role' as user_meta_role,
  u.raw_app_meta_data->>'role' as app_meta_role,
  u.raw_user_meta_data,
  u.raw_app_meta_data
FROM auth.users u
WHERE u.id = auth.uid();

-- Check if there are any users with admin role
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as user_meta_role,
  raw_app_meta_data->>'role' as app_meta_role
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'admin' 
   OR raw_app_meta_data->>'role' = 'admin';

-- Test RLS policy for plans table
SELECT 'Testing RLS policies...' as status;

-- This should work if you're an admin
SELECT COUNT(*) as plans_count FROM plans;

-- This should work if you're an admin (update test)
UPDATE plans 
SET updated_at = NOW() 
WHERE id = (SELECT id FROM plans LIMIT 1)
RETURNING id, name, updated_at;
