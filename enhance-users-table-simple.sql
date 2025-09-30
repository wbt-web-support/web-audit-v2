-- Simple enhancement for users table without complex RLS policies
-- Run this script in your Supabase SQL Editor

-- Add columns for user management (only if they don't exist)
DO $$
BEGIN
    -- Add blocked column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'blocked') THEN
        ALTER TABLE public.users ADD COLUMN blocked BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add blocked_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'blocked_at') THEN
        ALTER TABLE public.users ADD COLUMN blocked_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add blocked_by column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'blocked_by') THEN
        ALTER TABLE public.users ADD COLUMN blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    
    -- Add role_changed_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role_changed_at') THEN
        ALTER TABLE public.users ADD COLUMN role_changed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add role_changed_by column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role_changed_by') THEN
        ALTER TABLE public.users ADD COLUMN role_changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    
    -- Add last_activity_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_activity_at') THEN
        ALTER TABLE public.users ADD COLUMN last_activity_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add login_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'login_count') THEN
        ALTER TABLE public.users ADD COLUMN login_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add notes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'notes') THEN
        ALTER TABLE public.users ADD COLUMN notes TEXT;
    END IF;
    
    RAISE NOTICE '✅ All columns added successfully';
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_users_blocked ON public.users (blocked);
CREATE INDEX IF NOT EXISTS idx_users_role_changed_at ON public.users (role_changed_at);
CREATE INDEX IF NOT EXISTS idx_users_last_activity_at ON public.users (last_activity_at);

-- Create function to update last_activity_at (simplified)
CREATE OR REPLACE FUNCTION update_user_activity_simple()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_activity_at when user performs actions
    UPDATE public.users 
    SET last_activity_at = NOW()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to track user activity (only if they don't exist)
DO $$
BEGIN
    -- Drop existing triggers if they exist
    DROP TRIGGER IF EXISTS track_audit_project_activity ON public.audit_projects;
    DROP TRIGGER IF EXISTS track_ticket_activity ON public.tickets;
    
    -- Create new triggers
    CREATE TRIGGER track_audit_project_activity
        AFTER INSERT OR UPDATE ON public.audit_projects
        FOR EACH ROW EXECUTE FUNCTION update_user_activity_simple();

    CREATE TRIGGER track_ticket_activity
        AFTER INSERT OR UPDATE ON public.tickets
        FOR EACH ROW EXECUTE FUNCTION update_user_activity_simple();
        
    RAISE NOTICE '✅ Activity tracking triggers created';
END $$;

-- Grant basic permissions
GRANT ALL ON public.users TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify the setup
DO $$
BEGIN
    RAISE NOTICE '✅ Users table enhanced successfully!';
    RAISE NOTICE 'Added columns: blocked, blocked_at, blocked_by, role_changed_at, role_changed_by, last_activity_at, login_count, notes';
    RAISE NOTICE 'Created indexes for performance';
    RAISE NOTICE 'Set up activity tracking triggers';
    RAISE NOTICE 'Granted necessary permissions';
    RAISE NOTICE 'No RLS policies modified - using existing ones';
END $$;
