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

-- Verify the table was created successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'admin_alerts' 
ORDER BY column_name;
