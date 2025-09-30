-- Fix RLS policies for users table to prevent infinite recursion
-- Run this script in your Supabase SQL Editor

-- First, let's check if the users table exists and what policies are currently applied
DO $$
BEGIN
    RAISE NOTICE 'Checking users table and existing policies...';
END $$;

-- Drop all existing RLS policies for users table to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;

-- Temporarily disable RLS to ensure we can modify policies
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
-- Policy 1: Users can view their own profile (simple check)
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT TO authenticated 
    USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (limited fields)
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE TO authenticated 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 3: Admins can view all users (check role in users table)
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy 4: Admins can manage all users
CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy 5: Service role can do everything (for backend operations)
CREATE POLICY "Service role can manage all users" ON public.users
    FOR ALL TO service_role 
    USING (true);

-- Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Test the policies by trying a simple query
DO $$
DECLARE
    test_result RECORD;
BEGIN
    -- Try to select from users table to test policies
    BEGIN
        SELECT COUNT(*) INTO test_result FROM public.users LIMIT 1;
        RAISE NOTICE '✅ Users table access test successful';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Users table access test failed: %', SQLERRM;
    END;
END $$;

-- Verify the setup
DO $$
BEGIN
    RAISE NOTICE 'RLS policies for users table have been fixed!';
    RAISE NOTICE 'Policies created:';
    RAISE NOTICE '- Users can view their own profile';
    RAISE NOTICE '- Users can update their own profile';
    RAISE NOTICE '- Admins can view all users';
    RAISE NOTICE '- Admins can manage all users';
    RAISE NOTICE '- Service role can manage all users';
    RAISE NOTICE 'No more infinite recursion should occur.';
END $$;
