-- Add duration columns to plans table
ALTER TABLE public.plans 
ADD COLUMN start_date timestamp with time zone NULL,
ADD COLUMN end_date timestamp with time zone NULL;

-- Add index for date range queries
CREATE INDEX IF NOT EXISTS idx_plans_date_range ON public.plans 
USING btree (start_date, end_date) 
TABLESPACE pg_default;

-- Add index for active plans with date range
CREATE INDEX IF NOT EXISTS idx_plans_active_date_range ON public.plans 
USING btree (is_active, start_date, end_date) 
TABLESPACE pg_default;

-- Add comment for the new columns
COMMENT ON COLUMN public.plans.start_date IS 'Plan availability start date';
COMMENT ON COLUMN public.plans.end_date IS 'Plan availability end date';

-- Update the existing plans table structure with all columns
-- This is the complete schema with the new duration columns:

CREATE TABLE IF NOT EXISTS public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(255) NOT NULL,
  plan_type character varying(50) NOT NULL,
  description text NULL,
  price numeric(10, 2) NULL DEFAULT 0.00,
  currency character varying(3) NULL DEFAULT 'INR'::character varying,
  billing_cycle character varying(20) NULL DEFAULT 'monthly'::character varying,
  max_projects integer NULL DEFAULT 1,
  can_use_features text[] NULL DEFAULT '{}'::text[],
  is_active boolean NULL DEFAULT true,
  razorpay_plan_id character varying(255) NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL,
  sort_order integer NULL DEFAULT 0,
  features text[] NULL DEFAULT '{}'::text[],
  start_date timestamp with time zone NULL,
  end_date timestamp with time zone NULL,
  CONSTRAINT plans_pkey PRIMARY KEY (id),
  CONSTRAINT plans_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id),
  CONSTRAINT plans_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users (id),
  CONSTRAINT plans_billing_cycle_check CHECK (
    (billing_cycle)::text = ANY (
      (ARRAY[
        'monthly'::character varying,
        'yearly'::character varying
      ])::text[]
    )
  ),
  CONSTRAINT plans_plan_type_check CHECK (
    (plan_type)::text = ANY (
      (ARRAY[
        'Starter'::character varying,
        'Growth'::character varying,
        'Scale'::character varying
      ])::text[]
    )
  )
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON public.plans USING btree (is_active) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_plans_plan_type ON public.plans USING btree (plan_type) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_plans_created_at ON public.plans USING btree (created_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_plans_date_range ON public.plans USING btree (start_date, end_date) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_plans_active_date_range ON public.plans USING btree (is_active, start_date, end_date) TABLESPACE pg_default;

-- Create or replace trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at 
    BEFORE UPDATE ON plans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
