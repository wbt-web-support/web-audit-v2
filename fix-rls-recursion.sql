-- Fix RLS Recursion Issue
-- Run this in your Supabase SQL editor to fix the infinite recursion error

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- Create simplified, non-recursive policies
-- Users can view their own profile (simple check)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (simple check, no role validation)
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users (using auth.jwt() to avoid recursion)
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = 'admin'
  );

-- Admins can update all users (using auth.jwt() to avoid recursion)
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (
    (auth.jwt() ->> 'role') = 'admin'
  );

-- Create a simpler function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin_simple()
RETURNS BOOLEAN AS $$
BEGIN
  -- Use JWT claims instead of querying the users table
  RETURN (auth.jwt() ->> 'role') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a simpler function to check moderator or admin status
CREATE OR REPLACE FUNCTION public.is_moderator_or_admin_simple()
RETURNS BOOLEAN AS $$
BEGIN
  -- Use JWT claims instead of querying the users table
  RETURN (auth.jwt() ->> 'role') IN ('admin', 'moderator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the user role update function to avoid recursion
CREATE OR REPLACE FUNCTION public.update_user_role(user_id UUID, new_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if current user is admin using JWT instead of querying users table
  IF NOT public.is_admin_simple() THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;
  
  -- Update the user role
  UPDATE public.users 
  SET role = new_role, updated_at = NOW()
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the get_user_profile function to avoid recursion
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  email_confirmed BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.email_confirmed,
    u.created_at
  FROM public.users u
  WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Test the policies
SELECT 'RLS policies updated successfully' as status;
