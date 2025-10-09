-- Add razorpay_plan_id column to plans table if it doesn't exist
-- This script is safe to run multiple times

DO $$ 
BEGIN
    -- Add razorpay_plan_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plans' AND column_name = 'razorpay_plan_id'
    ) THEN
        ALTER TABLE public.plans ADD COLUMN razorpay_plan_id character varying(255) NULL;
        COMMENT ON COLUMN public.plans.razorpay_plan_id IS 'Razorpay plan ID for subscription payments';
    END IF;
END $$;

-- Add index for razorpay_plan_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_plans_razorpay_plan_id ON public.plans 
USING btree (razorpay_plan_id) 
TABLESPACE pg_default;

-- Verify the column exists
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'plans' 
AND column_name = 'razorpay_plan_id';
