// Test script to verify plan names are fetched from database
// Run this in your browser console to test the database plan name fetching

console.log('=== Database Plan Names Test ===');

// Test 1: Check if the plans table exists and has data
console.log('1. Testing database connection and plans table...');

// This would be run in your Supabase SQL editor:
const testQuery = `
SELECT 
    plan_type,
    name,
    is_active,
    created_at
FROM plans 
WHERE is_active = true
ORDER BY plan_type;
`;

console.log('Run this query in your Supabase SQL editor:');
console.log(testQuery);

// Test 2: Check the expected plan structure
console.log('\n2. Expected plan structure:');
console.log('Plan Type: Starter → Name: Free Plan (or whatever you set in DB)');
console.log('Plan Type: Growth → Name: Pro Plan (or whatever you set in DB)');
console.log('Plan Type: Scale → Name: Enterprise Plan (or whatever you set in DB)');

// Test 3: Check if the useUserPlan hook is working
console.log('\n3. Check useUserPlan hook:');
console.log('Look for these console messages:');
console.log('- "Plan info updated:" with plan_name from database');
console.log('- "Refreshing plan for user:" when plan is refreshed');

// Test 4: Test plan name fallback
console.log('\n4. Test plan name fallback:');
console.log('If a plan type exists but has no name, it should fallback to "PlanType Plan"');
console.log('Example: If Starter plan has no name, it shows "Starter Plan"');

// Test 5: Manual plan refresh test
console.log('\n5. Manual plan refresh test:');
console.log('Triggering plan refresh...');
window.dispatchEvent(new CustomEvent('planUpdated'));
localStorage.setItem('plan_updated', Date.now().toString());
console.log('Plan refresh event dispatched - check console for updates');

console.log('\n=== Test Complete ===');
console.log('The plan names should now come from the database, not hardcoded values');
