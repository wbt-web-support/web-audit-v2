# Payment Plan Update Debug Guide

## Issues Fixed

### 1. User Plan Hook (`useUserPlan.ts`)
- **Problem**: Hook was not properly reading updated user data from database
- **Solution**: 
  - Enhanced to read `plan_type`, `plan_id`, `max_projects`, `can_use_features` directly from users table
  - Added comprehensive logging to track data flow
  - Improved fallback logic for missing data

### 2. Plan Refresh Mechanism
- **Problem**: UI was not updating after payment success
- **Solution**:
  - Added multiple refresh triggers (custom events, localStorage, window focus)
  - Added automatic page reload after payment success
  - Enhanced event listeners for better reliability

### 3. Database Update Verification
- **Problem**: Users table plan_type not being updated
- **Solution**: Enhanced payment success API to update comprehensive user data

## Debug Steps

### 1. Check Database Update
After payment, verify in your database:

```sql
SELECT id, email, plan_type, plan_id, max_projects, can_use_features, plan_expires_at 
FROM users 
WHERE id = 'your-user-id';
```

**Expected**: `plan_type` should be updated (e.g., 'Growth', 'Scale'), not 'Starter'

### 2. Check Browser Console
Look for these log messages:

```
User data from database: {plan_type: "Growth", plan_id: "...", ...}
Using user data directly from users table
Final user plan: {plan_type: "Growth", plan_name: "Growth Plan", ...}
```

### 3. Check Payment Success API Logs
Look for these server logs:

```
User plan updated successfully with plan type: Growth
Payment processed successfully
```

### 4. Check UI Update
After payment success:
1. Page should reload automatically after 2 seconds
2. Sidebar should show new plan type
3. Billing section should show updated plan

## Common Issues & Solutions

### Issue: Still showing "Starter" plan
**Check**: 
1. Database - is `plan_type` updated in users table?
2. Console - are there any errors in `useUserPlan` hook?
3. Network - did payment success API return 200?

### Issue: Plan updates but UI doesn't refresh
**Check**:
1. Browser console for "Plan update detected" messages
2. Try manual refresh (F5)
3. Check if localStorage has 'plan_updated' key

### Issue: Payment success but database not updated
**Check**:
1. Server logs for "User plan updated successfully"
2. Database connection in payment success API
3. User authentication in payment success API

## Testing Checklist

- [ ] Payment completes successfully
- [ ] Database `users.plan_type` is updated
- [ ] Console shows "User data from database" with correct plan_type
- [ ] Console shows "Using user data directly from users table"
- [ ] Console shows "Final user plan" with correct plan details
- [ ] Page reloads automatically after payment
- [ ] Sidebar shows new plan type
- [ ] Billing section shows updated plan

## Manual Testing

If automatic refresh doesn't work:

1. **Manual refresh**: Press F5 after payment
2. **Check localStorage**: `localStorage.getItem('plan_updated')`
3. **Trigger custom event**: 
   ```javascript
   window.dispatchEvent(new CustomEvent('planUpdated'));
   ```

## Database Schema Requirements

Ensure these columns exist in `users` table:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_projects INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_use_features JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP;
```

## API Endpoints to Monitor

1. **POST /api/payment-success** - Should return 200 with success: true
2. **GET /api/plans** - Should load plans from database
3. **GET /api/payment-history** - Should work without 401 errors

## Expected Flow

1. User clicks paid plan → Razorpay opens
2. Payment completes → Payment success API called
3. API updates users table with new plan data
4. API returns success response
5. Frontend triggers multiple refresh mechanisms
6. Page reloads automatically
7. useUserPlan hook fetches updated data
8. UI shows new plan type
