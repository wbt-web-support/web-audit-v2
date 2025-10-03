-- Debug plan update issue
-- Run this in Supabase SQL Editor to diagnose the problem

-- 1. Check current plans
SELECT 'Current plans in database:' as status;
SELECT id, name, plan_type, is_active, created_at, updated_at 
FROM plans 
ORDER BY created_at;

-- 2. Check if we can read plans as current user
SELECT 'Testing read access:' as status;
SELECT COUNT(*) as plan_count FROM plans;

-- 3. Check RLS policies
SELECT 'Current RLS policies:' as status;
SELECT 
  policyname,
  cmd,
  roles,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'plans'
ORDER BY policyname;

-- 4. Test update on first plan (if exists)
SELECT 'Testing update access:' as status;
DO $$
DECLARE
    plan_id UUID;
    update_result INTEGER;
BEGIN
    -- Get first plan ID
    SELECT id INTO plan_id FROM plans LIMIT 1;
    
    IF plan_id IS NOT NULL THEN
        -- Try to update
        UPDATE plans 
        SET updated_at = NOW() 
        WHERE id = plan_id;
        
        GET DIAGNOSTICS update_result = ROW_COUNT;
        
        IF update_result > 0 THEN
            RAISE NOTICE 'Update successful for plan %', plan_id;
        ELSE
            RAISE NOTICE 'Update failed - no rows affected for plan %', plan_id;
        END IF;
    ELSE
        RAISE NOTICE 'No plans found in database';
    END IF;
END $$;

-- 5. Check user permissions
SELECT 'User permissions:' as status;
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'plans'
ORDER BY grantee, privilege_type;
