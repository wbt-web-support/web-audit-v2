// Test script for API plans route
// Run this in your browser console to test the /api/plans endpoint

console.log('=== API Plans Route Test ===');

// Test 1: Test the API route directly
console.log('1. Testing /api/plans endpoint...');
fetch('/api/plans')
  .then(response => {
    console.log('API Response Status:', response.status);
    console.log('API Response OK:', response.ok);
    console.log('API Response Headers:', response.headers);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  })
  .then(data => {
    console.log('API Response Data:', data);
    console.log('Plans count:', data.plans?.length || 0);
    console.log('Total count:', data.total || 0);
    
    if (data.plans && data.plans.length > 0) {
      console.log('Sample plan:', data.plans[0]);
    }
  })
  .catch(error => {
    console.error('API Error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  });

// Test 2: Test with different HTTP methods
console.log('\n2. Testing POST /api/plans...');
const testPlan = {
  name: 'Test Plan',
  plan_type: 'Starter',
  description: 'Test plan for debugging',
  can_use_features: ['basic_audit'],
  max_projects: 1
};

fetch('/api/plans', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testPlan)
})
  .then(response => {
    console.log('POST Response Status:', response.status);
    console.log('POST Response OK:', response.ok);
    return response.json();
  })
  .then(data => {
    console.log('POST Response Data:', data);
  })
  .catch(error => {
    console.error('POST Error:', error);
  });

// Test 3: Check for common issues
console.log('\n3. Common issues to check:');
console.log('- Is the plans table accessible?');
console.log('- Are there RLS policies blocking access?');
console.log('- Is the sort_order column missing?');
console.log('- Are there any database connection issues?');
console.log('- Is the API route properly configured?');

console.log('\n=== API Test Complete ===');
console.log('Check the console output above for any errors or issues');
