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

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXXXXXX',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_key_secret_here',
});

export async function GET(_request: NextRequest) {
  try {
    // Check if Razorpay keys are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.log('Razorpay keys not configured, returning empty plans');
      return NextResponse.json({
        plans: [],
        total: 0,
        error: 'Razorpay keys not configured'
      });
    }

    // Fetch all plans from Razorpay
    const plans = await razorpay.plans.all({
      count: 100 // Get up to 100 plans
    });

    // Fetch all subscriptions to get additional info
    const subscriptions = await razorpay.subscriptions.all({
      count: 100
    });

    // Process and format the plans data
    const formattedPlans = plans.items.map((plan: any) => {
      // Debug logging
      console.log('Processing plan:', {
        id: plan.id,
        plan_amount: plan.amount,
        plan_currency: plan.currency,
        item_amount: plan.item?.amount,
        item_currency: plan.item?.currency,
        item_name: plan.item?.name
      });
      
      // Find corresponding subscription if exists
      const subscription = subscriptions.items.find((sub: RazorpaySubscription) => 
        sub.plan_id === plan.id
      );

      // Get amount and currency from plan.item (the actual data structure)
      const amount = plan.item?.amount || plan.amount || 0;
      const currency = plan.item?.currency || plan.currency || 'INR';
      
      return {
        id: plan.id,
        name: plan.item?.name || 'Plan',
        description: plan.item?.description || '',
        amount: amount,
        currency: currency,
        interval: plan.interval,
        interval_count: plan.interval_count,
        period: plan.interval === 'monthly' ? 'per month' : 
                plan.interval === 'yearly' ? 'per year' : 
                plan.interval === 'weekly' ? 'per week' : 'per ' + plan.interval,
        price: currency === 'INR' ? 
               `₹${Math.round(amount / 100).toLocaleString()}` : 
               `$${Math.round(amount / 100).toLocaleString()}`,
        features: plan.item?.notes?.features || [
          'Unlimited audits',
          'Advanced analytics',
          'Priority support'
        ],
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
      console.log('No Razorpay plans found');
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
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
