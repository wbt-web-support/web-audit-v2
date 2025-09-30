-- Database diagnostic script
-- Run this to check the current state of your database

-- Check if tables exist
DO $$
BEGIN
    RAISE NOTICE '🔍 Checking database tables...';
    
    -- Check users table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ Users table exists';
    ELSE
        RAISE NOTICE '❌ Users table does not exist';
    END IF;
    
    -- Check audit_projects table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_projects' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ Audit projects table exists';
    ELSE
        RAISE NOTICE '❌ Audit projects table does not exist';
    END IF;
    
    -- Check tickets table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ Tickets table exists';
    ELSE
        RAISE NOTICE '❌ Tickets table does not exist';
    END IF;
    
    -- Check ticket_messages table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ticket_messages' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ Ticket messages table exists';
    ELSE
        RAISE NOTICE '❌ Ticket messages table does not exist';
    END IF;
END $$;

-- Check RLS status
DO $$
BEGIN
    RAISE NOTICE '🔍 Checking RLS status...';
    
    -- Check users table RLS
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'users' AND relrowsecurity = true) THEN
        RAISE NOTICE '⚠️ Users table has RLS enabled';
    ELSE
        RAISE NOTICE '✅ Users table RLS is disabled or not configured';
    END IF;
    
    -- Check audit_projects table RLS
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'audit_projects' AND relrowsecurity = true) THEN
        RAISE NOTICE '⚠️ Audit projects table has RLS enabled';
    ELSE
        RAISE NOTICE '✅ Audit projects table RLS is disabled or not configured';
    END IF;
    
    -- Check tickets table RLS
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'tickets' AND relrowsecurity = true) THEN
        RAISE NOTICE '⚠️ Tickets table has RLS enabled';
    ELSE
        RAISE NOTICE '✅ Tickets table RLS is disabled or not configured';
    END IF;
    
    -- Check ticket_messages table RLS
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ticket_messages' AND relrowsecurity = true) THEN
        RAISE NOTICE '⚠️ Ticket messages table has RLS enabled';
    ELSE
        RAISE NOTICE '✅ Ticket messages table RLS is disabled or not configured';
    END IF;
END $$;

-- Check existing policies
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '🔍 Checking existing RLS policies...';
    
    -- Count policies on users table
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'users';
    RAISE NOTICE 'Users table has % policies', policy_count;
    
    -- Count policies on audit_projects table
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'audit_projects';
    RAISE NOTICE 'Audit projects table has % policies', policy_count;
    
    -- Count policies on tickets table
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'tickets';
    RAISE NOTICE 'Tickets table has % policies', policy_count;
    
    -- Count policies on ticket_messages table
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'ticket_messages';
    RAISE NOTICE 'Ticket messages table has % policies', policy_count;
END $$;

-- Test basic access
DO $$
DECLARE
    user_count INTEGER;
    project_count INTEGER;
    ticket_count INTEGER;
    message_count INTEGER;
BEGIN
    RAISE NOTICE '🧪 Testing basic table access...';
    
    -- Test users table access
    BEGIN
        SELECT COUNT(*) INTO user_count FROM public.users;
        RAISE NOTICE '✅ Users table: % records', user_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Users table error: %', SQLERRM;
    END;
    
    -- Test audit_projects table access
    BEGIN
        SELECT COUNT(*) INTO project_count FROM public.audit_projects;
        RAISE NOTICE '✅ Audit projects table: % records', project_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Audit projects table error: %', SQLERRM;
    END;
    
    -- Test tickets table access
    BEGIN
        SELECT COUNT(*) INTO ticket_count FROM public.tickets;
        RAISE NOTICE '✅ Tickets table: % records', ticket_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Tickets table error: %', SQLERRM;
    END;
    
    -- Test ticket_messages table access
    BEGIN
        SELECT COUNT(*) INTO message_count FROM public.ticket_messages;
        RAISE NOTICE '✅ Ticket messages table: % records', message_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Ticket messages table error: %', SQLERRM;
    END;
END $$;

-- Summary
DO $$
BEGIN
    RAISE NOTICE '📊 Database diagnostic completed!';
    RAISE NOTICE 'If you see any ❌ errors above, run the fix-all-rls-policies.sql script';
    RAISE NOTICE 'If all tests show ✅, your database should be working properly';
END $$;
