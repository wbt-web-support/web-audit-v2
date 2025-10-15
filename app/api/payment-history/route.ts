import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with proper configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;

// Create client with anon key for auth operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create service client for database operations that need to bypass RLS
const supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey);
export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    // Try to get user with Bearer token first
    let user = null;
    let userError = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
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
        details: 'Please log in to view payment history',
        code: 'AUTH_REQUIRED',
        debug: {
          hasAuthHeader: !!authHeader,
          authHeaderPresent: authHeader ? 'Yes' : 'No'
        }
      }, {
        status: 401
      });
    }

    // Get query parameters
    const {
      searchParams
    } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    // First, let's check if there are any payments in the database at all
    const {
      data: allPayments,
      error: allPaymentsError
    } = await supabaseServiceClient.from('payments').select('id, user_id, plan_name, payment_status').limit(5);
    // Fetch payment history with available fields using service client
    const {
      data: payments,
      error: paymentsError
    } = await supabaseServiceClient.from('payments').select(`
        id,
        razorpay_payment_id,
        razorpay_order_id,
        amount,
        currency,
        plan_name,
        plan_type,
        billing_cycle,
        max_projects,
        can_use_features,
        payment_status,
        payment_method,
        subscription_id,
        subscription_status,
        payment_date,
        created_at,
        expires_at,
        receipt_number,
        notes
      `).eq('user_id', user.id).order('payment_date', {
      ascending: false
    }).range(offset, offset + limit - 1);
    if (paymentsError) {
      console.error('Error fetching payment history:', paymentsError);

      // Check if it's a table doesn't exist error
      if (paymentsError.message?.includes('relation "public.payments" does not exist')) {
        return NextResponse.json({
          payments: [],
          total: 0,
          limit,
          offset,
          has_more: false,
          message: 'Payments table not set up yet'
        });
      }
      return NextResponse.json({
        error: 'Failed to fetch payment history',
        details: paymentsError.message
      }, {
        status: 500
      });
    }

    // Get total count for pagination using service client
    const {
      count,
      error: countError
    } = await supabaseServiceClient.from('payments').select('*', {
      count: 'exact',
      head: true
    }).eq('user_id', user.id);
    if (countError) {
      console.warn('Error getting payment count:', countError);
    }
    return NextResponse.json({
      payments: payments || [],
      total: count || 0,
      limit,
      offset,
      has_more: (count || 0) > offset + limit
    });
  } catch (error) {
    console.error('Payment history API error:', error);
    return NextResponse.json({
      error: 'Failed to fetch payment history',
      details: (error as Error).message
    }, {
      status: 500
    });
  }
}