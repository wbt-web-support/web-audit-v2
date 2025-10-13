-- Fix plan expiry database issues
-- This script fixes the plan_expires_at column and sets up proper testing

-- 1. Check current column structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('plan_type', 'plan_id', 'plan_expires_at', 'billing_cycle')
ORDER BY column_name;

-- 2. Add missing columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'Starter';
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_cycle TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_projects INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_use_features JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 3. Fix any invalid dates (set to NULL)
UPDATE users 
SET plan_expires_at = NULL 
WHERE plan_expires_at IS NOT NULL 
AND (plan_expires_at < '1900-01-01' OR plan_expires_at > '2100-01-01');

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);
CREATE INDEX IF NOT EXISTS idx_users_plan_id ON users(plan_id);
CREATE INDEX IF NOT EXISTS idx_users_plan_expires_at ON users(plan_expires_at);
CREATE INDEX IF NOT EXISTS idx_users_billing_cycle ON users(billing_cycle);

-- 5. Update existing users to have default plan_type if null
UPDATE users 
SET plan_type = 'Starter' 
WHERE plan_type IS NULL;

-- 6. Set test data for manual testing (replace 'your-user-id' with actual user ID)
-- Uncomment and modify these lines for testing:

-- Set expired plan (1 day ago)
-- UPDATE users 
-- SET plan_expires_at = NOW() - INTERVAL '1 day',
--     plan_type = 'Growth',
--     billing_cycle = 'monthly'
-- WHERE id = 'your-user-id';

-- Set active plan (30 days from now)
-- UPDATE users 
-- SET plan_expires_at = NOW() + INTERVAL '30 days',
--     plan_type = 'Growth',
--     billing_cycle = 'monthly'
-- WHERE id = 'your-user-id';

-- Set expiring soon (5 days from now)
-- UPDATE users 
-- SET plan_expires_at = NOW() + INTERVAL '5 days',
--     plan_type = 'Scale',
--     billing_cycle = 'yearly'
-- WHERE id = 'your-user-id';

-- 7. Verify the setup
SELECT 
  id, 
  email, 
  plan_type, 
  plan_expires_at, 
  billing_cycle,
  created_at
FROM users 
WHERE plan_type != 'Starter' OR plan_expires_at IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 8. Check for any remaining invalid dates
SELECT id, email, plan_expires_at
FROM users 
WHERE plan_expires_at IS NOT NULL 
AND (plan_expires_at < '1900-01-01' OR plan_expires_at > '2100-01-01');
