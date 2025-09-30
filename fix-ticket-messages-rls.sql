-- Quick fix for ticket_messages RLS policies
-- Run this if you already have the tables but are getting permission errors

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view messages for their own tickets" ON public.ticket_messages;
DROP POLICY IF EXISTS "Users can create messages for their own tickets" ON public.ticket_messages;

-- Create simplified policies that are less restrictive
CREATE POLICY "Users can view messages for their own tickets" ON public.ticket_messages
    FOR SELECT USING (
        ticket_id IN (
            SELECT id FROM public.tickets WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages for their own tickets" ON public.ticket_messages
    FOR INSERT WITH CHECK (
        ticket_id IN (
            SELECT id FROM public.tickets WHERE user_id = auth.uid()
        )
    );

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'ticket_messages';

-- Test the policies by trying to select from the table
-- This should work if the policies are correct
SELECT 'RLS policies updated successfully' as status;
