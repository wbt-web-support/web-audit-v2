// Test script for price formatting
// Run this in your browser console to test price display

console.log('=== Price Formatting Test ===');

// Test the formatPrice function
const formatPrice = (amount, currency) => {
  if (!amount || amount === 0 || isNaN(amount)) return 'Free'
  const formattedAmount = Math.round(amount / 100)
  const currencyCode = currency || 'INR'
  return currencyCode === 'INR' ? `₹${formattedAmount.toLocaleString()}` : `$${formattedAmount.toLocaleString()}`
}

// Test various price scenarios
console.log('1. Testing price formatting:');
console.log('formatPrice(0, "INR"):', formatPrice(0, 'INR'));
console.log('formatPrice(null, "INR"):', formatPrice(null, 'INR'));
console.log('formatPrice(undefined, "INR"):', formatPrice(undefined, 'INR'));
console.log('formatPrice(NaN, "INR"):', formatPrice(NaN, 'INR'));
console.log('formatPrice(2999, "INR"):', formatPrice(2999, 'INR'));
console.log('formatPrice(9999, "INR"):', formatPrice(9999, 'INR'));
console.log('formatPrice(5000, "USD"):', formatPrice(5000, 'USD'));

// Test with plans data
console.log('\n2. Testing with actual plans data:');
if (window.supabase) {
  window.supabase
    .from('plans')
    .select('id, name, plan_type, amount, currency')
    .then(({ data: plans, error }) => {
      if (error) {
        console.error('Error fetching plans:', error);
      } else if (plans) {
        console.log('Plans data:', plans);
        plans.forEach(plan => {
          console.log(`Plan: ${plan.name}`);
          console.log(`  Amount: ${plan.amount} (${typeof plan.amount})`);
          console.log(`  Currency: ${plan.currency} (${typeof plan.currency})`);
          console.log(`  Formatted: ${formatPrice(plan.amount, plan.currency)}`);
          console.log('---');
        });
      }
    });
} else {
  console.error('Supabase client not available');
}

// Test edge cases
console.log('\n3. Testing edge cases:');
console.log('formatPrice("", "INR"):', formatPrice('', 'INR'));
console.log('formatPrice("0", "INR"):', formatPrice('0', 'INR'));
console.log('formatPrice(0, null):', formatPrice(0, null));
console.log('formatPrice(0, undefined):', formatPrice(0, undefined));

console.log('\n=== Price Formatting Test Complete ===');
