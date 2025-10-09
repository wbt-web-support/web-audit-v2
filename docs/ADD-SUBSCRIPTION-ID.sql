-- Add subscription_id column to plans table for Razorpay subscriptions
-- This column will store the pre-created Razorpay subscription ID for each plan

ALTER TABLE public.plans ADD COLUMN subscription_id character varying(255) NULL;

-- Add comment to explain the column purpose
COMMENT ON COLUMN public.plans.subscription_id IS 'Pre-created Razorpay subscription ID for this plan. Required for subscription-based payments.';

-- Create index for better performance
CREATE INDEX idx_plans_subscription_id ON public.plans(subscription_id);

-- Update existing plans to have NULL subscription_id initially
-- Admin will need to configure these manually in the admin panel
UPDATE public.plans SET subscription_id = NULL WHERE subscription_id IS NULL;
