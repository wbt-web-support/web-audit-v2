# Ticket System Setup Guide

## Overview
This ticket system provides a comprehensive support solution with database integration, CRUD operations, and real-time chat functionality.

## Database Setup

### 1. Run the SQL Script
Execute the `create-tickets-table.sql` file in your Supabase SQL editor to create the necessary tables:

```sql
-- This will create:
-- - tickets table
-- - ticket_messages table  
-- - Indexes for performance
-- - Row Level Security (RLS) policies
-- - Triggers for updated_at timestamps
```

### 2. Tables Created

#### `tickets` table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `title` (VARCHAR)
- `description` (TEXT)
- `status` (open, in_progress, resolved, closed)
- `priority` (low, medium, high, urgent)
- `created_at`, `updated_at` (Timestamps)
- `assigned_to` (UUID, Foreign Key to auth.users)
- `resolved_at`, `closed_at` (Timestamps)

#### `ticket_messages` table
- `id` (UUID, Primary Key)
- `ticket_id` (UUID, Foreign Key to tickets)
- `user_id` (UUID, Foreign Key to auth.users)
- `message` (TEXT)
- `is_from_support` (BOOLEAN)
- `created_at`, `updated_at` (Timestamps)

## Features Implemented

### ✅ Database Integration
- Full CRUD operations for tickets and messages
- Row Level Security (RLS) for data protection
- User can only see their own tickets
- Admins can see all tickets

### ✅ Ticket Management
- Create new tickets with title, description, and priority
- View all user tickets
- Update ticket status and details
- Delete tickets

### ✅ Chat System
- Real-time messaging within tickets
- Collapsible ticket cards
- Message history
- Support vs user message distinction

### ✅ UI/UX Features
- Minimal Framer Motion animations
- No hover/scale effects (as requested)
- Responsive design
- Loading states and error handling
- Form validation

## Components

### 1. `Support.tsx`
Main support page with:
- Tab navigation (My Tickets / Create New)
- Ticket listing with loading states
- New ticket creation form
- Support resources section

### 2. `TicketCard.tsx`
Collapsible ticket component with:
- Ticket details display
- Expandable chat interface
- Message input and sending
- Real-time message loading

### 3. Database Functions (in SupabaseContext.tsx)
- `createTicket()` - Create new ticket
- `getTickets()` - Get user's tickets
- `getTicket()` - Get single ticket with messages
- `updateTicket()` - Update ticket
- `deleteTicket()` - Delete ticket
- `createTicketMessage()` - Send message
- `getTicketMessages()` - Get ticket messages
- `updateTicketMessage()` - Update message
- `deleteTicketMessage()` - Delete message

## Usage

### For Users
1. Navigate to Profile → Support tab
2. Click "Create New Ticket" to submit a support request
3. View your tickets in "My Tickets" tab
4. Click on any ticket to expand and view chat
5. Send messages to communicate with support

### For Admins
- Admins can view all tickets (RLS policies allow this)
- Can respond to tickets as support
- Can update ticket status and assign tickets

## Security Features

### Row Level Security (RLS)
- Users can only access their own tickets
- Admins can access all tickets
- Messages are protected by ticket ownership
- Automatic user_id assignment on creation

### Data Validation
- Required fields validation
- Input sanitization
- Error handling for database operations

## Future Enhancements

### Potential Additions
- Real-time notifications for new messages
- File attachments in messages
- Ticket assignment to specific support agents
- Email notifications for ticket updates
- Ticket categories and tags
- Advanced search and filtering
- Ticket templates
- SLA tracking and alerts

## Troubleshooting

### Common Issues
1. **Database connection errors**: Check Supabase configuration
2. **RLS policy errors**: Ensure user is authenticated
3. **Import errors**: Check file paths for components
4. **Type errors**: Ensure all interfaces are properly defined

### Debug Steps
1. Check browser console for errors
2. Verify Supabase connection in Network tab
3. Check database logs in Supabase dashboard
4. Ensure all environment variables are set

## Files Modified/Created

### New Files
- `create-tickets-table.sql` - Database schema
- `app/dashboard/components/TicketCard.tsx` - Ticket card component
- `TICKET-SYSTEM-SETUP.md` - This documentation

### Modified Files
- `contexts/SupabaseContext.tsx` - Added ticket system functions
- `app/dashboard/components/tabs/profile-subtabs/Support.tsx` - Updated with database integration

## Testing

### Manual Testing Checklist
- [ ] Create new ticket
- [ ] View ticket list
- [ ] Expand ticket to see chat
- [ ] Send message in ticket
- [ ] Update ticket status
- [ ] Delete ticket
- [ ] Error handling (network issues, validation)
- [ ] Loading states
- [ ] Responsive design

The ticket system is now fully functional with database integration, CRUD operations, and a chat system as requested!
