-- Complete users table setup for plan management
-- This script ensures all required columns exist for the payment system

-- First, check what columns currently exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY column_name;

-- Add all required columns for plan management
-- These are the minimum required columns for the payment system to work

-- 1. plan_type (required) - The user's current plan type
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'Starter';

-- 2. plan_id (required) - Reference to the plans table
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id UUID;

-- 3. max_projects (optional) - Maximum projects allowed for this plan
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_projects INTEGER DEFAULT 1;

-- 4. can_use_features (optional) - JSONB array of features the user can access
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_use_features JSONB DEFAULT '[]';

-- 5. plan_expires_at (optional) - When the plan expires
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP;

-- 6. subscription_id (optional) - Razorpay subscription ID
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id TEXT;

-- 7. updated_at (optional) - Last update timestamp
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);
CREATE INDEX IF NOT EXISTS idx_users_plan_id ON users(plan_id);
CREATE INDEX IF NOT EXISTS idx_users_plan_expires_at ON users(plan_expires_at);

-- Update existing users to have default plan_type if null
UPDATE users 
SET plan_type = 'Starter' 
WHERE plan_type IS NULL;

-- Verify all columns were added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('plan_type', 'plan_id', 'max_projects', 'can_use_features', 'plan_expires_at', 'subscription_id', 'updated_at')
ORDER BY column_name;

-- Test query to verify the setup works
SELECT 
  id, 
  email, 
  plan_type, 
  plan_id, 
  max_projects, 
  can_use_features, 
  plan_expires_at, 
  subscription_id, 
  updated_at 
FROM users 
LIMIT 1;
