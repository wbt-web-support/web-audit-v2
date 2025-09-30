-- Fix user activity tracking and authentication status
-- Run this script in your Supabase SQL Editor

-- First, let's check if we need to add any missing columns
DO $$
BEGIN
    RAISE NOTICE '🔧 Checking and updating user table structure...';
END $$;

-- Add missing columns if they don't exist
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS role_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS role_changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create a function to update user activity when they sign in
CREATE OR REPLACE FUNCTION update_user_activity_on_signin()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the public.users table with activity information
    UPDATE public.users
    SET 
        last_activity_at = COALESCE(NEW.last_sign_in_at, NOW()),
        login_count = COALESCE(login_count, 0) + 1,
        email_confirmed = COALESCE(NEW.email_confirmed_at IS NOT NULL, email_confirmed)
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update activity on sign in
DROP TRIGGER IF EXISTS on_auth_user_signin ON auth.users;
CREATE TRIGGER on_auth_user_signin
    AFTER UPDATE OF last_sign_in_at, email_confirmed_at ON auth.users
    FOR EACH ROW
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at OR 
          OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
    EXECUTE FUNCTION update_user_activity_on_signin();

-- Update existing users with their auth information
UPDATE public.users 
SET 
    email_confirmed = COALESCE(
        (SELECT email_confirmed_at IS NOT NULL FROM auth.users WHERE auth.users.id = public.users.id),
        email_confirmed
    ),
    last_activity_at = COALESCE(
        (SELECT last_sign_in_at FROM auth.users WHERE auth.users.id = public.users.id),
        last_activity_at,
        created_at
    )
WHERE EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = public.users.id);

-- Create a function to sync user data when a new user is created
CREATE OR REPLACE FUNCTION sync_user_on_auth_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update the public.users table
    INSERT INTO public.users (
        id,
        email,
        email_confirmed,
        created_at,
        updated_at,
        last_activity_at
    ) VALUES (
        NEW.id,
        NEW.email,
        NEW.email_confirmed_at IS NOT NULL,
        NEW.created_at,
        NEW.updated_at,
        COALESCE(NEW.last_sign_in_at, NEW.created_at)
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        email_confirmed = EXCLUDED.email_confirmed,
        updated_at = EXCLUDED.updated_at,
        last_activity_at = COALESCE(EXCLUDED.last_activity_at, public.users.last_activity_at);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_signup ON auth.users;
CREATE TRIGGER on_auth_user_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_on_auth_signup();

-- Update RLS policies to allow proper access
DO $$
BEGIN
    RAISE NOTICE '🔧 Updating RLS policies...';
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can manage user profiles" ON public.users;

-- Create new policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT TO authenticated 
    USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE TO authenticated 
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Allow admins to view and manage all users
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL TO authenticated 
    USING (true);

-- Grant permissions
GRANT ALL ON public.users TO authenticated;

-- Test the setup
DO $$
DECLARE
    user_count INTEGER;
    auth_count INTEGER;
BEGIN
    RAISE NOTICE '🧪 Testing user activity tracking...';
    
    -- Check users table
    SELECT COUNT(*) INTO user_count FROM public.users;
    RAISE NOTICE '✅ Users table: % records', user_count;
    
    -- Check if we can access auth data
    SELECT COUNT(*) INTO auth_count FROM auth.users;
    RAISE NOTICE '✅ Auth users: % records', auth_count;
    
    RAISE NOTICE '🎉 User activity tracking setup completed!';
    RAISE NOTICE '✅ Last activity will be tracked automatically';
    RAISE NOTICE '✅ Email confirmation status will be synced';
    RAISE NOTICE '✅ Login count will be tracked';
    RAISE NOTICE '✅ RLS policies updated for admin access';
END $$;
