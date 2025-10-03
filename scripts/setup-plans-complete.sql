-- Complete setup script for plans table
-- This script will create everything needed for the plans system

-- Step 1: Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  razorpay_plan_id VARCHAR(100) UNIQUE,
  amount INTEGER NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  interval_type VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (interval_type IN ('monthly', 'yearly', 'weekly', 'daily')),
  interval_count INTEGER NOT NULL DEFAULT 1,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  limits JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  color VARCHAR(20) DEFAULT 'gray',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_plans_type ON plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_razorpay_id ON plans(razorpay_plan_id);
CREATE INDEX IF NOT EXISTS idx_plans_sort_order ON plans(sort_order);

-- Step 3: Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies (if any)
DROP POLICY IF EXISTS "Allow authenticated users to read active plans" ON plans;
DROP POLICY IF EXISTS "Allow public read access to active plans" ON plans;
DROP POLICY IF EXISTS "Allow admins to manage plans" ON plans;

-- Step 5: Create new policies
-- Allow anyone to read active plans
CREATE POLICY "Allow public read access to active plans" ON plans
  FOR SELECT
  TO public
  USING (is_active = true);

-- Allow admins to manage all plans
CREATE POLICY "Allow admins to manage plans" ON plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Step 6: Create update trigger
CREATE OR REPLACE FUNCTION update_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_plans_updated_at();

-- Step 7: Grant permissions
GRANT ALL ON plans TO authenticated;
GRANT ALL ON plans TO service_role;
GRANT SELECT ON plans TO anon;

-- Step 8: Insert default plans (only if they don't exist)
DO $$
BEGIN
  -- Insert Free plan
  IF NOT EXISTS (SELECT 1 FROM plans WHERE plan_type = 'free') THEN
    INSERT INTO plans (name, description, plan_type, amount, currency, interval_type, features, limits, is_popular, color, sort_order) VALUES
    (
      'Free',
      'Perfect for personal projects and small websites',
      'free',
      0,
      'INR',
      'monthly',
      '[
        {"name": "Up to 5 audits per month", "description": "Limited monthly audits", "icon": "📊"},
        {"name": "Basic SEO analysis", "description": "Essential SEO metrics", "icon": "🔍"},
        {"name": "Performance metrics", "description": "Core performance data", "icon": "⚡"},
        {"name": "Security scan", "description": "Basic security check", "icon": "🔒"},
        {"name": "Mobile responsiveness check", "description": "Mobile compatibility test", "icon": "📱"},
        {"name": "Email support", "description": "Basic email support", "icon": "📧"}
      ]'::jsonb,
      '{
        "max_audits_per_month": 5,
        "max_pages_per_audit": 10,
        "max_projects": 3,
        "retention_days": 30,
        "api_calls_per_month": 100
      }'::jsonb,
      false,
      'gray',
      1
    );
  END IF;

  -- Insert Pro plan
  IF NOT EXISTS (SELECT 1 FROM plans WHERE plan_type = 'pro') THEN
    INSERT INTO plans (name, description, plan_type, amount, currency, interval_type, features, limits, is_popular, color, sort_order) VALUES
    (
      'Pro',
      'Ideal for growing businesses and agencies',
      'pro',
      290000,
      'INR',
      'monthly',
      '[
        {"name": "Unlimited audits", "description": "No monthly limits", "icon": "♾️"},
        {"name": "Advanced SEO analysis", "description": "Comprehensive SEO insights", "icon": "📈"},
        {"name": "Core Web Vitals tracking", "description": "Performance monitoring", "icon": "📊"},
        {"name": "Brand consistency check", "description": "Brand guideline compliance", "icon": "🎨"},
        {"name": "Custom audit rules", "description": "Personalized audit criteria", "icon": "⚙️"},
        {"name": "Priority support", "description": "Fast response times", "icon": "🚀"},
        {"name": "API access", "description": "REST API integration", "icon": "🔌"},
        {"name": "White-label reports", "description": "Custom branded reports", "icon": "📄"}
      ]'::jsonb,
      '{
        "max_audits_per_month": -1,
        "max_pages_per_audit": 100,
        "max_projects": -1,
        "retention_days": 365,
        "api_calls_per_month": 10000,
        "priority_support": true,
        "api_access": true,
        "white_label": true
      }'::jsonb,
      true,
      'black',
      2
    );
  END IF;

  -- Insert Enterprise plan
  IF NOT EXISTS (SELECT 1 FROM plans WHERE plan_type = 'enterprise') THEN
    INSERT INTO plans (name, description, plan_type, amount, currency, interval_type, features, limits, is_popular, color, sort_order) VALUES
    (
      'Enterprise',
      'For large organizations with specific needs',
      'enterprise',
      0,
      'INR',
      'monthly',
      '[
        {"name": "Everything in Pro", "description": "All Pro features included", "icon": "✅"},
        {"name": "Dedicated account manager", "description": "Personal account support", "icon": "👤"},
        {"name": "Custom integrations", "description": "Tailored integrations", "icon": "🔗"},
        {"name": "Advanced security scanning", "description": "Enhanced security features", "icon": "🛡️"},
        {"name": "Team collaboration tools", "description": "Multi-user workspace", "icon": "👥"},
        {"name": "Custom reporting", "description": "Personalized reports", "icon": "📊"},
        {"name": "SLA guarantee", "description": "Service level agreement", "icon": "📋"},
        {"name": "24/7 phone support", "description": "Round-the-clock support", "icon": "📞"}
      ]'::jsonb,
      '{
        "max_audits_per_month": -1,
        "max_pages_per_audit": -1,
        "max_projects": -1,
        "retention_days": -1,
        "api_calls_per_month": -1,
        "priority_support": true,
        "api_access": true,
        "white_label": true,
        "dedicated_support": true,
        "custom_integrations": true,
        "sla_guarantee": true,
        "phone_support": true
      }'::jsonb,
      false,
      'gray',
      3
    );
  END IF;
END $$;

-- Step 9: Test the setup
SELECT 'Setup complete! Plans table created with ' || COUNT(*) || ' plans.' as status FROM plans;
