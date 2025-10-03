import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXXXXXX',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_key_secret_here',
});

export async function POST(request: NextRequest) {
  try {
    const { plan_id, customer_id, customer_details } = await request.json();

    if (!plan_id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Create customer if not provided
    let customerId = customer_id;
    if (!customerId) {
      const customer = await razorpay.customers.create({
        name: customer_details?.name || 'Test User',
        email: customer_details?.email || 'test@example.com',
        contact: customer_details?.contact || '9999999999',
        notes: {
          source: 'web_audit_pricing'
        }
      });
      customerId = customer.id;
    }

    // Create subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan_id,
      customer_notify: 1,
      total_count: 12, // 12 months subscription
      start_at: Math.floor(Date.now() / 1000) + 60, // Start in 1 minute
      expire_by: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // Expire in 24 hours
      notes: {
        source: 'web_audit_pricing',
        plan_type: 'subscription'
      }
    });

    return NextResponse.json({
      id: subscription.id,
      plan_id: subscription.plan_id,
      status: subscription.status,
      short_url: subscription.short_url,
      total_count: subscription.total_count,
      paid_count: subscription.paid_count,
      current_start: subscription.current_start,
      current_end: subscription.current_end,
      ended_at: subscription.ended_at,
      quantity: subscription.quantity,
      notes: subscription.notes,
      created_at: subscription.created_at
    });

  } catch (error) {
    console.error('Error creating Razorpay subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
