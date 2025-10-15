import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;
const supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey);
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    // Try to get user with Bearer token first
    let user = null;
    let userError = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const {
        data: {
          user: tokenUser
        },
        error: tokenError
      } = await supabase.auth.getUser(token);
      if (tokenUser && !tokenError) {
        user = tokenUser;
      } else {
        console.error('Bearer token authentication failed:', tokenError);
      }
    }

    // If Bearer token auth failed, try direct getUser
    if (!user) {
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const {
        data: {
          user: directUser
        },
        error: directError
      } = await supabase.auth.getUser();
      user = directUser;
      userError = directError;
    }
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return NextResponse.json({
        error: 'User not authenticated',
        details: 'Please log in to check plan expiry',
        code: 'AUTH_REQUIRED'
      }, {
        status: 401
      });
    }
    // Get user's current plan data
    const {
      data: userData,
      error: userDataError
    } = await supabaseServiceClient.from('users').select('id, plan_type, plan_id, plan_expires_at, billing_cycle').eq('id', user.id).single();
    if (userDataError || !userData) {
      console.error('Error fetching user data:', userDataError);
      return NextResponse.json({
        error: 'Failed to fetch user data',
        details: userDataError?.message || 'User not found'
      }, {
        status: 500
      });
    }
    // Check if user is on Starter plan (no expiry)
    if (userData.plan_type === 'Starter') {
      return NextResponse.json({
        success: true,
        message: 'User is on Starter plan (no expiry)',
        plan_type: userData.plan_type,
        is_expired: false
      });
    }

    // Check if plan has expired
    const now = new Date();
    const expiryDate = userData.plan_expires_at ? new Date(userData.plan_expires_at) : null;
    const isExpired = expiryDate ? expiryDate < now : false;
    if (!isExpired) {
      return NextResponse.json({
        success: true,
        message: 'Plan is still active',
        plan_type: userData.plan_type,
        is_expired: false,
        expires_at: userData.plan_expires_at
      });
    }

    // Plan has expired - downgrade to Starter

    // Get Starter plan details
    const {
      data: starterPlan,
      error: starterPlanError
    } = await supabaseServiceClient.from('plans').select('id, name, plan_type, can_use_features, max_projects').eq('plan_type', 'Starter').eq('is_active', true).single();
    if (starterPlanError || !starterPlan) {
      console.error('Error fetching Starter plan:', starterPlanError);
      return NextResponse.json({
        error: 'Failed to fetch Starter plan',
        details: starterPlanError?.message || 'Starter plan not found'
      }, {
        status: 500
      });
    }

    // Update user to Starter plan
    const {
      data: updateResult,
      error: updateError
    } = await supabaseServiceClient.from('users').update({
      plan_type: 'Starter',
      plan_id: starterPlan.id,
      max_projects: starterPlan.max_projects || 1,
      can_use_features: starterPlan.can_use_features || ['basic_audit'],
      plan_expires_at: null,
      // Starter plan doesn't expire
      billing_cycle: null,
      updated_at: new Date().toISOString()
    }).eq('id', user.id).select('id, plan_type, plan_id, max_projects, can_use_features');
    if (updateError) {
      console.error('Error updating user plan:', updateError);
      return NextResponse.json({
        error: 'Failed to update user plan',
        details: updateError.message
      }, {
        status: 500
      });
    }
    // Create a record of the plan change in payments table (optional)
    try {
      await supabaseServiceClient.from('payments').insert({
        user_id: user.id,
        plan_id: starterPlan.id,
        razorpay_payment_id: `expiry_downgrade_${Date.now()}`,
        amount: 0,
        currency: 'INR',
        plan_name: starterPlan.name,
        plan_type: 'Starter',
        billing_cycle: 'none',
        max_projects: starterPlan.max_projects || 1,
        can_use_features: starterPlan.can_use_features || ['basic_audit'],
        payment_status: 'completed',
        payment_method: 'system_downgrade',
        payment_date: new Date().toISOString(),
        expires_at: null, // Starter plan doesn't expire
        notes: `Automatic downgrade due to plan expiry on ${expiryDate?.toISOString()}`
      });
    } catch (paymentError) {
      console.warn('Failed to create payment record for downgrade:', paymentError);
      // Don't fail the entire operation if payment record creation fails
    }
    return NextResponse.json({
      success: true,
      message: 'Plan has expired and user has been downgraded to Starter plan',
      previous_plan: userData.plan_type,
      new_plan: 'Starter',
      is_expired: true,
      downgraded: true,
      updated_user: updateResult
    });
  } catch (error) {
    console.error('Plan expiry check error:', error);
    return NextResponse.json({
      error: 'Failed to check plan expiry',
      details: (error as Error).message
    }, {
      status: 500
    });
  }
}

// GET endpoint for checking plan expiry without making changes
export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    // Try to get user with Bearer token first
    let user = null;
    let userError = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const {
        data: {
          user: tokenUser
        },
        error: tokenError
      } = await supabase.auth.getUser(token);
      if (tokenUser && !tokenError) {
        user = tokenUser;
      } else {
        console.error('Bearer token authentication failed:', tokenError);
      }
    }

    // If Bearer token auth failed, try direct getUser
    if (!user) {
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const {
        data: {
          user: directUser
        },
        error: directError
      } = await supabase.auth.getUser();
      user = directUser;
      userError = directError;
    }
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return NextResponse.json({
        error: 'User not authenticated',
        details: 'Please log in to check plan expiry',
        code: 'AUTH_REQUIRED'
      }, {
        status: 401
      });
    }
    // Get user's current plan data
    const {
      data: userData,
      error: userDataError
    } = await supabaseServiceClient.from('users').select('id, plan_type, plan_id, plan_expires_at, billing_cycle').eq('id', user.id).single();
    if (userDataError || !userData) {
      console.error('Error fetching user data:', userDataError);
      return NextResponse.json({
        error: 'Failed to fetch user data',
        details: userDataError?.message || 'User not found'
      }, {
        status: 500
      });
    }
    // Check if user is on Starter plan (no expiry)
    if (userData.plan_type === 'Starter') {
      return NextResponse.json({
        success: true,
        message: 'User is on Starter plan (no expiry)',
        plan_type: userData.plan_type,
        is_expired: false,
        expires_at: null
      });
    }

    // Check if plan has expired
    const now = new Date();
    const expiryDate = userData.plan_expires_at ? new Date(userData.plan_expires_at) : null;
    const isExpired = expiryDate ? expiryDate < now : false;
    const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
    return NextResponse.json({
      success: true,
      plan_type: userData.plan_type,
      is_expired: isExpired,
      expires_at: userData.plan_expires_at,
      days_until_expiry: daysUntilExpiry,
      billing_cycle: userData.billing_cycle
    });
  } catch (error) {
    console.error('Plan expiry status check error:', error);
    return NextResponse.json({
      error: 'Failed to check plan expiry status',
      details: (error as Error).message
    }, {
      status: 500
    });
  }
}