# Subscription ID Integration Guide

This guide explains the new subscription-based payment system using pre-created Razorpay subscription IDs.

## Overview

The system now uses pre-created Razorpay subscription IDs instead of creating subscriptions on-the-fly during payment. This provides better control over pricing and payment methods.

## Database Changes

### 1. Add subscription_id Column

Run the SQL script to add the new column:

```sql
-- See docs/ADD-SUBSCRIPTION-ID.sql
ALTER TABLE public.plans ADD COLUMN subscription_id character varying(255) NULL;
```

### 2. Database Schema

The `plans` table now includes:
- `razorpay_plan_id` - The Razorpay plan ID (for plan configuration)
- `subscription_id` - The pre-created Razorpay subscription ID (for payments)

## How It Works

### 1. Plan Configuration
- Each plan can have both `razorpay_plan_id` and `subscription_id`
- `razorpay_plan_id` is used for plan configuration and pricing
- `subscription_id` is used for actual payment processing

### 2. Payment Flow
1. User selects a plan on the pricing page
2. System checks if the plan has a `subscription_id`
3. If configured, uses the pre-created subscription for payment
4. If not configured, shows an error message

### 3. Admin Panel
- Admin can configure both `razorpay_plan_id` and `subscription_id` for each plan
- Clear instructions provided for creating subscription IDs in Razorpay dashboard

## Setup Instructions

### 1. Database Setup
```bash
# Run the SQL script
psql -d your_database -f docs/ADD-SUBSCRIPTION-ID.sql
```

### 2. Razorpay Dashboard Setup
1. Go to your Razorpay dashboard
2. Navigate to Subscriptions > Plans
3. Create a plan with your desired pricing
4. Create a subscription for that plan
5. Copy the subscription ID
6. Add it to your plan in the admin panel

### 3. Admin Panel Configuration
1. Go to Admin > Plans
2. Edit a plan
3. Add the `subscription_id` field
4. Save the plan

## API Changes

### Updated Endpoints
- `/api/plans` - Now includes `subscription_id` field
- `/api/plans/[id]` - Includes `subscription_id` in plan data

### Removed Dependencies
- No longer uses `/api/create-subscription` during payment
- Payment flow is simplified and more reliable

## Benefits

1. **Better Performance**: No API calls to create subscriptions during payment
2. **More Reliable**: Uses pre-configured subscriptions
3. **Better Control**: Admin can manage subscription settings in Razorpay dashboard
4. **Proper Pricing**: Subscription pricing is controlled by Razorpay plan configuration
5. **All Payment Methods**: UPI, Cards, Netbanking, Wallets, EMI all work properly

## Migration Steps

1. **Run Database Migration**: Execute the SQL script
2. **Update Plans**: Add `subscription_id` to existing plans in admin panel
3. **Test Payments**: Verify that payments work with the new system
4. **Remove Old Code**: The old subscription creation code is no longer needed

## Troubleshooting

### Common Issues
1. **"Subscription ID not configured"**: Add subscription_id to the plan in admin panel
2. **Payment methods not showing**: Ensure Razorpay keys are properly configured
3. **Pricing issues**: Check that Razorpay plan pricing matches your database pricing

### Debug Steps
1. Check browser console for debug logs
2. Verify subscription_id is properly set in database
3. Ensure Razorpay keys are correctly configured
4. Test with a simple plan first

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Razorpay dashboard configuration
3. Ensure all environment variables are set correctly
