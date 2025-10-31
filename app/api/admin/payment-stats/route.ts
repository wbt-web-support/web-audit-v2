import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const planId = searchParams.get('planId')

    // Check if payments table exists by trying a simple query first
    const { error: testError } = await supabase
      .from('payments')
      .select('id')
      .limit(1)

    if (testError) {
      console.error('Payments table error:', testError)
      // Return mock data if payments table doesn't exist
      return NextResponse.json({
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        cancelledSubscriptions: 0,
        monthlyRevenue: 0,
        annualRevenue: 0,
        averageRevenuePerUser: 0
      })
    }

    // Helper function to build query with filters
    const buildQuery = <T extends { gte: (col: string, val: unknown) => T; lte: (col: string, val: unknown) => T; eq: (col: string, val: unknown) => T }>(baseQuery: T): T => {
      let query = baseQuery
      if (startDate) {
        query = query.gte('payment_date', startDate) as T
      }
      if (endDate) {
        query = query.lte('payment_date', endDate) as T
      }
      if (planId) {
        query = query.eq('plan_id', planId) as T
      }
      return query
    }

    // Get total payments count
    let totalQuery = supabase.from('payments').select('*', { count: 'exact', head: true })
    if (startDate) totalQuery = totalQuery.gte('payment_date', startDate) as typeof totalQuery
    if (endDate) totalQuery = totalQuery.lte('payment_date', endDate) as typeof totalQuery
    if (planId) totalQuery = totalQuery.eq('plan_id', planId) as typeof totalQuery
    const { count: totalPayments, error: totalError } = await totalQuery

    if (totalError) {
      console.error('Error fetching total payments:', totalError)
      return NextResponse.json({ error: 'Failed to fetch total payments' }, { status: 500 })
    }

    // Get active payments (completed status)
    let activeQuery = supabase.from('payments').select('*', { count: 'exact', head: true }).eq('payment_status', 'completed')
    if (startDate) activeQuery = activeQuery.gte('payment_date', startDate) as typeof activeQuery
    if (endDate) activeQuery = activeQuery.lte('payment_date', endDate) as typeof activeQuery
    if (planId) activeQuery = activeQuery.eq('plan_id', planId) as typeof activeQuery
    const { count: activePayments, error: activeError } = await activeQuery

    if (activeError) {
      console.error('Error fetching active payments:', activeError)
      return NextResponse.json({ error: 'Failed to fetch active payments' }, { status: 500 })
    }

    // Get cancelled payments
    let cancelledQuery = supabase.from('payments').select('*', { count: 'exact', head: true }).eq('payment_status', 'cancelled')
    if (startDate) cancelledQuery = cancelledQuery.gte('payment_date', startDate) as typeof cancelledQuery
    if (endDate) cancelledQuery = cancelledQuery.lte('payment_date', endDate) as typeof cancelledQuery
    if (planId) cancelledQuery = cancelledQuery.eq('plan_id', planId) as typeof cancelledQuery
    const { count: cancelledPayments, error: cancelledError } = await cancelledQuery

    if (cancelledError) {
      console.error('Error fetching cancelled payments:', cancelledError)
      return NextResponse.json({ error: 'Failed to fetch cancelled payments' }, { status: 500 })
    }

    // Get monthly revenue (current month or filtered period)
    const currentDate = new Date()
    const startOfMonth = startDate ? new Date(startDate) : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = endDate ? new Date(endDate) : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    let monthlyQuery = supabase.from('payments')
      .select('amount')
      .eq('payment_status', 'completed')
      .gte('payment_date', startOfMonth.toISOString())
      .lte('payment_date', endOfMonth.toISOString())
    if (planId) monthlyQuery = monthlyQuery.eq('plan_id', planId) as typeof monthlyQuery
    const { data: monthlyPayments, error: monthlyError } = await monthlyQuery

    if (monthlyError) {
      console.error('Error fetching monthly revenue:', monthlyError)
      return NextResponse.json({ error: 'Failed to fetch monthly revenue' }, { status: 500 })
    }

    // Get annual revenue (current year or filtered period)
    const startOfYear = startDate ? new Date(startDate) : new Date(currentDate.getFullYear(), 0, 1)
    const endOfYear = endDate ? new Date(endDate) : new Date(currentDate.getFullYear(), 11, 31)

    let annualQuery = supabase.from('payments')
      .select('amount')
      .eq('payment_status', 'completed')
      .gte('payment_date', startOfYear.toISOString())
      .lte('payment_date', endOfYear.toISOString())
    if (planId) annualQuery = annualQuery.eq('plan_id', planId) as typeof annualQuery
    const { data: annualPayments, error: annualError } = await annualQuery

    if (annualError) {
      console.error('Error fetching annual revenue:', annualError)
      return NextResponse.json({ error: 'Failed to fetch annual revenue' }, { status: 500 })
    }

    // Calculate revenues
    type PaymentAmountRow = { amount: number | string | null | undefined }
    const monthlyRevenue = (monthlyPayments as PaymentAmountRow[] | null)?.reduce((sum: number, payment) => sum + Number(payment.amount ?? 0), 0) || 0
    const annualRevenue = (annualPayments as PaymentAmountRow[] | null)?.reduce((sum: number, payment) => sum + Number(payment.amount ?? 0), 0) || 0
    const averageRevenuePerUser = activePayments && activePayments > 0 ? annualRevenue / activePayments : 0

    const stats = {
      totalSubscriptions: totalPayments || 0,
      activeSubscriptions: activePayments || 0,
      cancelledSubscriptions: cancelledPayments || 0,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      annualRevenue: Math.round(annualRevenue * 100) / 100,
      averageRevenuePerUser: Math.round(averageRevenuePerUser * 100) / 100
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error in payment stats API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
