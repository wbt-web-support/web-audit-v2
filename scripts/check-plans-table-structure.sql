-- Script to check plans table structure and can_use_features column
-- This will help identify if there are any column or data type issues

-- Check table structure
SELECT '--- Plans Table Structure ---' as status;
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

-- Check can_use_features column specifically
SELECT '--- can_use_features Column Details ---' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'plans' 
AND column_name = 'can_use_features';

-- Check current data in can_use_features column
SELECT '--- Current can_use_features Data ---' as status;
SELECT 
    id,
    name,
    plan_type,
    can_use_features,
    array_length(can_use_features, 1) as feature_count
FROM plans 
ORDER BY plan_type;

-- Test updating can_use_features with a simple array
SELECT '--- Testing can_use_features Update ---' as status;
-- This will test if we can update the can_use_features column
UPDATE plans 
SET can_use_features = ARRAY['test_feature']::text[]
WHERE id = (SELECT id FROM plans LIMIT 1)
RETURNING id, name, can_use_features;

-- Revert the test update
UPDATE plans 
SET can_use_features = ARRAY['basic_audit']::text[]
WHERE can_use_features = ARRAY['test_feature']::text[]
RETURNING id, name, can_use_features;

SELECT '--- Structure Check Complete ---' as status;
