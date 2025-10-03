/**
 * Test script for Razorpay webhook
 * This script helps you test your webhook endpoint locally
 */

const crypto = require('crypto');

// Mock webhook payload (you can get this from Razorpay dashboard)
const mockWebhookPayload = {
  event: 'payment.captured',
  account_id: 'acc_XXXXXXXXXXXXXX',
  created_at: Math.floor(Date.now() / 1000),
  contains: ['payment'],
  payload: {
    payment: {
      entity: {
        id: 'pay_test_XXXXXXXXXXXXXX',
        amount: 50000, // ₹500.00
        currency: 'INR',
        status: 'captured',
        method: 'card',
        description: 'Test payment',
        vpa: null,
        email: 'test@example.com',
        contact: '+919999999999',
        notes: {},
        fee: 1470,
        tax: 224,
        error_code: null,
        error_description: null,
        created_at: Math.floor(Date.now() / 1000)
      }
    },
    order: {
      entity: {
        id: 'order_test_XXXXXXXXXXXXXX',
        amount: 50000,
        currency: 'INR',
        receipt: 'receipt_test_123',
        status: 'paid',
        attempts: 1,
        notes: {},
        created_at: Math.floor(Date.now() / 1000)
      }
    }
  }
};

// Function to generate webhook signature (for testing purposes)
function generateWebhookSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

// Test function
async function testWebhook() {
  const webhookUrl = 'https://2d09b3c4ba90.ngrok-free.app/api/razorpay-webhook';
  const webhookSecret =  'Test123@';
  
  const payload = JSON.stringify(mockWebhookPayload);
  const signature = generateWebhookSignature(mockWebhookPayload, webhookSecret);
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature
      },
      body: payload
    });
    
    const result = await response.text();
    
    console.log('Webhook Test Results:');
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (response.ok) {
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed!');
    }
    
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
  }
}

// Instructions
console.log('Razorpay Webhook Test Script');
console.log('============================');
console.log('');
console.log('🌐 Your ngrok URL: https://2d09b3c4ba90.ngrok-free.app');
console.log('🔗 Webhook endpoint: https://2d09b3c4ba90.ngrok-free.app/api/razorpay-webhook');
console.log('');
console.log('📋 Razorpay Dashboard Configuration:');
console.log('1. Go to: https://dashboard.razorpay.com/ → Settings → Webhooks');
console.log('2. Add New Webhook with URL: https://2d09b3c4ba90.ngrok-free.app/api/razorpay-webhook');
console.log('3. Select events: payment.captured, payment.failed, order.paid');
console.log('4. Copy the webhook secret and add to .env.local');
console.log('');
console.log('🧪 To test:');
console.log('1. Set RAZORPAY_WEBHOOK_SECRET in .env.local');
console.log('2. Run: node scripts/test-razorpay-webhook.js');
console.log('');
console.log('Note: This is a mock test. For real testing, use Razorpay\'s webhook testing tools.');
console.log('');

// Run the test if this script is executed directly
if (require.main === module) {
  testWebhook();
}

module.exports = { testWebhook, generateWebhookSignature };
