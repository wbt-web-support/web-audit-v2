-- Simple script to fix RLS policies for plans table
-- This creates policies that work with the users table role column

-- Drop existing policies
DROP POLICY IF EXISTS "Allow admin users to insert plans" ON plans;
DROP POLICY IF EXISTS "Allow admin users to update plans" ON plans;
DROP POLICY IF EXISTS "Allow admin users to delete plans" ON plans;

-- Create new policies that work with the users table role column
-- Policy 1: Allow admin users to insert plans
CREATE POLICY "Allow admin users to insert plans" ON plans
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Policy 2: Allow admin users to update plans
CREATE POLICY "Allow admin users to update plans" ON plans
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Policy 3: Allow admin users to delete plans
CREATE POLICY "Allow admin users to delete plans" ON plans
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Test the policies
SELECT '--- Testing RLS Policies ---' as status;
SELECT 
    has_table_privilege('plans', 'UPDATE') as can_update,
    has_table_privilege('plans', 'SELECT') as can_select,
    has_table_privilege('plans', 'INSERT') as can_insert,
    has_table_privilege('plans', 'DELETE') as can_delete;

-- Show current policies
SELECT '--- Current RLS Policies ---' as status;
SELECT 
    polname as policy_name,
    polcmd as command,
    polroles::regrole[] as roles
FROM pg_policy 
WHERE polrelid = 'public.plans'::regclass;

SELECT '--- RLS Policy Fix Complete ---' as status;
