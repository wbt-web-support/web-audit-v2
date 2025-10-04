-- Script to recreate the plans table with RLS policies
-- This will create a clean plans table with proper constraints and policies

-- Step 1: Drop the existing table if it exists (this will remove all data)
DROP TABLE IF EXISTS plans CASCADE;

-- Step 2: Create the plans table with proper structure
CREATE TABLE plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('Starter', 'Growth', 'Scale')),
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'INR',
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    max_projects INTEGER DEFAULT 1,
    can_use_features TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    razorpay_plan_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Step 3: Create indexes for better performance
CREATE INDEX idx_plans_plan_type ON plans(plan_type);
CREATE INDEX idx_plans_is_active ON plans(is_active);
CREATE INDEX idx_plans_created_at ON plans(created_at);

-- Step 4: Create RLS policies
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow everyone to read active plans
CREATE POLICY "Allow public read access to active plans" ON plans
    FOR SELECT
    USING (is_active = true);

-- Policy 2: Allow authenticated users to read all plans (for admin purposes)
CREATE POLICY "Allow authenticated users to read all plans" ON plans
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 3: Allow only authenticated users with admin role to insert plans
CREATE POLICY "Allow admin users to insert plans" ON plans
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policy 4: Allow only authenticated users with admin role to update plans
CREATE POLICY "Allow admin users to update plans" ON plans
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policy 5: Allow only authenticated users with admin role to delete plans
CREATE POLICY "Allow admin users to delete plans" ON plans
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Step 5: Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 6: Create trigger to automatically update updated_at
CREATE TRIGGER update_plans_updated_at 
    BEFORE UPDATE ON plans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Insert default plans
INSERT INTO plans (name, plan_type, description, price, max_projects, can_use_features, is_active) VALUES
('Free Plan', 'Starter', 'Free plan with basic features - perfect for getting started', 0.00, 1, ARRAY['basic_audit'], true),
('Pro Plan', 'Growth', 'Professional plan with advanced features - ideal for growing businesses', 29.99, 5, ARRAY['basic_audit', 'advanced_audit', 'seo_analysis'], true),
('Enterprise Plan', 'Scale', 'Enterprise plan with all features - perfect for large organizations', 99.99, 50, ARRAY['basic_audit', 'advanced_audit', 'seo_analysis', 'performance_analysis', 'custom_reports'], true);

-- Step 8: Grant necessary permissions
GRANT SELECT ON plans TO anon;
GRANT SELECT ON plans TO authenticated;
GRANT INSERT, UPDATE, DELETE ON plans TO authenticated;

-- Step 9: Verify the table creation
SELECT '--- Plans table recreated successfully ---' as status;
SELECT '--- Current plan count ---' as status;
SELECT COUNT(*) as total_plans FROM plans;

SELECT '--- Plans by type ---' as status;
SELECT plan_type, COUNT(*) as count FROM plans GROUP BY plan_type ORDER BY plan_type;

SELECT '--- All plans ---' as status;
SELECT id, name, plan_type, price, max_projects, is_active FROM plans ORDER BY plan_type;
