# Razorpay Plan ID Integration Guide

This guide explains how to set up and use different Razorpay plan IDs for each subscription plan in your web audit application.

## Overview

The system now supports linking each plan in your database to a specific Razorpay plan ID. When users start payment, the system will use the corresponding Razorpay plan ID to create subscriptions.

## Database Schema

The `plans` table includes a `razorpay_plan_id` column:

```sql
ALTER TABLE public.plans ADD COLUMN razorpay_plan_id character varying(255) NULL;
```

## How It Works

### 1. Plan Configuration
- Each plan in your database can have a `razorpay_plan_id` field
- This field should contain the actual Razorpay plan ID from your Razorpay dashboard
- Plans without a `razorpay_plan_id` cannot be used for online payments

### 2. Payment Flow
1. User selects a plan on the pricing page
2. System checks if the plan has a `razorpay_plan_id`
3. If configured, creates a Razorpay subscription using that plan ID
4. If not configured, shows an error message

### 3. API Endpoints

#### `/api/create-subscription`
- Fetches plan details from database
- Validates that `razorpay_plan_id` exists
- Creates Razorpay subscription using the plan ID
- Returns subscription details for frontend

#### `/api/create-order`
- Also supports plan-based subscriptions
- Can create either one-time orders or subscriptions based on plan configuration

## Admin Panel Integration

### Plan Management
- Admin can view and edit `razorpay_plan_id` for each plan
- Table shows whether Razorpay ID is configured
- Form includes field for entering/updating Razorpay plan ID

### Validation
- System validates Razorpay plan ID before allowing payments
- Clear error messages when plan is not configured
- Prevents payment attempts for unconfigured plans

## Setup Instructions

### 1. Database Setup
Run the SQL script to ensure the column exists:
```sql
-- See docs/ADD-RAZORPAY-PLAN-ID.sql
```

### 2. Razorpay Dashboard Setup
1. Create plans in your Razorpay dashboard
2. Copy the plan IDs (e.g., `plan_XXXXXXXXXXXXXX`)
3. Add these IDs to your database plans

### 3. Environment Variables
Ensure these are set:
```env
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_public_key_id
```

## Usage Examples

### Adding Razorpay Plan ID to Existing Plan
```sql
UPDATE plans 
SET razorpay_plan_id = 'plan_XXXXXXXXXXXXXX' 
WHERE id = 'your-plan-id';
```

### Creating New Plan with Razorpay ID
```javascript
const planData = {
  name: 'Growth Plan',
  plan_type: 'Growth',
  price: 2999,
  currency: 'INR',
  billing_cycle: 'monthly',
  razorpay_plan_id: 'plan_XXXXXXXXXXXXXX',
  // ... other fields
};
```

## Error Handling

### Common Errors
1. **"Razorpay plan ID not configured"** - Plan doesn't have a Razorpay ID
2. **"Plan not found"** - Invalid plan ID in request
3. **"Payment system not available"** - Razorpay not loaded on frontend

### Error Responses
```json
{
  "error": "Razorpay plan ID not configured for this plan",
  "details": "Please configure a valid Razorpay plan ID in the admin panel before users can subscribe to this plan."
}
```

## Frontend Integration

### Pricing Section
- Automatically checks for `razorpay_plan_id` before payment
- Shows appropriate error messages
- Handles Razorpay payment flow

### Admin Panel
- Displays Razorpay plan ID status in plans table
- Form field for managing Razorpay plan IDs
- Visual indicators for configured vs unconfigured plans

## Best Practices

1. **Always configure Razorpay plan IDs** for paid plans
2. **Test payment flow** after adding new plans
3. **Keep Razorpay dashboard in sync** with database plans
4. **Use descriptive plan names** in Razorpay dashboard
5. **Monitor payment success rates** and error logs

## Troubleshooting

### Payment Not Working
1. Check if `razorpay_plan_id` is set in database
2. Verify Razorpay plan exists in dashboard
3. Check environment variables
4. Review browser console for errors

### Plan Not Showing
1. Ensure plan is active (`is_active = true`)
2. Check date range (start_date/end_date)
3. Verify plan type and billing cycle

## Security Notes

- Razorpay plan IDs are not sensitive (they're public identifiers)
- Never expose Razorpay secret keys in frontend
- Validate all plan data before processing payments
- Use webhooks for payment verification

## Support

For issues with this integration:
1. Check the error logs in your application
2. Verify Razorpay dashboard configuration
3. Test with Razorpay test mode first
4. Contact support if issues persist
