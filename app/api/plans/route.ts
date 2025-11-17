import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with proper configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// GET /api/plans - Fetch all active plans for public use
export async function GET(_request: NextRequest) {
  try {
    const now = new Date().toISOString();
    
    const { data: plans, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      return NextResponse.json(
        { error: 'Failed to fetch plans' },
        { status: 500 }
      );
    }

    // Transform plans to match frontend expectations
    const transformedPlans = (plans || []).map(plan => ({
      id: plan.id,
      name: plan.name,
      plan_type: plan.plan_type,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      billing_cycle: plan.billing_cycle,
      max_projects: plan.max_projects,
      can_use_features: plan.can_use_features,
      features: plan.features,
      is_active: plan.is_active,
      razorpay_plan_id: plan.razorpay_plan_id,
      subscription_id: plan.subscription_id,
      color: plan.color,
      is_popular: plan.is_popular,
      limits: plan.limits,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
      sort_order: plan.sort_order
    }));

    return NextResponse.json({
      plans: transformedPlans,
      total: transformedPlans.length
    });

  } catch (error) {
    console.error('Unexpected error fetching plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/plans - Create a new plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { 
      name, 
      plan_type, 
      price, 
      currency, 
      billing_cycle, 
      features, 
      can_use_features, 
      max_projects, 
      color,
      is_popular,
      limits,
      sort_order,
      razorpay_plan_id,
      subscription_id
    } = body;
    
    if (!name || !plan_type) {
      return NextResponse.json(
        { error: 'Name and plan_type are required' },
        { status: 400 }
      );
    }

    // Validate plan_type
    if (!['Starter', 'Growth', 'Scale'].includes(plan_type)) {
      return NextResponse.json(
        { error: 'Invalid plan_type. Must be Starter, Growth, or Scale' },
        { status: 400 }
      );
    }

    // Validate billing_cycle
    if (billing_cycle && !['monthly', 'yearly'].includes(billing_cycle)) {
      return NextResponse.json(
        { error: 'Invalid billing_cycle. Must be monthly or yearly' },
        { status: 400 }
      );
    }

    const planData: Record<string, unknown> = {
      name,
      description: body.description || '',
      plan_type,
      price: price || 0,
      currency: currency || 'INR',
      billing_cycle: billing_cycle || 'monthly',
      features: features || [],
      can_use_features: can_use_features || [],
      max_projects: max_projects !== undefined ? max_projects : 1,
      is_active: body.is_active !== undefined ? body.is_active : true,
      sort_order: sort_order || 0,
      razorpay_plan_id: razorpay_plan_id && razorpay_plan_id.trim() !== '' ? razorpay_plan_id : null,
      subscription_id: subscription_id && subscription_id.trim() !== '' ? subscription_id : null,
      color: color || 'gray',
      is_popular: is_popular || false,
      limits: limits || {}
    };

    // Only include image_scan_credits if the column exists in the database
    // If the column doesn't exist, run: database/add_image_scan_credits_to_plans.sql
    if (body.image_scan_credits !== undefined) {
      planData.image_scan_credits = body.image_scan_credits;
    }

    let { data, error } = await supabase
      .from('plans')
      .insert([planData])
      .select()
      .single();

    // If error is due to missing image_scan_credits column, retry without it
    if (error && error.message?.includes('image_scan_credits') && error.message?.includes('column')) {
      console.warn('⚠️ image_scan_credits column not found. Retrying without it. Please run: database/add_image_scan_credits_to_plans.sql');
      const { image_scan_credits, ...planDataWithoutCredits } = planData;
      const retryResult = await supabase
        .from('plans')
        .insert([planDataWithoutCredits])
        .select()
        .single();
      
      if (retryResult.error) {
        console.error('Error creating plan:', retryResult.error);
        return NextResponse.json(
          { error: 'Failed to create plan', details: retryResult.error.message },
          { status: 500 }
        );
      }
      
      data = retryResult.data;
      error = null;
    } else if (error) {
      console.error('Error creating plan:', error);
      return NextResponse.json(
        { error: 'Failed to create plan', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      plan: data,
      message: 'Plan created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error creating plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
