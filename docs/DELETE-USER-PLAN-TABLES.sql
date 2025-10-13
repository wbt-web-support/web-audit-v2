-- SQL Script to Delete user_plan_info and user_plan_details tables
-- Execute this script carefully as it will permanently delete data

-- Step 1: Drop foreign key constraints first (if any exist)
-- This prevents foreign key constraint errors during deletion

-- Check and drop foreign keys from user_plan_details that reference user_plan_info
DO $$ 
BEGIN
    -- Drop foreign key constraints that might reference user_plan_info
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'user_plan_details'
        AND constraint_name LIKE '%user_plan_info%'
    ) THEN
        ALTER TABLE user_plan_details DROP CONSTRAINT IF EXISTS fk_user_plan_details_user_plan_info;
    END IF;
END $$;

-- Check and drop foreign keys from other tables that might reference these tables
DO $$ 
BEGIN
    -- Drop any foreign keys that reference user_plan_info
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND constraint_name LIKE '%user_plan_info%'
    ) THEN
        -- This will need to be customized based on your actual foreign key names
        -- ALTER TABLE other_table_name DROP CONSTRAINT IF EXISTS fk_other_table_user_plan_info;
    END IF;
END $$;

-- Step 2: Delete the tables/views
-- Order matters: delete dependent objects first, then the referenced objects

-- Delete user_plan_details first (check if it's a view or table)
DO $$ 
BEGIN
    -- Check if user_plan_details is a view
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'user_plan_details'
    ) THEN
        DROP VIEW IF EXISTS user_plan_details CASCADE;
    ELSE
        -- If it's a table
        DROP TABLE IF EXISTS user_plan_details CASCADE;
    END IF;
END $$;

-- Delete user_plan_info (check if it's a view or table)
DO $$ 
BEGIN
    -- Check if user_plan_info is a view
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'user_plan_info'
    ) THEN
        DROP VIEW IF EXISTS user_plan_info CASCADE;
    ELSE
        -- If it's a table
        DROP TABLE IF EXISTS user_plan_info CASCADE;
    END IF;
END $$;

-- Step 3: Verify deletion
-- Check if tables/views still exist
SELECT 
    'table' as object_type,
    table_name as object_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_plan_info', 'user_plan_details')

UNION ALL

SELECT 
    'view' as object_type,
    table_name as object_name
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('user_plan_info', 'user_plan_details');

-- If the above query returns no rows, the tables/views have been successfully deleted

-- Optional: Clean up any related sequences, indexes, or other database objects
-- (Add specific cleanup commands here if needed)

COMMIT;
