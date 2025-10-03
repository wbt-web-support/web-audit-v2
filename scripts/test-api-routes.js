// Test script to verify API routes are working
// Run this in browser console or as a Node.js script

const testApiRoutes = async () => {
  const baseUrl = window.location.origin; // or 'http://localhost:3000' for local testing
  
  console.log('Testing API routes...');
  
  try {
    // Test GET /api/plans
    console.log('1. Testing GET /api/plans...');
    const getResponse = await fetch(`${baseUrl}/api/plans`);
    console.log('GET response status:', getResponse.status);
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('GET response data:', getData);
    } else {
      const getError = await getResponse.text();
      console.error('GET error:', getError);
    }
    
    // Test POST /api/plans (create a test plan)
    console.log('2. Testing POST /api/plans...');
    const testPlan = {
      name: 'Test Plan',
      description: 'Test plan for API testing',
      plan_type: 'free',
      amount: 0,
      currency: 'INR',
      interval_type: 'monthly',
      features: [],
      limits: {},
      is_active: true,
      is_popular: false,
      color: 'gray',
      sort_order: 999
    };
    
    const postResponse = await fetch(`${baseUrl}/api/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPlan)
    });
    
    console.log('POST response status:', postResponse.status);
    
    if (postResponse.ok) {
      const postData = await postResponse.json();
      console.log('POST response data:', postData);
      
      // Test PUT /api/plans/[id] (update the test plan)
      if (postData.plan && postData.plan.id) {
        console.log('3. Testing PUT /api/plans/[id]...');
        const updateData = {
          ...testPlan,
          name: 'Updated Test Plan',
          description: 'Updated test plan description'
        };
        
        const putResponse = await fetch(`${baseUrl}/api/plans/${postData.plan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        
        console.log('PUT response status:', putResponse.status);
        
        if (putResponse.ok) {
          const putData = await putResponse.json();
          console.log('PUT response data:', putData);
        } else {
          const putError = await putResponse.text();
          console.error('PUT error:', putError);
        }
        
        // Test DELETE /api/plans/[id] (delete the test plan)
        console.log('4. Testing DELETE /api/plans/[id]...');
        const deleteResponse = await fetch(`${baseUrl}/api/plans/${postData.plan.id}`, {
          method: 'DELETE'
        });
        
        console.log('DELETE response status:', deleteResponse.status);
        
        if (deleteResponse.ok) {
          const deleteData = await deleteResponse.json();
          console.log('DELETE response data:', deleteData);
        } else {
          const deleteError = await deleteResponse.text();
          console.error('DELETE error:', deleteError);
        }
      }
    } else {
      const postError = await postResponse.text();
      console.error('POST error:', postError);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test
testApiRoutes();
