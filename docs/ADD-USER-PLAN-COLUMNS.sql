-- Add missing columns to users table for plan management
-- Run this script to add the required columns for user plan functionality

-- Add plan_type column
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'Starter';

-- Add plan_id column (UUID to reference plans table)
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id UUID;

-- Add max_projects column
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_projects INTEGER DEFAULT 1;

-- Add can_use_features column (JSONB array)
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_use_features JSONB DEFAULT '[]';

-- Add plan_expires_at column
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP;

-- Add subscription_id column
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id TEXT;

-- Add updated_at column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create index on plan_type for better performance
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);

-- Create index on plan_id for better performance
CREATE INDEX IF NOT EXISTS idx_users_plan_id ON users(plan_id);

-- Create index on plan_expires_at for better performance
CREATE INDEX IF NOT EXISTS idx_users_plan_expires_at ON users(plan_expires_at);

-- Update existing users to have default plan_type if null
UPDATE users 
SET plan_type = 'Starter' 
WHERE plan_type IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('plan_type', 'plan_id', 'max_projects', 'can_use_features', 'plan_expires_at', 'subscription_id', 'updated_at')
ORDER BY column_name;
