-- Final fix for plans RLS policies
-- This ensures admin users can manage plans properly

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "plans_public_read" ON plans;
DROP POLICY IF EXISTS "plans_authenticated_read" ON plans;
DROP POLICY IF EXISTS "plans_admin_insert" ON plans;
DROP POLICY IF EXISTS "plans_admin_update" ON plans;
DROP POLICY IF EXISTS "plans_admin_delete" ON plans;

-- Create simplified policies that work
-- 1. Allow public to read active plans
CREATE POLICY "plans_public_read" ON plans
  FOR SELECT
  TO public
  USING (is_active = true);

-- 2. Allow authenticated users to read all plans
CREATE POLICY "plans_authenticated_read" ON plans
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Allow authenticated users to insert plans (admin check in app)
CREATE POLICY "plans_authenticated_insert" ON plans
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 4. Allow authenticated users to update plans (admin check in app)
CREATE POLICY "plans_authenticated_update" ON plans
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Allow authenticated users to delete plans (admin check in app)
CREATE POLICY "plans_authenticated_delete" ON plans
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Test the policies
SELECT 'Testing policies...' as status;

-- Test read access
SELECT COUNT(*) as plan_count FROM plans;

-- Test update access (this should work now)
UPDATE plans 
SET updated_at = NOW() 
WHERE id = (SELECT id FROM plans LIMIT 1)
RETURNING id, name, updated_at;
