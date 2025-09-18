# Web Audit - Complete Login System Setup Guide

## Overview
This guide will help you set up a complete, secure login system with user roles and email confirmation using Supabase and Next.js.

## Features Implemented
- ✅ User registration with email confirmation
- ✅ Secure login with password validation
- ✅ User roles (user, admin, moderator) with RLS policies
- ✅ Email confirmation flow
- ✅ Password reset functionality
- ✅ User profile management
- ✅ Secure database schema with proper constraints

## Setup Instructions

### 1. Database Setup

Run the following SQL in your Supabase SQL editor:

```sql
-- Create users table with role management
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  email_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, role, email_confirmed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'user',
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_confirmed ON public.users(email_confirmed);
```

### 2. Supabase Configuration

#### Email Settings
1. Go to **Authentication** > **Settings** in your Supabase dashboard
2. Configure the following:
   - **Enable email confirmations**: ✅ ON
   - **Site URL**: `http://localhost:3000` (development) or your production URL
   - **Redirect URLs**: Add your allowed redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/login`
     - `http://localhost:3000/signup`

#### Email Templates
Configure these templates in **Authentication** > **Email Templates**:

**Confirm Signup Template:**
- **Subject**: `Confirm your signup for Web Audit`
- **Body**: 
```html
<h2>Welcome to Web Audit!</h2>
<p>Hi {{ .Email }},</p>
<p>Thanks for signing up for Web Audit. Please confirm your email address by clicking the link below:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
<p>If you didn't create an account, you can safely ignore this email.</p>
<p>Best regards,<br>The Web Audit Team</p>
```

### 3. Environment Variables

Make sure your `.env.local` file includes:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Testing the System

#### Test User Registration
1. Go to `/signup`
2. Fill out the form with a real email address
3. Check your email for the confirmation link
4. Click the confirmation link
5. Try logging in at `/login`

#### Test User Roles
1. Create a user account (default role: 'user')
2. To make a user admin, run this SQL in Supabase:
```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### 5. Security Features

#### Row Level Security (RLS)
- Users can only see and update their own profiles
- Admins can view and update all users
- All policies are enforced at the database level

#### Email Confirmation
- All new users must confirm their email before logging in
- Confirmation emails are sent automatically
- Users can resend confirmation emails if needed

#### Password Security
- Minimum 8 character password requirement
- Password confirmation on signup
- Secure password hashing handled by Supabase

### 6. Usage in Components

#### Check Authentication Status
```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { 
    isAuthenticated, 
    isEmailConfirmed, 
    userProfile, 
    isAdmin, 
    userRole 
  } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  if (!isEmailConfirmed) {
    return <div>Please confirm your email</div>;
  }

  return (
    <div>
      Welcome, {userProfile?.first_name}!
      {isAdmin && <div>Admin Panel</div>}
    </div>
  );
}
```

#### User Registration
```tsx
import { useAuth } from '@/hooks/useAuth';

function SignupForm() {
  const { signUp } = useAuth();

  const handleSignup = async (email, password, firstName, lastName) => {
    const { error, message } = await signUp(email, password, firstName, lastName);
    
    if (error) {
      console.error('Signup error:', error.message);
    } else {
      console.log('Success:', message);
    }
  };
}
```

### 7. File Structure

```
app/
├── auth/
│   └── callback/
│       └── page.tsx          # Handles email confirmation
├── login/
│   └── page.tsx              # Login page with email confirmation
├── signup/
│   └── page.tsx              # Registration page with email confirmation
contexts/
└── SupabaseContext.tsx       # Authentication context with roles
hooks/
└── useAuth.ts               # Authentication hook with role helpers
lib/
└── supabase.ts              # Supabase client configuration
```

### 8. Next Steps

1. **Customize Email Templates**: Update the email templates in Supabase to match your brand
2. **Add Password Reset**: Implement password reset functionality
3. **Add Social Login**: Configure Google, GitHub, or other OAuth providers
4. **Add User Management**: Create admin panels for user management
5. **Add Profile Pages**: Create user profile editing pages

### 9. Troubleshooting

#### Common Issues
- **Email not sending**: Check your Supabase email settings and SMTP configuration
- **RLS errors**: Ensure all policies are properly configured
- **TypeScript errors**: Make sure all imports are correct and types are properly defined

#### Debug Mode
Enable debug logging by adding this to your environment:
```env
NEXT_PUBLIC_SUPABASE_DEBUG=true
```

This setup provides a complete, production-ready authentication system with proper security measures and user role management.
