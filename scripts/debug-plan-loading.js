// Debug script for plan loading issues
// Run this in your browser console to debug plan loading problems

console.log('=== Plan Loading Debug Test ===');

// Test 1: Check if plans table exists and has data
console.log('1. Testing plans table access...');
const testPlansQuery = `
SELECT 
    id,
    name,
    plan_type,
    is_active,
    created_at
FROM plans 
WHERE is_active = true
ORDER BY created_at DESC;
`;

console.log('Run this query in your Supabase SQL editor:');
console.log(testPlansQuery);

// Test 2: Check API route
console.log('\n2. Testing API route...');
fetch('/api/plans')
  .then(response => {
    console.log('API Response Status:', response.status);
    console.log('API Response OK:', response.ok);
    return response.json();
  })
  .then(data => {
    console.log('API Response Data:', data);
    console.log('Plans count:', data.plans?.length || 0);
  })
  .catch(error => {
    console.error('API Error:', error);
  });

// Test 3: Check Supabase client
console.log('\n3. Testing Supabase client...');
if (window.supabase) {
  console.log('Supabase client available');
  // Test direct access
  window.supabase
    .from('plans')
    .select('id, name, plan_type, is_active')
    .eq('is_active', true)
    .then(({ data, error }) => {
      if (error) {
        console.error('Supabase direct access error:', error);
      } else {
        console.log('Supabase direct access success:', data);
        console.log('Plans count:', data?.length || 0);
      }
    });
} else {
  console.error('Supabase client not available');
}

// Test 4: Check for RLS policies
console.log('\n4. Check RLS policies...');
const checkRLSQuery = `
SELECT 
    polname,
    polcmd,
    polroles::regrole[],
    polqual
FROM pg_policy 
WHERE polrelid = 'public.plans'::regclass;
`;

console.log('Run this query to check RLS policies:');
console.log(checkRLSQuery);

// Test 5: Check table permissions
console.log('\n5. Check table permissions...');
const checkPermissionsQuery = `
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'plans' 
AND table_schema = 'public';
`;

console.log('Run this query to check table permissions:');
console.log(checkPermissionsQuery);

// Test 6: Check for common issues
console.log('\n6. Common issues to check:');
console.log('- Is the plans table empty?');
console.log('- Are there any RLS policies blocking access?');
console.log('- Is the user authenticated?');
console.log('- Are there any network/CORS issues?');
console.log('- Is the API route working correctly?');

console.log('\n=== Debug Test Complete ===');
console.log('Check the console output above for any errors or issues');
