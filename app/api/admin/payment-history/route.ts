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

    // Format payment history
    const formattedPayments = payments?.map(payment => {
      // Handle the case where users might be an array or single object
      const user = Array.isArray(payment.users) ? payment.users[0] : payment.users
      
      return {
        id: payment.id,
        user: user?.email || 'Unknown',
        userName: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Unknown User',
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
