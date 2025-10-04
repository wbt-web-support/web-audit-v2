// Debug script for feature update issues
// Run this in your browser console to debug feature update problems

console.log('=== Feature Update Debug Test ===');

// Test 1: Check if Supabase client is available
console.log('1. Testing Supabase client...');
if (window.supabase) {
  console.log('Supabase client available');
} else {
  console.error('Supabase client not available');
}

// Test 2: Test direct update to plans table
console.log('\n2. Testing direct update to plans table...');
if (window.supabase) {
  // First, get a plan to test with
  window.supabase
    .from('plans')
    .select('id, name, can_use_features')
    .limit(1)
    .then(({ data: plans, error: plansError }) => {
      if (plansError) {
        console.error('Error fetching plans:', plansError);
      } else if (plans && plans.length > 0) {
        const testPlan = plans[0];
        console.log('Testing with plan:', testPlan);
        
        // Test updating can_use_features
        const testFeatures = ['basic_audit', 'test_feature'];
        window.supabase
          .from('plans')
          .update({ 
            can_use_features: testFeatures,
            updated_at: new Date().toISOString()
          })
          .eq('id', testPlan.id)
          .select()
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error('Update error:', error);
              console.error('Error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
              });
            } else {
              console.log('Update successful:', data);
              
              // Revert the test update
              window.supabase
                .from('plans')
                .update({ 
                  can_use_features: testPlan.can_use_features,
                  updated_at: new Date().toISOString()
                })
                .eq('id', testPlan.id)
                .then(() => {
                  console.log('Test update reverted');
                });
            }
          });
      } else {
        console.log('No plans found to test with');
      }
    });
}

// Test 3: Check for common issues
console.log('\n3. Common issues to check:');
console.log('- Is the can_use_features column a text[] array?');
console.log('- Are there RLS policies blocking updates?');
console.log('- Is the user authenticated and has admin role?');
console.log('- Are there any foreign key constraints?');
console.log('- Is the plan ID valid?');

// Test 4: Check authentication
console.log('\n4. Checking authentication...');
if (window.supabase) {
  window.supabase.auth.getUser().then(({ data: { user }, error }) => {
    if (error) {
      console.error('Auth error:', error);
    } else if (user) {
      console.log('User authenticated:', user.id);
    } else {
      console.log('No user authenticated');
    }
  });
}

// Test 5: Check for console errors
console.log('\n5. Check for console errors:');
console.log('Look for any error messages in the console above');
console.log('Common error types:');
console.log('- RLS policy violations');
console.log('- Permission denied');
console.log('- Column type mismatches');
console.log('- Constraint violations');

console.log('\n=== Debug Test Complete ===');
console.log('Check the console output above for any errors or issues');
