-- Script to add sort_order column to plans table if it doesn't exist
-- This will fix the ordering issue in the API

-- Check if sort_order column exists
SELECT '--- Checking if sort_order column exists ---' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'plans' 
AND column_name = 'sort_order';

-- Add sort_order column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'plans' 
        AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE plans ADD COLUMN sort_order INTEGER DEFAULT 0;
        RAISE NOTICE 'Added sort_order column to plans table';
        
        -- Set default sort order based on plan type
        UPDATE plans SET sort_order = 1 WHERE plan_type = 'Starter';
        UPDATE plans SET sort_order = 2 WHERE plan_type = 'Growth';
        UPDATE plans SET sort_order = 3 WHERE plan_type = 'Scale';
        
        RAISE NOTICE 'Set default sort order values';
    ELSE
        RAISE NOTICE 'sort_order column already exists in plans table';
    END IF;
END $$;

-- Show current plans with sort order
SELECT '--- Current plans with sort order ---' as status;
SELECT 
    id,
    name,
    plan_type,
    sort_order,
    is_active,
    created_at
FROM plans 
ORDER BY sort_order, created_at;

-- Show table structure
SELECT '--- Updated table structure ---' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'plans'
ORDER BY ordinal_position;

SELECT '--- Sort order column setup complete ---' as status;
