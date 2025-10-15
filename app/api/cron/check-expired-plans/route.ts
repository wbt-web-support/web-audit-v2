import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey);
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (you can add additional security here)
    const cronSecret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json({
        error: 'Unauthorized'
      }, {
        status: 401
      });
    }

    // Get all users with paid plans that have expiry dates
    const {
      data: usersWithExpiredPlans,
      error: fetchError
    } = await supabaseServiceClient.from('users').select('id, email, plan_type, plan_id, plan_expires_at, billing_cycle').neq('plan_type', 'Starter').not('plan_expires_at', 'is', null).lt('plan_expires_at', new Date().toISOString());
    if (fetchError) {
      console.error('Error fetching users with expired plans:', fetchError);
      return NextResponse.json({
        error: 'Failed to fetch users with expired plans',
        details: fetchError.message
      }, {
        status: 500
      });
    }
    if (!usersWithExpiredPlans || usersWithExpiredPlans.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users with expired plans found',
        processed_count: 0
      });
    }

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
    const processedUsers = [];
    const errors = [];

    // Process each user with expired plan
    for (const user of usersWithExpiredPlans) {
      try {
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
          console.error(`Error updating user ${user.id}:`, updateError);
          errors.push({
            user_id: user.id,
            email: user.email,
            error: updateError.message
          });
          continue;
        }
        // Create a record of the plan change in payments table
        try {
          await supabaseServiceClient.from('payments').insert({
            user_id: user.id,
            plan_id: starterPlan.id,
            razorpay_payment_id: `cron_downgrade_${Date.now()}_${user.id}`,
            amount: 0,
            currency: 'INR',
            plan_name: starterPlan.name,
            plan_type: 'Starter',
            billing_cycle: 'none',
            max_projects: starterPlan.max_projects || 1,
            can_use_features: starterPlan.can_use_features || ['basic_audit'],
            payment_status: 'completed',
            payment_method: 'cron_downgrade',
            payment_date: new Date().toISOString(),
            expires_at: null, // Starter plan doesn't expire
            notes: `Automatic downgrade due to plan expiry on ${user.plan_expires_at} (processed by cron)`
          });
        } catch (paymentError) {
          console.warn(`Failed to create payment record for user ${user.id}:`, paymentError);
          // Don't fail the entire operation if payment record creation fails
        }
        processedUsers.push({
          user_id: user.id,
          email: user.email,
          previous_plan: user.plan_type,
          new_plan: 'Starter',
          updated_at: new Date().toISOString()
        });
      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
        errors.push({
          user_id: user.id,
          email: user.email,
          error: (userError as Error).message
        });
      }
    }
    return NextResponse.json({
      success: true,
      message: `Processed ${processedUsers.length} users with expired plans`,
      processed_count: processedUsers.length,
      error_count: errors.length,
      processed_users: processedUsers,
      errors: errors
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({
      error: 'Cron job failed',
      details: (error as Error).message
    }, {
      status: 500
    });
  }
}

// POST endpoint for manual trigger
export async function POST(request: NextRequest) {
  return GET(request);
}