-- Debug script for admin alerts authentication issues
-- Run this in your Supabase SQL Editor to diagnose the problem

-- 1. Check if admin_alerts table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'admin_alerts';

-- 2. Check current user roles
SELECT id, email, role, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check RLS status on admin_alerts table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'admin_alerts';

-- 4. Check existing RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'admin_alerts';

-- 5. Test if we can insert into admin_alerts (this will show RLS errors)
-- Uncomment the line below to test:
-- INSERT INTO admin_alerts (title, message, alert_type, severity, created_by) 
-- VALUES ('Test Alert', 'This is a test', 'info', 'low', (SELECT id FROM users WHERE role = 'admin' LIMIT 1));

-- 6. Check if there are any users with admin role
SELECT COUNT(*) as admin_count 
FROM users 
WHERE role = 'admin';

-- 7. Show all users and their roles
SELECT id, email, role, 
       CASE 
         WHEN role = 'admin' THEN '✅ Admin'
         WHEN role = 'user' THEN '👤 User' 
         WHEN role = 'moderator' THEN '🛡️ Moderator'
         ELSE '❓ Unknown'
       END as role_status
FROM users 
ORDER BY role, created_at DESC;
