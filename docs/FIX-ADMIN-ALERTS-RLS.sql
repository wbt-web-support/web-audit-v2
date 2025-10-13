-- Fix RLS policies for admin alerts table
-- This script creates proper RLS policies that allow:
-- - Authenticated users to read alerts
-- - Admins to perform CRUD operations

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read alerts" ON admin_alerts;
DROP POLICY IF EXISTS "Allow admins to manage alerts" ON admin_alerts;

-- Create proper RLS policies
-- Allow authenticated users to read alerts (for public display)
CREATE POLICY "Allow authenticated users to read alerts" ON admin_alerts
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins to manage alerts (create, update, delete)
CREATE POLICY "Allow admins to manage alerts" ON admin_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Verify RLS status and policies
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'admin_alerts';

-- Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'admin_alerts';
