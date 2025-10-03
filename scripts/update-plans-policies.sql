-- Update plans table policies for public read access
-- This script handles cases where some policies already exist

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read active plans" ON plans;
DROP POLICY IF EXISTS "Allow public read access to active plans" ON plans;
DROP POLICY IF EXISTS "Allow admins to manage plans" ON plans;

-- Create new policies
-- Allow anyone to read active plans (public access)
CREATE POLICY "Allow public read access to active plans" ON plans
  FOR SELECT
  TO public
  USING (is_active = true);

-- Allow admins to manage all plans
CREATE POLICY "Allow admins to manage plans" ON plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Grant necessary permissions
GRANT ALL ON plans TO authenticated;
GRANT ALL ON plans TO service_role;
GRANT SELECT ON plans TO anon;
