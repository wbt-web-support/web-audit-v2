import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('=== PAYMENT HISTORY API CALLED ===');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return NextResponse.json(
        { 
          error: 'User not authenticated',
          details: 'Please log in to view payment history',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('Fetching payment history for user:', user.id);

    // Fetch payment history with available fields
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        id,
        razorpay_payment_id,
        amount,
        currency,
        plan_name,
        plan_type,
        payment_status,
        payment_date,
        created_at
      `)
      .eq('user_id', user.id)
      .order('payment_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (paymentsError) {
      console.error('Error fetching payment history:', paymentsError);
      
      // Check if it's a table doesn't exist error
      if (paymentsError.message?.includes('relation "public.payments" does not exist')) {
        console.log('Payments table does not exist yet, returning empty array');
        return NextResponse.json({
          payments: [],
          total: 0,
          limit,
          offset,
          has_more: false,
          message: 'Payments table not set up yet'
        });
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch payment history', details: paymentsError.message },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.warn('Error getting payment count:', countError);
    }

    console.log('Payment history fetched:', payments?.length || 0, 'payments');

    return NextResponse.json({
      payments: payments || [],
      total: count || 0,
      limit,
      offset,
      has_more: (count || 0) > offset + limit
    });

  } catch (error) {
    console.error('Payment history API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch payment history',
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
