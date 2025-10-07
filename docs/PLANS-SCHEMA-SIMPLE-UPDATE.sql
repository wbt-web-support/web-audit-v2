-- Simple update to add missing columns to existing plans table
-- This script is safe to run multiple times

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add start_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plans' AND column_name = 'start_date'
    ) THEN
        ALTER TABLE public.plans ADD COLUMN start_date timestamp with time zone NULL;
    END IF;
    
    -- Add end_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plans' AND column_name = 'end_date'
    ) THEN
        ALTER TABLE public.plans ADD COLUMN end_date timestamp with time zone NULL;
    END IF;
    
    -- Add billing_cycle column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plans' AND column_name = 'billing_cycle'
    ) THEN
        ALTER TABLE public.plans ADD COLUMN billing_cycle character varying(20) NULL DEFAULT 'monthly';
    END IF;
    
    -- Add color column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plans' AND column_name = 'color'
    ) THEN
        ALTER TABLE public.plans ADD COLUMN color character varying(50) NULL DEFAULT 'gray';
    END IF;
    
    -- Add is_popular column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plans' AND column_name = 'is_popular'
    ) THEN
        ALTER TABLE public.plans ADD COLUMN is_popular boolean NULL DEFAULT false;
    END IF;
    
    -- Add interval_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plans' AND column_name = 'interval_type'
    ) THEN
        ALTER TABLE public.plans ADD COLUMN interval_type character varying(20) NULL DEFAULT 'monthly';
    END IF;
    
    -- Add interval_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plans' AND column_name = 'interval_count'
    ) THEN
        ALTER TABLE public.plans ADD COLUMN interval_count integer NULL DEFAULT 1;
    END IF;
    
    -- Add limits column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plans' AND column_name = 'limits'
    ) THEN
        ALTER TABLE public.plans ADD COLUMN limits jsonb NULL DEFAULT '{}';
    END IF;
END $$;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_plans_date_range ON public.plans 
USING btree (start_date, end_date) 
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_plans_active_date_range ON public.plans 
USING btree (is_active, start_date, end_date) 
TABLESPACE pg_default;

-- Add comments for the new columns
COMMENT ON COLUMN public.plans.start_date IS 'Plan availability start date';
COMMENT ON COLUMN public.plans.end_date IS 'Plan availability end date';

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'plans' 
AND column_name IN ('start_date', 'end_date')
ORDER BY column_name;
