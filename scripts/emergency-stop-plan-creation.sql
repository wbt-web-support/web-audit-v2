-- EMERGENCY SCRIPT: Stop automatic plan creation
-- Run this immediately to stop any automatic plan creation

-- 1. Disable all triggers on the plans table
DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;

-- 2. Disable RLS temporarily to prevent any inserts
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;

-- 3. Revoke INSERT permissions temporarily
REVOKE INSERT ON plans FROM authenticated;
REVOKE INSERT ON plans FROM public;

-- 4. Create a function that prevents inserts
CREATE OR REPLACE FUNCTION prevent_plan_inserts()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Plan creation is temporarily disabled for maintenance';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. Create a trigger to prevent all inserts
DROP TRIGGER IF EXISTS prevent_plan_inserts_trigger ON plans;
CREATE TRIGGER prevent_plan_inserts_trigger
    BEFORE INSERT ON plans
    FOR EACH ROW
    EXECUTE FUNCTION prevent_plan_inserts();

-- 6. Show current status
SELECT 'Plan creation has been EMERGENCY STOPPED' as status;
SELECT 'To re-enable later, run: scripts/re-enable-plan-creation.sql' as next_step;

-- 7. Show current plan count
SELECT 'Current plan count:' as status, COUNT(*) as total_plans FROM plans;
