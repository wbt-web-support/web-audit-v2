# Database Schema Troubleshooting Guide

## Current Issue

The payment success API is failing because the `users` table is missing required columns:

```
Error: Could not find the 'subscription_id' column of 'users' in the schema cache
```

## Step-by-Step Fix

### 1. Check Current Schema

First, run this query to see what columns exist in your users table:

```sql
-- File: docs/CHECK-USER-TABLE-SCHEMA.sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY column_name;
```

### 2. Add Missing Columns

Run the complete setup script:

```sql
-- File: docs/COMPLETE-USER-TABLE-SETUP.sql
-- This will add all required columns
```

### 3. Verify Schema

After running the setup, verify all columns exist:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('plan_type', 'plan_id', 'max_projects', 'can_use_features', 'plan_expires_at', 'subscription_id', 'updated_at')
ORDER BY column_name;
```

## Expected Results

After running the setup, you should see:

```
column_name        | data_type | is_nullable | column_default
-------------------|-----------|-------------|---------------
can_use_features   | jsonb     | YES         | '[]'::jsonb
max_projects       | integer   | YES         | 1
plan_expires_at    | timestamp | YES         | 
plan_id            | uuid      | YES         | 
plan_type          | text      | YES         | 'Starter'
subscription_id    | text      | YES         | 
updated_at         | timestamp | YES         | now()
```

## API Behavior After Fix

### Before Fix (Current Error):
```
Full update failed, trying with essential columns only: Could not find the 'subscription_id' column
Essential update also failed: Could not find the 'subscription_id' column
user_plan_updated: false
```

### After Fix (Expected Success):
```
Full update succeeded
User plan updated successfully with plan type: Growth
Verification - Updated user plan_type: Growth
user_plan_updated: true
```

## Manual Testing

### 1. Test Database Update
```sql
-- Update a user's plan manually to test
UPDATE users 
SET plan_type = 'Growth', 
    plan_id = 'test-plan-id',
    updated_at = NOW()
WHERE id = 'your-user-id';

-- Verify the update
SELECT plan_type, plan_id, updated_at 
FROM users 
WHERE id = 'your-user-id';
```

### 2. Test Payment Flow
1. Make a test payment
2. Check server logs for successful update messages
3. Verify database has correct plan_type

## Common Issues

### Issue: "Could not find column" errors
**Solution**: Run the complete setup script to add missing columns

### Issue: Permission denied
**Solution**: Ensure you have ALTER TABLE permissions on the users table

### Issue: Column already exists
**Solution**: The script uses `ADD COLUMN IF NOT EXISTS` so it's safe to run multiple times

### Issue: Foreign key constraint errors
**Solution**: Ensure the plans table exists and has the correct structure

## Quick Fix Commands

If you want to add just the essential columns quickly:

```sql
-- Minimal setup - just the required columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'Starter';
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
```

## Verification Steps

1. **Check schema**: Run the schema check query
2. **Add columns**: Run the complete setup script
3. **Verify columns**: Run the verification query
4. **Test payment**: Make a test payment
5. **Check logs**: Look for "Full update succeeded" in server logs
6. **Check database**: Verify plan_type is updated in users table

## Expected Server Logs After Fix

```
Updating user plan with data: {plan_type: "Growth", plan_id: "...", ...}
Updating user ID: [user-id]
Full update succeeded
User plan updated successfully with plan type: Growth
Updated user data: [{id: "...", plan_type: "Growth", ...}]
Verification - Updated user plan_type: Growth
Verification - Updated user plan_id: [plan-id]
```

The system should work correctly once all required columns are added to the users table.
