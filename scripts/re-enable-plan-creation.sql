-- Re-enable plan creation after emergency stop
-- Run this when you're ready to allow plan creation again

-- 1. Remove the prevention trigger
DROP TRIGGER IF EXISTS prevent_plan_inserts_trigger ON plans;
DROP FUNCTION IF EXISTS prevent_plan_inserts();

-- 2. Re-enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- 3. Restore INSERT permissions
GRANT INSERT ON plans TO authenticated;
GRANT INSERT ON plans TO public;

-- 4. Recreate the update trigger
CREATE OR REPLACE FUNCTION update_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_plans_updated_at();

-- 5. Show status
SELECT 'Plan creation has been RE-ENABLED' as status;
SELECT 'Current plan count:' as status, COUNT(*) as total_plans FROM plans;
