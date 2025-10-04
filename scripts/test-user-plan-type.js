// Test script to verify user plan type logic
// Run this in your browser console to test the new user table plan type fetching

console.log('=== User Plan Type Test ===');

// Test 1: Check if the users table has plan_type column
console.log('1. Testing users table structure...');
const testUserTableQuery = `
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users' 
AND column_name = 'plan_type';
`;

console.log('Run this query in your Supabase SQL editor to check if plan_type column exists:');
console.log(testUserTableQuery);

// Test 2: Check current user plan types
console.log('\n2. Check current user plan types...');
const checkUserPlansQuery = `
SELECT 
    id,
    email,
    plan_type,
    created_at
FROM users 
ORDER BY created_at DESC
LIMIT 5;
`;

console.log('Run this query to see current user plan types:');
console.log(checkUserPlansQuery);

// Test 3: Check if useUserPlan hook is working with user table
console.log('\n3. Check useUserPlan hook:');
console.log('Look for these console messages:');
console.log('- "Plan info updated:" with plan_name from database');
console.log('- "No plan_type found in user table, using fallback plan" (if no plan_type set)');
console.log('- "No plan found for type X, using fallback plan" (if plan not found)');

// Test 4: Test plan type update
console.log('\n4. Test plan type update:');
console.log('To update a user plan type, run:');
console.log('UPDATE users SET plan_type = ''Growth'' WHERE email = ''your-email@example.com'';');

// Test 5: Manual plan refresh test
console.log('\n5. Manual plan refresh test:');
console.log('Triggering plan refresh...');
window.dispatchEvent(new CustomEvent('planUpdated'));
localStorage.setItem('plan_updated', Date.now().toString());
console.log('Plan refresh event dispatched - check console for updates');

// Test 6: Expected behavior
console.log('\n6. Expected behavior:');
console.log('- Plan type should come from users.plan_type column');
console.log('- Plan details (name, features, limits) should come from plans table');
console.log('- If user has no plan_type, defaults to Starter plan');
console.log('- If plan_type exists but no matching plan in plans table, uses fallback');

console.log('\n=== Test Complete ===');
console.log('The plan type should now come from the users table, not subscriptions');
