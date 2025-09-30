# User Management System Setup Guide

## 🚨 **Current Issue: RLS Policy Infinite Recursion**

You're experiencing an "infinite recursion detected in policy for relation 'users'" error. This is caused by circular dependencies in the Row Level Security (RLS) policies for the `users` table.

## 🔧 **Quick Fix Steps**

### Step 1: Fix RLS Policies
Run the `fix-users-rls-policies.sql` script in your Supabase SQL Editor:

```sql
-- This script will:
-- 1. Drop all existing problematic RLS policies
-- 2. Create simple, non-recursive policies
-- 3. Test the policies to ensure they work
```

### Step 2: Enhance Users Table (Optional)
If you want the additional user management features, run `enhance-users-table-simple.sql`:

```sql
-- This script will:
-- 1. Add columns for user blocking, role changes, activity tracking
-- 2. Create indexes for performance
-- 3. Set up activity tracking triggers
-- 4. Grant necessary permissions
```

## 📋 **What Each Script Does**

### `fix-users-rls-policies.sql`
- **Purpose**: Fixes the infinite recursion issue
- **Actions**:
  - Drops all existing RLS policies
  - Creates simple, non-recursive policies
  - Tests the setup
- **Result**: Database connection will work again

### `enhance-users-table-simple.sql`
- **Purpose**: Adds user management features
- **Actions**:
  - Adds columns: `blocked`, `blocked_at`, `blocked_by`, `role_changed_at`, `role_changed_by`, `last_activity_at`, `login_count`, `notes`
  - Creates performance indexes
  - Sets up activity tracking
- **Result**: Full user management capabilities

## 🎯 **Expected Results After Fix**

### ✅ **Database Connection**
- No more "infinite recursion" errors
- Database access test will pass
- Connection status will show as connected

### ✅ **User Management Features**
- View all users in admin panel
- Block/unblock users
- Change user roles
- Track user activity
- View user details

## 🚀 **How to Use the System**

### 1. **Access Admin Panel**
- Navigate to Dashboard → Admin → Users tab
- You'll see all users with their details

### 2. **Manage Users**
- **View Details**: Click "View" button to see comprehensive user info
- **Block Users**: Click "Block" to prevent user access
- **Change Roles**: Use the role change button in user details
- **Search & Filter**: Use the search and filter options

### 3. **Monitor Activity**
- **User Stats**: See total users, active users, blocked users
- **Activity Tracking**: Monitor user engagement
- **Role Distribution**: Track admin/moderator/user counts

## 🔍 **Troubleshooting**

### If you still get RLS errors:
1. **Check Policy Order**: Make sure you ran `fix-users-rls-policies.sql` first
2. **Verify Permissions**: Ensure your user has admin role
3. **Test Queries**: Try simple queries in Supabase SQL Editor

### If user management doesn't work:
1. **Check Columns**: Verify all columns were added by `enhance-users-table-simple.sql`
2. **Test Functions**: Try the user management functions in the admin panel
3. **Check Logs**: Look for any error messages in the browser console

## 📊 **Database Schema After Setup**

```sql
-- Users table will have these additional columns:
blocked BOOLEAN DEFAULT FALSE
blocked_at TIMESTAMP WITH TIME ZONE
blocked_by UUID REFERENCES auth.users(id)
role_changed_at TIMESTAMP WITH TIME ZONE
role_changed_by UUID REFERENCES auth.users(id)
last_activity_at TIMESTAMP WITH TIME ZONE
login_count INTEGER DEFAULT 0
notes TEXT
```

## 🎉 **Success Indicators**

After running the scripts, you should see:
- ✅ No more "infinite recursion" errors in console
- ✅ Database connection status shows as connected
- ✅ Admin Users tab loads with real user data
- ✅ User management actions work (block, unblock, role changes)
- ✅ User statistics display correctly

## 🆘 **Need Help?**

If you continue to experience issues:
1. **Check Console**: Look for specific error messages
2. **Verify Scripts**: Make sure both SQL scripts ran successfully
3. **Test Permissions**: Ensure your user has admin role
4. **Contact Support**: If all else fails, the system will show helpful error messages

The system is designed to be robust and will guide you through any remaining issues!
