-- Create credit_packages table for managing credit pricing
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  credits INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT credit_packages_pkey PRIMARY KEY (id),
  CONSTRAINT credit_packages_credits_unique UNIQUE (credits),
  CONSTRAINT credit_packages_credits_positive CHECK (credits > 0),
  CONSTRAINT credit_packages_price_positive CHECK (price > 0)
) TABLESPACE pg_default;

-- Create index for active packages
CREATE INDEX IF NOT EXISTS idx_credit_packages_active ON public.credit_packages (is_active, sort_order);

-- Add comment
COMMENT ON TABLE public.credit_packages IS 'Credit packages available for purchase. Each package defines the number of credits and their price.';

-- Insert default credit packages
INSERT INTO public.credit_packages (credits, price, label, sort_order) VALUES
  (10, 100.00, '10 Credits', 1),
  (25, 200.00, '25 Credits', 2),
  (50, 350.00, '50 Credits', 3),
  (100, 600.00, '100 Credits', 4),
  (250, 1200.00, '250 Credits', 5),
  (500, 2000.00, '500 Credits', 6)
ON CONFLICT (credits) DO NOTHING;

