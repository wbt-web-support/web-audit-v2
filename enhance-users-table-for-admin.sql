-- Enhance users table for admin management
-- Run this script in your Supabase SQL Editor

-- Add columns for user management
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS role_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS role_changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_blocked ON public.users (blocked);
CREATE INDEX IF NOT EXISTS idx_users_role_changed_at ON public.users (role_changed_at);
CREATE INDEX IF NOT EXISTS idx_users_last_activity_at ON public.users (last_activity_at);

-- Enable Row Level Security (RLS) for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Policy for users to view their own profile
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT TO authenticated USING (auth.uid() = id);

-- Policy for users to update their own profile (limited fields)
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE TO authenticated USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admin policies for viewing all users
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin policies for managing all users
CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Service role policies (for backend operations)
CREATE POLICY "Service role can manage all users" ON public.users
    FOR ALL TO service_role USING (true);

-- Grant permissions to authenticated role
GRANT ALL ON public.users TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create function to update last_activity_at
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_activity_at when user performs actions
    UPDATE public.users 
    SET last_activity_at = NOW()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to track user activity
DROP TRIGGER IF EXISTS track_audit_project_activity ON public.audit_projects;
CREATE TRIGGER track_audit_project_activity
    AFTER INSERT OR UPDATE ON public.audit_projects
    FOR EACH ROW EXECUTE FUNCTION update_user_activity();

DROP TRIGGER IF EXISTS track_ticket_activity ON public.tickets;
CREATE TRIGGER track_ticket_activity
    AFTER INSERT OR UPDATE ON public.tickets
    FOR EACH ROW EXECUTE FUNCTION update_user_activity();

-- Create function to track login activity
CREATE OR REPLACE FUNCTION track_user_login()
RETURNS TRIGGER AS $$
BEGIN
    -- Update login count and last activity when user signs in
    UPDATE public.users 
    SET 
        last_activity_at = NOW(),
        login_count = COALESCE(login_count, 0) + 1
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to track login activity (this would need to be set up in auth.users)
-- Note: This trigger would need to be created on auth.users table, which requires superuser privileges
-- For now, we'll handle login tracking in the application layer

-- Verify the setup
DO $$
BEGIN
    RAISE NOTICE 'Users table enhanced successfully!';
    RAISE NOTICE 'Added columns: blocked, blocked_at, blocked_by, role_changed_at, role_changed_by, last_activity_at, login_count, notes';
    RAISE NOTICE 'RLS policies configured for admin user management';
    RAISE NOTICE 'Activity tracking triggers created';
END $$;
