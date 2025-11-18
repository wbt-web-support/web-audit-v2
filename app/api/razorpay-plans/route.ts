import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
interface RazorpayPlan {
  id: string;
  amount: number;
  currency: string;
  interval: string;
  interval_count: number;
  status: string;
  created_at: number;
  item?: {
    amount: number;
    currency: string;
    name: string;
    description?: string;
    notes?: {
      features?: string[];
      popular?: string;
      color?: string;
    };
  };
}
interface RazorpaySubscription {
  id: string;
  plan_id: string;
  status: string;
}

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
});
export async function GET(_request: NextRequest) {
  try {
    // Check if Razorpay keys are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({
        plans: [],
        total: 0,
        error: 'Razorpay keys not configured'
      });
    }
    // Fetch all plans from Razorpay
    let plans;
    try {
      plans = await razorpay.plans.all({
        count: 100 // Get up to 100 plans
      });
    } catch (planError) {
      console.error('Error fetching Razorpay plans:', planError);
      return NextResponse.json({
        plans: [],
        total: 0,
        error: 'Failed to fetch Razorpay plans',
        details: planError instanceof Error ? planError.message : 'Unknown error'
      });
    }

    // Fetch all subscriptions to get additional info
    let subscriptions;
    try {
      subscriptions = await razorpay.subscriptions.all({
        count: 100
      });
    } catch (subscriptionError) {
      console.error('Error fetching Razorpay subscriptions:', subscriptionError);
      // Continue without subscriptions data
      subscriptions = {
        items: []
      };
    }

    // Process and format the plans data
    const formattedPlans = plans.items.map((plan: any) => {
      // Get amount and currency from plan.item (the actual data structure)
      const amount = plan.item?.amount || plan.amount || 0;
      const currency = plan.item?.currency || plan.currency || 'INR';

      // Debug logging

      // Find corresponding subscription if exists
      const subscription = subscriptions.items.find((sub: RazorpaySubscription) => sub.plan_id === plan.id);
      return {
        id: plan.id,
        name: plan.item?.name || 'Plan',
        description: plan.item?.description || '',
        amount: amount,
        currency: currency,
        interval: plan.interval,
        interval_count: plan.interval_count,
        period: plan.interval === 'monthly' ? 'per month' : plan.interval === 'yearly' ? 'per year' : plan.interval === 'weekly' ? 'per week' : 'per ' + plan.interval,
        price: `$${(amount / 100).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`,
        features: plan.item?.notes?.features || ['Unlimited audits', 'Advanced analytics', 'Priority support'],
        popular: plan.item?.notes?.popular === 'true' || false,
        color: plan.item?.notes?.color || 'gray',
        status: plan.status,
        created_at: plan.created_at,
        subscription_count: subscription ? 1 : 0
      };
    });

    // Sort plans by amount (ascending)
    formattedPlans.sort((a, b) => a.amount - b.amount);

    // If no plans found, return empty array
    if (formattedPlans.length === 0) {
      return NextResponse.json({
        plans: [],
        total: 0
      });
    }
    return NextResponse.json({
      plans: formattedPlans,
      total: formattedPlans.length
    });
  } catch (error) {
    console.error('Error fetching Razorpay plans:', error);

    // Handle Razorpay-specific errors
    const err = error as any;
    const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
    const description = err?.error?.description || err?.message || err?.error || 'Unknown error';
    const raw = err?.response?.body || err?.response || undefined;
    console.error('Razorpay plans error details:', {
      statusCode,
      message: err?.message,
      description,
      razorpay_error: err?.error,
      raw
    });
    return NextResponse.json({
      error: 'Failed to fetch plans',
      details: description,
      razorpay_error: err?.error,
      raw
    }, {
      status: statusCode
    });
  }
}