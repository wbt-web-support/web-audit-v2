-- Script to check if features column exists in plans table
-- This will help identify missing columns that might cause runtime errors

-- Check all columns in plans table
SELECT '--- Plans Table Columns ---' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'plans'
ORDER BY ordinal_position;

-- Check if features column exists
SELECT '--- Features Column Check ---' as status;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'plans' 
            AND column_name = 'features'
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as features_column_status;

-- Check if can_use_features column exists
SELECT '--- can_use_features Column Check ---' as status;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'plans' 
            AND column_name = 'can_use_features'
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as can_use_features_column_status;

-- Show sample data to see what columns actually have data
SELECT '--- Sample Plan Data ---' as status;
SELECT 
    id,
    name,
    plan_type,
    can_use_features,
    features,
    max_projects,
    is_active
FROM plans 
LIMIT 3;

-- Add features column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'plans' 
        AND column_name = 'features'
    ) THEN
        ALTER TABLE plans ADD COLUMN features TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added features column to plans table';
    ELSE
        RAISE NOTICE 'features column already exists in plans table';
    END IF;
END $$;

SELECT '--- Column Check Complete ---' as status;
