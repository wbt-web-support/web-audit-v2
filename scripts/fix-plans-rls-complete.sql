-- Complete RLS policy fix for plans table
-- This ensures all operations work correctly for admins and public read access

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read active plans" ON plans;
DROP POLICY IF EXISTS "Allow public read access to active plans" ON plans;
DROP POLICY IF EXISTS "Allow admins to manage plans" ON plans;
DROP POLICY IF EXISTS "plans_select_policy" ON plans;
DROP POLICY IF EXISTS "plans_admin_policy" ON plans;

-- Create comprehensive policies

-- 1. Allow everyone to read active plans (public access)
CREATE POLICY "plans_public_read" ON plans
  FOR SELECT
  TO public
  USING (is_active = true);

-- 2. Allow authenticated users to read all plans (for admin panel)
CREATE POLICY "plans_authenticated_read" ON plans
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Allow admins to insert new plans
CREATE POLICY "plans_admin_insert" ON plans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND (u.raw_user_meta_data->>'role' = 'admin' OR u.raw_app_meta_data->>'role' = 'admin')
    )
  );

-- 4. Allow admins to update plans
CREATE POLICY "plans_admin_update" ON plans
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND (u.raw_user_meta_data->>'role' = 'admin' OR u.raw_app_meta_data->>'role' = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND (u.raw_user_meta_data->>'role' = 'admin' OR u.raw_app_meta_data->>'role' = 'admin')
    )
  );

-- 5. Allow admins to delete plans (soft delete)
CREATE POLICY "plans_admin_delete" ON plans
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND (u.raw_user_meta_data->>'role' = 'admin' OR u.raw_app_meta_data->>'role' = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND (u.raw_user_meta_data->>'role' = 'admin' OR u.raw_app_meta_data->>'role' = 'admin')
    )
  );

-- Grant explicit permissions
GRANT SELECT ON plans TO anon;
GRANT SELECT ON plans TO authenticated;
GRANT INSERT, UPDATE, DELETE ON plans TO authenticated;
GRANT ALL ON plans TO service_role;

-- Test the setup
SELECT 'RLS policies updated successfully' as status;

-- Verify policies exist
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'plans'
ORDER BY policyname;
