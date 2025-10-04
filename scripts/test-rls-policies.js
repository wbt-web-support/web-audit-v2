// Test script to verify RLS policies are working
// Run this in your browser console to test RLS policy access

console.log('=== RLS Policy Test ===');

// Test 1: Check authentication
console.log('1. Checking authentication...');
if (window.supabase) {
  window.supabase.auth.getUser().then(({ data: { user }, error }) => {
    if (error) {
      console.error('Auth error:', error);
    } else if (user) {
      console.log('User authenticated:', user.id);
      
      // Test 2: Check user role
      console.log('\n2. Checking user role...');
      window.supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data: userData, error: userError }) => {
          if (userError) {
            console.error('User role error:', userError);
          } else {
            console.log('User role:', userData);
            
            // Test 3: Test plan access
            console.log('\n3. Testing plan access...');
            window.supabase
              .from('plans')
              .select('id, name, can_use_features')
              .limit(1)
              .then(({ data: plans, error: plansError }) => {
                if (plansError) {
                  console.error('Plan access error:', plansError);
                } else {
                  console.log('Plan access successful:', plans);
                  
                  if (plans && plans.length > 0) {
                    // Test 4: Test plan update
                    console.log('\n4. Testing plan update...');
                    const testPlan = plans[0];
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
                      .then(({ data: updateData, error: updateError }) => {
                        if (updateError) {
                          console.error('Update error:', updateError);
                          console.error('Update error details:', {
                            message: updateError.message,
                            details: updateError.details,
                            hint: updateError.hint,
                            code: updateError.code
                          });
                        } else {
                          console.log('Update successful:', updateData);
                          
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
                  }
                }
              });
          }
        });
    } else {
      console.log('No user authenticated');
    }
  });
} else {
  console.error('Supabase client not available');
}

// Test 5: Check for common RLS issues
console.log('\n5. Common RLS issues to check:');
console.log('- Is the user authenticated?');
console.log('- Does the user have admin role in users table?');
console.log('- Are the RLS policies correctly configured?');
console.log('- Is the plans table accessible?');
console.log('- Are there any constraint violations?');

console.log('\n=== RLS Policy Test Complete ===');
console.log('Check the console output above for any errors or issues');
