-- Script to add plan_type column to users table
-- This will add a plan_type column to the users table if it doesn't exist

-- Check if plan_type column exists
SELECT '--- Checking if plan_type column exists ---' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users' 
AND column_name = 'plan_type';

-- Add plan_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'plan_type'
    ) THEN
        ALTER TABLE users ADD COLUMN plan_type VARCHAR(50) DEFAULT 'Starter';
        RAISE NOTICE 'Added plan_type column to users table';
    ELSE
        RAISE NOTICE 'plan_type column already exists in users table';
    END IF;
END $$;

-- Add check constraint for plan_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'users_plan_type_check'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_plan_type_check 
        CHECK (plan_type IN ('Starter', 'Growth', 'Scale'));
        RAISE NOTICE 'Added plan_type check constraint';
    ELSE
        RAISE NOTICE 'plan_type check constraint already exists';
    END IF;
END $$;

-- Update existing users to have Starter plan if they don't have a plan_type
UPDATE users 
SET plan_type = 'Starter' 
WHERE plan_type IS NULL OR plan_type = '';

-- Show current users and their plan types
SELECT '--- Current users and their plan types ---' as status;
SELECT 
    id,
    email,
    plan_type,
    created_at
FROM users 
ORDER BY created_at DESC
LIMIT 10;

-- Show plan type distribution
SELECT '--- Plan type distribution ---' as status;
SELECT 
    plan_type,
    COUNT(*) as user_count
FROM users 
GROUP BY plan_type
ORDER BY plan_type;

SELECT '--- Setup complete ---' as status;
