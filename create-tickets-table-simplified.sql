-- Simplified ticket system setup with relaxed RLS policies
-- This script creates the ticket system with more permissive policies

-- First, ensure we have the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tickets table with proper foreign key references
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Create ticket_messages table for chat functionality
CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_from_support BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_user_id ON public.ticket_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON public.ticket_messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.tickets;

DROP POLICY IF EXISTS "Users can view messages for their own tickets" ON public.ticket_messages;
DROP POLICY IF EXISTS "Users can create messages for their own tickets" ON public.ticket_messages;
DROP POLICY IF EXISTS "Admins can view all ticket messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Admins can manage all ticket messages" ON public.ticket_messages;

-- Create simplified RLS policies for tickets table
CREATE POLICY "Users can view their own tickets" ON public.tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets" ON public.tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets" ON public.tickets
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies (for service role)
CREATE POLICY "Admins can view all tickets" ON public.tickets
    FOR SELECT TO service_role USING (true);

CREATE POLICY "Admins can manage all tickets" ON public.tickets
    FOR ALL TO service_role USING (true);

-- Create simplified RLS policies for ticket_messages table
-- Allow users to view messages for tickets they own
CREATE POLICY "Users can view messages for their own tickets" ON public.ticket_messages
    FOR SELECT USING (
        ticket_id IN (
            SELECT id FROM public.tickets WHERE user_id = auth.uid()
        )
    );

-- Allow users to create messages for tickets they own
CREATE POLICY "Users can create messages for their own tickets" ON public.ticket_messages
    FOR INSERT WITH CHECK (
        ticket_id IN (
            SELECT id FROM public.tickets WHERE user_id = auth.uid()
        )
    );

-- Admin policies for ticket_messages
CREATE POLICY "Admins can view all ticket messages" ON public.ticket_messages
    FOR SELECT TO service_role USING (true);

CREATE POLICY "Admins can manage all ticket messages" ON public.ticket_messages
    FOR ALL TO service_role USING (true);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_tickets_updated_at ON public.tickets;
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ticket_messages_updated_at ON public.ticket_messages;
CREATE TRIGGER update_ticket_messages_updated_at
    BEFORE UPDATE ON public.ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.tickets TO authenticated;
GRANT ALL ON public.ticket_messages TO authenticated;

-- Grant permissions to service role
GRANT ALL ON public.tickets TO service_role;
GRANT ALL ON public.ticket_messages TO service_role;

-- Create a function to check if user is admin (optional)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- This can be customized based on your admin logic
    -- For now, we'll use a simple check against a specific user ID
    -- You can modify this to check against a roles table or user metadata
    RETURN user_id IN (
        SELECT id FROM auth.users 
        WHERE raw_user_meta_data->>'role' = 'admin' 
        OR raw_user_meta_data->>'role' = 'moderator'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the setup
DO $$
BEGIN
    RAISE NOTICE 'Simplified ticket system setup completed successfully!';
    RAISE NOTICE 'Tables created: tickets, ticket_messages';
    RAISE NOTICE 'Simplified RLS policies enabled for both tables';
    RAISE NOTICE 'Indexes created for performance';
    RAISE NOTICE 'Triggers created for timestamp updates';
END $$;
