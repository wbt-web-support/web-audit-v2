// Test script to check plans data structure
// Run this in your browser console to verify the plans data

console.log('=== Plans Data Structure Test ===');

// Test 1: Check if plans are loading
console.log('1. Testing plans loading...');
if (window.supabase) {
  window.supabase
    .from('plans')
    .select('*')
    .limit(1)
    .then(({ data: plans, error }) => {
      if (error) {
        console.error('Error fetching plans:', error);
      } else if (plans && plans.length > 0) {
        const plan = plans[0];
        console.log('Sample plan data:', plan);
        console.log('Plan keys:', Object.keys(plan));
        
        // Check specific properties
        console.log('\nProperty checks:');
        console.log('- features:', plan.features, typeof plan.features);
        console.log('- can_use_features:', plan.can_use_features, typeof plan.can_use_features);
        console.log('- max_projects:', plan.max_projects, typeof plan.max_projects);
        console.log('- plan_type:', plan.plan_type, typeof plan.plan_type);
        console.log('- name:', plan.name, typeof plan.name);
        
        // Check array properties
        console.log('\nArray property checks:');
        console.log('- features is array:', Array.isArray(plan.features));
        console.log('- can_use_features is array:', Array.isArray(plan.can_use_features));
        console.log('- features length:', plan.features?.length || 'undefined');
        console.log('- can_use_features length:', plan.can_use_features?.length || 'undefined');
        
        // Test safe access
        console.log('\nSafe access tests:');
        console.log('- features?.length || 0:', plan.features?.length || 0);
        console.log('- can_use_features?.length || 0:', plan.can_use_features?.length || 0);
      } else {
        console.log('No plans found');
      }
    });
} else {
  console.error('Supabase client not available');
}

// Test 2: Check API response
console.log('\n2. Testing API response...');
fetch('/api/plans')
  .then(response => response.json())
  .then(data => {
    console.log('API response:', data);
    if (data.plans && data.plans.length > 0) {
      const plan = data.plans[0];
      console.log('API plan sample:', plan);
      console.log('API plan features:', plan.features);
      console.log('API plan can_use_features:', plan.can_use_features);
    }
  })
  .catch(error => {
    console.error('API error:', error);
  });

// Test 3: Common issues to check
console.log('\n3. Common issues to check:');
console.log('- Is the features column missing from the database?');
console.log('- Are the array columns properly initialized?');
console.log('- Is the data being fetched correctly?');
console.log('- Are there any null/undefined values?');

console.log('\n=== Data Structure Test Complete ===');
console.log('Check the console output above for any data structure issues');
