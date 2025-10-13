# Database Update Test Guide

## Issues Fixed

### 1. Enhanced Payment Success API Logging
- Added detailed logging for database update operations
- Added verification of update results
- Added error details for debugging

### 2. Improved PricingSection Refresh
- Increased wait time from 2 to 3 seconds before page reload
- Added comprehensive logging for refresh mechanisms
- Enhanced both main and fallback payment handlers

## Test Steps

### 1. Make a Test Payment
1. Go to pricing page
2. Click on a paid plan
3. Complete Razorpay payment
4. Check browser console for logs

### 2. Check Server Logs
Look for these logs in your server console:

```
Updating user plan with data: {plan_type: "Growth", plan_id: "...", ...}
Updating user ID: [user-id]
User plan updated successfully with plan type: Growth
Updated user data: [{id: "...", plan_type: "Growth", ...}]
Verification - Updated user plan_type: Growth
Verification - Updated user plan_id: [plan-id]
```

### 3. Check Database Directly
After payment, run this SQL query:

```sql
SELECT id, email, plan_type, plan_id, max_projects, can_use_features, plan_expires_at, updated_at 
FROM users 
WHERE id = 'your-user-id';
```

**Expected**: `plan_type` should be updated (e.g., 'Growth', 'Scale'), not 'Starter'

### 4. Check Browser Console
Look for these logs:

```
Payment success response: {success: true, plan_details: {...}}
Plan details: {plan_name: "Growth Plan", plan_type: "Growth", ...}
Triggering plan refresh mechanisms...
Waiting 3 seconds before page reload...
Reloading page to show updated plan...
```

### 5. Check useUserPlan Hook
After page reload, look for:

```
User data from database: {plan_type: "Growth", plan_id: "...", ...}
Using user data directly from users table
Final user plan: {plan_type: "Growth", plan_name: "Growth Plan", ...}
```

## Common Issues & Solutions

### Issue: Database not updated
**Check**:
1. Server logs for "User plan updated successfully"
2. Database connection in payment success API
3. User authentication in payment success API
4. Check if user exists in users table

### Issue: UI not updating after reload
**Check**:
1. Browser console for "User data from database" with correct plan_type
2. Check if useUserPlan hook is fetching updated data
3. Verify database has correct plan_type

### Issue: Payment success but no database update
**Check**:
1. Server logs for database update errors
2. Check if user exists in users table
3. Verify plan exists in plans table
4. Check foreign key constraints

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

-- Check recent payments
SELECT id, user_id, plan_id, amount, plan_name, plan_type, payment_status, payment_date 
FROM payments 
WHERE user_id = 'your-user-id' 
ORDER BY payment_date DESC 
LIMIT 5;
```

## Expected Flow

1. **Payment completes** → Razorpay returns success
2. **Payment success API called** → Updates users table
3. **Server logs show** → "User plan updated successfully"
4. **Database verified** → plan_type updated in users table
5. **Frontend triggers refresh** → Multiple mechanisms
6. **Page reloads** → After 3 seconds
7. **useUserPlan hook** → Fetches updated data
8. **UI updates** → Shows new plan type

## Debug Commands

### Check if user exists:
```sql
SELECT COUNT(*) FROM users WHERE id = 'your-user-id';
```

### Check if plan exists:
```sql
SELECT COUNT(*) FROM plans WHERE id = 'your-plan-id';
```

### Check recent updates:
```sql
SELECT * FROM users WHERE updated_at > NOW() - INTERVAL '1 hour' ORDER BY updated_at DESC;
```

## Troubleshooting

If database update fails:
1. Check server logs for specific error messages
2. Verify user exists in users table
3. Verify plan exists in plans table
4. Check database permissions
5. Check foreign key constraints

If UI doesn't update:
1. Check browser console for useUserPlan logs
2. Verify database has correct plan_type
3. Try manual page refresh (F5)
4. Check localStorage for 'plan_updated' key
