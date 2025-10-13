-- Create admin_alerts table for storing admin messages and alerts
-- This table will store alerts that admins can create to show to all users

-- Create the admin_alerts table
CREATE TABLE IF NOT EXISTS admin_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('info', 'warning', 'error', 'success', 'maintenance', 'announcement', 'offer')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    is_global BOOLEAN NOT NULL DEFAULT true,
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'free', 'premium', 'enterprise')),
    start_date TIMESTAMP DEFAULT NOW(),
    end_date TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 10),
    action_url TEXT,
    action_text TEXT,
    dismissible BOOLEAN DEFAULT true,
    auto_expire BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_alerts_status ON admin_alerts(status);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_type ON admin_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_severity ON admin_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_created_at ON admin_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_start_date ON admin_alerts(start_date);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_end_date ON admin_alerts(end_date);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_global ON admin_alerts(is_global);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_target_audience ON admin_alerts(target_audience);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_priority ON admin_alerts(priority);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_admin_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_admin_alerts_updated_at
    BEFORE UPDATE ON admin_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_alerts_updated_at();

-- Create a function to automatically expire alerts
CREATE OR REPLACE FUNCTION auto_expire_admin_alerts()
RETURNS void AS $$
BEGIN
    UPDATE admin_alerts 
    SET status = 'inactive' 
    WHERE auto_expire = true 
    AND end_date IS NOT NULL 
    AND end_date < NOW() 
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Insert some sample alerts for testing
-- Only insert if there are admin users in the system
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the first admin user ID
    SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
    
    -- Only insert sample data if we found an admin user
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO admin_alerts (title, message, alert_type, severity, status, priority, action_url, action_text, created_by) VALUES
        ('Welcome to Web Audit!', 'Thank you for joining our platform. Start your first website audit today!', 'info', 'low', 'active', 1, '/dashboard', 'Get Started', admin_user_id),
        ('System Maintenance', 'We will be performing scheduled maintenance on Sunday from 2-4 AM EST.', 'maintenance', 'medium', 'active', 3, null, null, admin_user_id),
        ('New Features Available', 'Check out our latest SEO analysis tools and performance insights!', 'announcement', 'low', 'active', 2, '/features', 'Learn More', admin_user_id),
        ('Special Offer', 'Get 50% off on our Premium plan for the first 3 months!', 'offer', 'medium', 'active', 4, '/pricing', 'Claim Offer', admin_user_id);
        
        RAISE NOTICE 'Sample alerts inserted successfully';
    ELSE
        RAISE NOTICE 'No admin users found. Skipping sample data insertion.';
    END IF;
END $$;

-- Enable RLS
ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow all authenticated users to read alerts (for public display)
CREATE POLICY "Allow authenticated users to read alerts" ON admin_alerts
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins to manage alerts
CREATE POLICY "Allow admins to manage alerts" ON admin_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Verify the table was created successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'admin_alerts' 
ORDER BY column_name;
