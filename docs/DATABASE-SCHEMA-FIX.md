# Database Schema Fix Guide

## Problem Identified

The payment success API is failing because the `users` table is missing required columns for plan management:

```
Error: Could not find the 'can_use_features' column of 'users' in the schema cache
```

## Solution

### 1. Run Database Migration

Execute the SQL script to add missing columns:

```sql
-- Run this in your Supabase SQL editor or database client
-- File: docs/ADD-USER-PLAN-COLUMNS.sql

-- Add plan_type column
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'Starter';

-- Add plan_id column (UUID to reference plans table)
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id UUID;

-- Add max_projects column
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_projects INTEGER DEFAULT 1;

-- Add can_use_features column (JSONB array)
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_use_features JSONB DEFAULT '[]';

-- Add plan_expires_at column
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP;

-- Add subscription_id column
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id TEXT;

-- Add updated_at column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
```

### 2. Verify Schema

After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('plan_type', 'plan_id', 'max_projects', 'can_use_features', 'plan_expires_at', 'subscription_id', 'updated_at')
ORDER BY column_name;
```

### 3. Test Payment Flow

After fixing the schema:

1. **Make a test payment**
2. **Check server logs** for:
   ```
   Full update succeeded
   User plan updated successfully with plan type: Growth
   Verification - Updated user plan_type: Growth
   ```

3. **Check database** directly:
   ```sql
   SELECT plan_type, plan_id, max_projects, can_use_features, plan_expires_at 
   FROM users 
   WHERE id = 'your-user-id';
   ```

## API Improvements Made

### 1. Robust Update Logic
The payment success API now:
- Tries to update with all columns first
- Falls back to essential columns only if schema is incomplete
- Provides detailed logging for debugging

### 2. Essential Columns Fallback
If the full update fails, it will update only:
- `plan_type` (required)
- `plan_id` (required)
- `subscription_id` (optional)
- `updated_at` (required)

### 3. Enhanced Error Handling
- Detailed error logging
- Graceful fallback to essential updates
- Verification of update success

## Expected Behavior After Fix

### Before Fix (Current Error):
```
Error updating user plan: {
  code: 'PGRST204',
  message: "Could not find the 'can_use_features' column of 'users' in the schema cache"
}
user_plan_updated: false
```

### After Fix (Expected Success):
```
Full update succeeded
User plan updated successfully with plan type: Growth
Verification - Updated user plan_type: Growth
user_plan_updated: true
```

## Manual Database Check

If you want to manually verify the database update:

```sql
-- Check user's current plan
SELECT id, email, plan_type, plan_id, max_projects, can_use_features, plan_expires_at, updated_at 
FROM users 
WHERE email = 'your-email@example.com';

-- Check if plan exists
SELECT id, name, plan_type, max_projects, can_use_features 
FROM plans 
WHERE plan_type = 'Growth' AND is_active = true;
```

## Troubleshooting

### If migration fails:
1. Check database permissions
2. Verify you're connected to the correct database
3. Check if columns already exist

### If update still fails:
1. Check server logs for specific error messages
2. Verify user exists in users table
3. Verify plan exists in plans table
4. Check foreign key constraints

### If UI doesn't update:
1. Check browser console for useUserPlan logs
2. Verify database has correct plan_type
3. Try manual page refresh (F5)

## Next Steps

1. **Run the database migration** (docs/ADD-USER-PLAN-COLUMNS.sql)
2. **Test a payment** to verify the fix
3. **Check server logs** for successful update messages
4. **Verify database** has correct plan_type
5. **Check UI** shows updated plan

The system should now properly update the users table and the UI should reflect the changes after payment.
