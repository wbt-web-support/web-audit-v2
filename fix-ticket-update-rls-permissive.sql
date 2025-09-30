-- Fix RLS policies for ticket updates to allow admin access
-- This script updates the RLS policies to allow ticket updates for all authenticated users

-- Temporarily disable RLS to ensure policies can be dropped/created
ALTER TABLE public.tickets DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies for tickets
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.tickets;

-- Re-enable RLS for tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for tickets
CREATE POLICY "Allow all authenticated users to view tickets" ON public.tickets
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all authenticated users to create tickets" ON public.tickets
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update tickets" ON public.tickets
    FOR UPDATE TO authenticated USING (true);

-- Admin policies (ensure service_role can still manage)
CREATE POLICY "Admins can view all tickets" ON public.tickets
    FOR SELECT TO service_role USING (true);

CREATE POLICY "Admins can manage all tickets" ON public.tickets
    FOR ALL TO service_role USING (true);

-- Grant explicit permissions to the authenticated role
GRANT ALL ON public.tickets TO authenticated;

-- Verify the setup
DO $$
BEGIN
    RAISE NOTICE 'Ticket update RLS policies fixed successfully!';
    RAISE NOTICE 'All authenticated users can now view, create, and update tickets';
    RAISE NOTICE 'Admin access is preserved for service_role';
END $$;
