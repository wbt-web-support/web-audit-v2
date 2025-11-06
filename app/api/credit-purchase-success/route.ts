import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      packageId,
      credits,
      amount,
      currency = 'INR'
    } = body;

    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Authentication required',
        code: 'MISSING_AUTH'
      }, {
        status: 401
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify user
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({
        error: 'Invalid authentication token',
        code: 'INVALID_AUTH',
        details: authError?.message || 'Token verification failed'
      }, {
        status: 401
      });
    }

    // Validate required fields
    if (!razorpay_payment_id || !credits || !amount) {
      return NextResponse.json({
        error: 'Missing required fields',
        code: 'MISSING_FIELDS',
        message: 'Payment ID, credits, and amount are required'
      }, {
        status: 400
      });
    }

    // Get current credits
    const { data: userData, error: userDataError } = await supabaseAdmin
      .from('users')
      .select('image_scan_credits')
      .eq('id', user.id)
      .single();

    if (userDataError) {
      console.error('❌ Error fetching user credits:', userDataError);
      return NextResponse.json({
        error: 'Failed to fetch user credits',
        code: 'USER_FETCH_FAILED',
        message: 'Unable to retrieve user information'
      }, {
        status: 500
      });
    }

    const currentCredits = userData?.image_scan_credits || 0;
    const newCredits = currentCredits + credits;

    // Update user credits
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        image_scan_credits: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('image_scan_credits')
      .single();

    if (updateError) {
      console.error('❌ Error updating user credits:', updateError);
      return NextResponse.json({
        error: 'Failed to add credits',
        code: 'CREDIT_UPDATE_FAILED',
        message: 'Payment was successful but credits could not be added. Please contact support.',
        details: updateError.message
      }, {
        status: 500
      });
    }

    // Find or create a "Credits" plan for credit purchases
    let creditsPlanId: string | null = null;
    try {
      // Try to find an existing "Credits" plan
      const { data: existingPlan } = await supabaseAdmin
        .from('plans')
        .select('id')
        .eq('name', 'Credits')
        .eq('plan_type', 'Credits')
        .single();

      if (existingPlan) {
        creditsPlanId = existingPlan.id;
      } else {
        // Try to find any plan to use as a fallback (for plan_id requirement)
        // This is a workaround since plan_id is required but we don't have a credits plan
        const { data: fallbackPlan } = await supabaseAdmin
          .from('plans')
          .select('id')
          .limit(1)
          .single();

        if (fallbackPlan) {
          creditsPlanId = fallbackPlan.id;
          console.warn('⚠️ Using fallback plan for credit purchase payment record');
        }
      }
    } catch (planError) {
      console.warn('⚠️ Could not find plan for credit purchase:', planError);
    }

    // Create payment record for credit purchase
    if (creditsPlanId) {
      try {
        const { error: paymentError } = await supabaseAdmin.from('payments').insert({
          user_id: user.id,
          plan_id: creditsPlanId,
          razorpay_payment_id,
          razorpay_order_id: razorpay_order_id || null,
          amount,
          currency,
          plan_name: `${credits} Image Scan Credits`,
          plan_type: 'Credits',
          billing_cycle: 'one-time',
          max_projects: null,
          can_use_features: [],
          payment_status: 'completed',
          payment_method: 'razorpay',
          payment_date: new Date().toISOString(),
          notes: `Credit purchase: ${credits} credits added to account`
        });

        if (paymentError) {
          console.error('❌ Failed to create payment record for credit purchase:', paymentError);
        } else {
          console.log('✅ Payment record created for credit purchase');
        }
      } catch (paymentError) {
        console.error('❌ Error creating payment record for credit purchase:', paymentError);
        // Don't fail the entire operation if payment record creation fails
      }
    } else {
      console.warn('⚠️ Could not create payment record: No plan_id available');
    }

    console.log('✅ Credits added successfully:', {
      userId: user.id,
      creditsAdded: credits,
      previousCredits: currentCredits,
      newCredits: newCredits
    });

    return NextResponse.json({
      success: true,
      message: 'Credits added successfully',
      creditsAdded: credits,
      previousCredits: currentCredits,
      newCredits: newCredits,
      paymentId: razorpay_payment_id
    });

  } catch (error) {
    console.error('❌ Error in credit-purchase-success API route:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      code: 'INTERNAL_ERROR'
    }, {
      status: 500
    });
  }
}

