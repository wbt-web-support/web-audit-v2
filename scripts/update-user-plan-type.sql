-- Script to update a user's plan type
-- Replace 'user_email@example.com' with the actual user email
-- Replace 'Growth' with the desired plan type (Starter, Growth, Scale)

-- Example: Update user plan type
-- UPDATE users 
-- SET plan_type = 'Growth' 
-- WHERE email = 'user_email@example.com';

-- Show current user plan types
SELECT '--- Current user plan types ---' as status;
SELECT 
    id,
    email,
    plan_type,
    created_at
FROM users 
ORDER BY created_at DESC;

-- Show available plan types
SELECT '--- Available plan types ---' as status;
SELECT DISTINCT plan_type, name, price
FROM plans 
WHERE is_active = true
ORDER BY plan_type;

-- Example queries to update plan types:
SELECT '--- Example update queries ---' as status;
SELECT 'UPDATE users SET plan_type = ''Starter'' WHERE email = ''user@example.com'';' as example_query;
SELECT 'UPDATE users SET plan_type = ''Growth'' WHERE email = ''user@example.com'';' as example_query;
SELECT 'UPDATE users SET plan_type = ''Scale'' WHERE email = ''user@example.com'';' as example_query;

SELECT '--- Instructions ---' as status;
SELECT '1. Uncomment and modify the UPDATE query above' as instruction;
SELECT '2. Replace the email with the actual user email' as instruction;
SELECT '3. Replace the plan_type with the desired plan type' as instruction;
SELECT '4. Run the query to update the user plan type' as instruction;
