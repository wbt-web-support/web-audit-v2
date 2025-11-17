import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get payment history with user and plan details
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        currency,
        plan_name,
        plan_type,
        billing_cycle,
        payment_status,
        payment_method,
        payment_date,
        created_at,
        receipt_number,
        user_id,
        users!inner(email, first_name, last_name)
      `)
      .order('payment_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching payment history:', error)
      return NextResponse.json({ error: 'Failed to fetch payment history' }, { status: 500 })
    }

    // Get plan statistics
    const { data: planStats, error: planStatsError } = await supabase
      .from('payments')
      .select(`
        plan_name,
        plan_type,
        amount,
        payment_status
      `)
      .eq('payment_status', 'completed')

    if (planStatsError) {
      console.error('Error fetching plan stats:', planStatsError)
      return NextResponse.json({ error: 'Failed to fetch plan statistics' }, { status: 500 })
    }

    // Calculate plan statistics
    const planStatsMap = new Map()
    planStats?.forEach(payment => {
      const key = `${payment.plan_name}-${payment.plan_type}`
      if (!planStatsMap.has(key)) {
        planStatsMap.set(key, {
          name: payment.plan_name,
          type: payment.plan_type,
          users: 0,
          revenue: 0,
          status: 'active'
        })
      }
      const plan = planStatsMap.get(key)
      plan.users += 1
      plan.revenue += Number(payment.amount)
    })

    const planStatistics = Array.from(planStatsMap.values())

    // Helper function to get user display name
    const getUserDisplayName = (user: { first_name?: string | null; last_name?: string | null; email?: string | null }) => {
      if (user?.first_name && user?.last_name) {
        return `${user.first_name} ${user.last_name}`;
      }
      if (user?.first_name) {
        return user.first_name;
      }
      if (user?.last_name) {
        return user.last_name;
      }
      // Fallback to email username if name is not available
      if (user?.email) {
        return user.email.split('@')[0];
      }
      return 'Unknown User';
    };

    // Fetch auth user data for users who might have Google auth
    const userIds = payments?.map(p => p.user_id).filter(Boolean) || [];
    const authUserDataMap = new Map<string, any>();
    
    // Fetch auth data for all unique user IDs
    if (userIds.length > 0) {
      try {
        const uniqueUserIds = [...new Set(userIds)];
        await Promise.all(
          uniqueUserIds.map(async (userId) => {
            try {
              const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
              if (!authError && authUser?.user) {
                authUserDataMap.set(userId, {
                  raw_user_meta_data: authUser.user.user_metadata || {},
                  app_metadata: authUser.user.app_metadata || {}
                });
              }
            } catch (err) {
              // Silently fail for individual users
              console.warn(`Failed to fetch auth data for user ${userId}:`, err);
            }
          })
        );
      } catch (err) {
        // Silently fail - we'll just use database data
        console.warn('Failed to fetch some auth user data:', err);
      }
    }

    // Format payment history
    const formattedPayments = payments?.map(payment => {
      // Handle the case where users might be an array or single object
      const user = Array.isArray(payment.users) ? payment.users[0] : payment.users
      
      // Try to get Google auth data
      const authData = authUserDataMap.get(payment.user_id);
      const googleFirstName = authData?.raw_user_meta_data?.first_name || 
        authData?.raw_user_meta_data?.full_name?.split(' ')[0];
      const googleLastName = authData?.raw_user_meta_data?.last_name || 
        authData?.raw_user_meta_data?.full_name?.split(' ').slice(1).join(' ');
      const googleFullName = authData?.raw_user_meta_data?.full_name || 
        authData?.raw_user_meta_data?.name;

      // Determine display name with priority: Google > Database > Email
      let userName = 'Unknown User';
      if (googleFullName) {
        userName = googleFullName;
      } else if (googleFirstName && googleLastName) {
        userName = `${googleFirstName} ${googleLastName}`;
      } else if (user?.first_name && user?.last_name) {
        userName = `${user.first_name} ${user.last_name}`;
      } else if (googleFirstName || user?.first_name) {
        userName = googleFirstName || user?.first_name || '';
      } else if (googleLastName || user?.last_name) {
        userName = googleLastName || user?.last_name || '';
      } else if (user?.email) {
        userName = user.email.split('@')[0];
      }
      
      return {
        id: payment.id,
        user: user?.email || 'Unknown',
        userName: userName,
        plan: payment.plan_name,
        amount: Number(payment.amount),
        currency: payment.currency || 'INR',
        status: payment.payment_status,
        date: payment.payment_date ? new Date(payment.payment_date).toISOString().split('T')[0] : 'N/A',
        paymentMethod: payment.payment_method,
        receiptNumber: payment.receipt_number
      }
    }) || []

    return NextResponse.json({
      payments: formattedPayments,
      planStatistics
    })
  } catch (error) {
    console.error('Error in payment history API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
