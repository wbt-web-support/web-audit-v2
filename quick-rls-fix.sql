-- Quick RLS Fix for Supabase Users Table
-- Run these queries one by one in your Supabase SQL editor

-- Step 1: Add the missing INSERT policy for users
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 2: Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 3: Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_moderator_or_admin() TO authenticated;

-- Step 4: Verify policies exist
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public';
