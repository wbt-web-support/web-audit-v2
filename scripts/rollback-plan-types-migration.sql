-- Rollback script to revert plan types from 'Starter', 'Growth', 'Scale' back to 'free', 'pro', 'enterprise'
-- Use this only if you need to revert the migration

-- Step 1: Update the CHECK constraint on the plans table back to original
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_plan_type_check;
ALTER TABLE plans ADD CONSTRAINT plans_plan_type_check CHECK (plan_type IN ('free', 'pro', 'enterprise'));

-- Step 2: Update existing plan data back to original names
UPDATE plans SET plan_type = 'free' WHERE plan_type = 'Starter';
UPDATE plans SET plan_type = 'pro' WHERE plan_type = 'Growth';
UPDATE plans SET plan_type = 'enterprise' WHERE plan_type = 'Scale';

-- Step 3: Verify the rollback
SELECT 
    plan_type,
    name,
    max_projects,
    jsonb_array_length(can_use_features) as feature_count
FROM plans 
ORDER BY sort_order;

-- Rollback completed
SELECT 'Plan type rollback completed successfully' as status;
