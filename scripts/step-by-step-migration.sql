-- Step-by-step migration to avoid constraint violations
-- Run each step separately and check results

-- STEP 1: Check current state
SELECT 'STEP 1: Current plans' as step;
SELECT plan_type, name, id FROM plans ORDER BY plan_type;

-- STEP 2: Remove constraint temporarily
SELECT 'STEP 2: Removing constraint' as step;
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_plan_type_check;

-- STEP 3: Update plan types one by one
SELECT 'STEP 3: Updating plan types' as step;
UPDATE plans SET plan_type = 'Starter' WHERE plan_type = 'free';
UPDATE plans SET plan_type = 'Growth' WHERE plan_type = 'pro';  
UPDATE plans SET plan_type = 'Scale' WHERE plan_type = 'enterprise';

-- STEP 4: Check results
SELECT 'STEP 4: After updates' as step;
SELECT plan_type, name, id FROM plans ORDER BY plan_type;

-- STEP 5: Add constraint back
SELECT 'STEP 5: Adding constraint back' as step;
ALTER TABLE plans ADD CONSTRAINT plans_plan_type_check CHECK (plan_type IN ('Starter', 'Growth', 'Scale'));

-- STEP 6: Update limits and features
SELECT 'STEP 6: Updating limits and features' as step;
UPDATE plans SET max_projects = 1 WHERE plan_type = 'Starter';
UPDATE plans SET max_projects = 10 WHERE plan_type = 'Growth';
UPDATE plans SET max_projects = -1 WHERE plan_type = 'Scale';

-- STEP 7: Final verification
SELECT 'STEP 7: Final results' as step;
SELECT 
    plan_type,
    name,
    max_projects,
    jsonb_array_length(can_use_features) as feature_count
FROM plans 
ORDER BY plan_type;
