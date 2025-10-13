-- Check users table schema
-- Run this to see what columns currently exist in your users table

-- Show all columns in users table
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check if specific columns exist
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'plan_type'
    ) THEN 'plan_type: EXISTS'
    ELSE 'plan_type: MISSING'
  END as plan_type_status,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'plan_id'
    ) THEN 'plan_id: EXISTS'
    ELSE 'plan_id: MISSING'
  END as plan_id_status,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'max_projects'
    ) THEN 'max_projects: EXISTS'
    ELSE 'max_projects: MISSING'
  END as max_projects_status,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'can_use_features'
    ) THEN 'can_use_features: EXISTS'
    ELSE 'can_use_features: MISSING'
  END as can_use_features_status,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'plan_expires_at'
    ) THEN 'plan_expires_at: EXISTS'
    ELSE 'plan_expires_at: MISSING'
  END as plan_expires_at_status,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'subscription_id'
    ) THEN 'subscription_id: EXISTS'
    ELSE 'subscription_id: MISSING'
  END as subscription_id_status,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN 'updated_at: EXISTS'
    ELSE 'updated_at: MISSING'
  END as updated_at_status;
