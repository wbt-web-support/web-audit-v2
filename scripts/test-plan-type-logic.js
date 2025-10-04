// Test script to verify plan type logic
// Run this in your browser console to test the plan type mapping

console.log('=== Plan Type Logic Test ===');

// Test the plan type to name mapping
const testPlanTypes = ['Starter', 'Growth', 'Scale', 'Unknown'];

testPlanTypes.forEach(planType => {
  let planName;
  switch (planType) {
    case 'Starter':
      planName = 'Free Plan';
      break;
    case 'Growth':
      planName = 'Pro Plan';
      break;
    case 'Scale':
      planName = 'Enterprise Plan';
      break;
    default:
      planName = 'Unknown Plan';
  }
  
  console.log(`Plan Type: ${planType} → Plan Name: ${planName}`);
});

// Test the logic used in the sidebar
console.log('\n=== Sidebar Logic Test ===');
const testPlanInfo = {
  plan_type: 'Starter',
  plan_name: 'Some Random Name', // This should be ignored
  can_use_features: ['basic_audit'],
  max_projects: 1
};

const displayName = testPlanInfo.plan_type === 'Starter' ? 'Free Plan' : 
                   testPlanInfo.plan_type === 'Growth' ? 'Pro Plan' : 
                   testPlanInfo.plan_type === 'Scale' ? 'Enterprise Plan' : 
                   testPlanInfo.plan_name || 'Unknown Plan';

console.log(`Original plan_name: ${testPlanInfo.plan_name}`);
console.log(`Display name (based on plan_type): ${displayName}`);
console.log(`Plan type used for logic: ${testPlanInfo.plan_type}`);

console.log('\n=== Test Complete ===');
console.log('The plan type should be used for all logic, plan name is just for display');
