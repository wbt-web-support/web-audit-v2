# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: Service Role Key (only needed for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## How to Get Your Supabase Credentials

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to Settings > API**
4. **Copy the following**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (optional)

## Example .env.local file

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Database Setup

1. **Run the SQL script** in your Supabase SQL Editor:
   - Copy the contents of `database/create_notify_me_table.sql`
   - Paste and run it in the Supabase SQL Editor

## Testing

1. **Start your development server**: `npm run dev`
2. **Visit your homepage**
3. **Try submitting an email** in the "Notify Me" form
4. **Check your Supabase table** to see the stored email

## Troubleshooting

- **Missing environment variables**: Make sure `.env.local` exists and has the correct values
- **Database errors**: Ensure the `notify_me` table is created with proper RLS policies
- **Network errors**: Check your Supabase URL and keys are correct

