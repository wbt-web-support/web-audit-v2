import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/plans - Fetch all active plans for public use
export async function GET(request: NextRequest) {
  try {
    const { data: plans, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      return NextResponse.json(
        { error: 'Failed to fetch plans' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      plans: plans || [],
      total: plans?.length || 0
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
    const { name, description, plan_type, amount, currency, interval_type, features, can_use_features, max_projects, limits } = body;
    
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

    const planData = {
      name,
      description: description || '',
      plan_type,
      amount: amount || 0,
      currency: currency || 'INR',
      interval_type: interval_type || 'monthly',
      interval_count: body.interval_count || 1,
      features: features || [],
      can_use_features: can_use_features || [],
      max_projects: max_projects !== undefined ? max_projects : 1,
      limits: limits || {},
      is_active: body.is_active !== undefined ? body.is_active : true,
      is_popular: body.is_popular || false,
      color: body.color || 'gray',
      sort_order: body.sort_order || 0,
      razorpay_plan_id: body.razorpay_plan_id && body.razorpay_plan_id.trim() !== '' ? body.razorpay_plan_id : null
    };

    const { data, error } = await supabase
      .from('plans')
      .insert([planData])
      .select()
      .single();

    if (error) {
      console.error('Error creating plan:', error);
      return NextResponse.json(
        { error: 'Failed to create plan' },
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
