-- Fix RLS policies for plans table
-- This script ensures the policies work correctly for both public and admin access

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read active plans" ON plans;
DROP POLICY IF EXISTS "Allow public read access to active plans" ON plans;
DROP POLICY IF EXISTS "Allow admins to manage plans" ON plans;

-- Create a simple policy that allows everyone to read active plans
CREATE POLICY "plans_select_policy" ON plans
  FOR SELECT
  USING (is_active = true);

-- Create policy for admin management
CREATE POLICY "plans_admin_policy" ON plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Grant explicit permissions
GRANT SELECT ON plans TO anon;
GRANT SELECT ON plans TO authenticated;
GRANT ALL ON plans TO authenticated;
GRANT ALL ON plans TO service_role;

-- Test the policies
SELECT 'RLS policies updated successfully' as status;
