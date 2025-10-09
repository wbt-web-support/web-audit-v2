import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabase } from '@/lib/supabase';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    // Validate Razorpay keys configuration
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        {
          error: 'Razorpay keys not configured',
          details: 'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.'
        },
        { status: 500 }
      );
    }

    const { plan_id, customer_id, customer_details } = await request.json();

    if (!plan_id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Fetch plan details from database to get razorpay_plan_id
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('razorpay_plan_id, name, price, currency, billing_cycle')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      console.error('Error fetching plan:', planError);
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    if (!plan.razorpay_plan_id || plan.razorpay_plan_id.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Razorpay plan ID not configured for this plan',
          details: 'Please configure a valid Razorpay plan ID in the admin panel before users can subscribe to this plan.'
        },
        { status: 400 }
      );
    }

    // Use provided customer_id if available; otherwise, allow Razorpay Checkout to handle customer creation
    const customerId = customer_id || undefined;

    // Create subscription using the razorpay_plan_id from database
    const subscriptionPayload: any = {
      plan_id: plan.razorpay_plan_id,
      customer_notify: 1,
      total_count: plan.billing_cycle === 'yearly' ? 1 : 12,
      start_at: Math.floor(Date.now() / 1000) + 60,
      expire_by: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
      notes: {
        source: 'web_audit_pricing',
        plan_type: 'subscription',
        plan_name: plan.name,
        plan_price: plan.price,
        plan_currency: plan.currency
      }
    };
    if (customerId) {
      subscriptionPayload.customer_id = customerId;
    }
    const subscription = await razorpay.subscriptions.create(subscriptionPayload);

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
    const err = error as any;
    const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
    const description = err?.error?.description || err?.message || err?.error || 'Unknown error';
    const raw = err?.response?.body || err?.response || undefined;
    console.error('Error creating Razorpay subscription:', {
      statusCode,
      message: err?.message,
      description,
      razorpay_error: err?.error,
      raw
    });
    return NextResponse.json(
      {
        error: 'Failed to create subscription',
        details: description,
        raw
      },
      { status: statusCode }
    );
  }
}
