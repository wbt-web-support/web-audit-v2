// Test script to debug sidebar role and plan detection
// Run this in your browser console while on the dashboard

console.log('=== Sidebar Debug Test ===');

// Test 1: Check if user is authenticated
console.log('1. User Authentication:');
console.log('   - User object:', window.supabase?.auth?.getUser ? 'Available' : 'Not available');
console.log('   - Current user:', window.supabase?.auth?.getUser ? 'Check console for user data' : 'Not available');

// Test 2: Check localStorage for plan data
console.log('2. Local Storage Plan Data:');
const planData = localStorage.getItem('plan_updated');
console.log('   - Plan updated flag:', planData);
console.log('   - All localStorage keys:', Object.keys(localStorage));

// Test 3: Check for custom events
console.log('3. Custom Events:');
console.log('   - planUpdated event listener:', window.addEventListener ? 'Available' : 'Not available');

// Test 4: Check if useUserPlan hook is working
console.log('4. useUserPlan Hook:');
console.log('   - Check if plan info is being logged in console');
console.log('   - Look for "Plan info updated:" messages');

// Test 5: Check role verification
console.log('5. Role Verification:');
console.log('   - Check if role verification is being logged in console');
console.log('   - Look for "Role verification result:" messages');

// Test 6: Manual plan refresh
console.log('6. Manual Plan Refresh:');
console.log('   - Triggering plan refresh event...');
window.dispatchEvent(new CustomEvent('planUpdated'));
localStorage.setItem('plan_updated', Date.now().toString());
console.log('   - Plan refresh event dispatched');

// Test 7: Check for errors
console.log('7. Error Check:');
console.log('   - Check console for any error messages');
console.log('   - Look for "Sidebar role verification error:" or "Error fetching user plan:" messages');

console.log('=== Debug Test Complete ===');
console.log('Check the console for detailed logs from the sidebar component');
