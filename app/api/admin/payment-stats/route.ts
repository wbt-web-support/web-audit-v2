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
    const { data: testData, error: testError } = await supabase
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
    const buildQuery = (baseQuery: any) => {
      let query = baseQuery
      if (startDate) {
        query = query.gte('payment_date', startDate)
      }
      if (endDate) {
        query = query.lte('payment_date', endDate)
      }
      if (planId) {
        query = query.eq('plan_id', planId)
      }
      return query
    }

    // Get total payments count
    const { count: totalPayments, error: totalError } = await buildQuery(
      supabase.from('payments').select('*', { count: 'exact', head: true })
    )

    if (totalError) {
      console.error('Error fetching total payments:', totalError)
      return NextResponse.json({ error: 'Failed to fetch total payments' }, { status: 500 })
    }

    // Get active payments (completed status)
    const { count: activePayments, error: activeError } = await buildQuery(
      supabase.from('payments').select('*', { count: 'exact', head: true }).eq('payment_status', 'completed')
    )

    if (activeError) {
      console.error('Error fetching active payments:', activeError)
      return NextResponse.json({ error: 'Failed to fetch active payments' }, { status: 500 })
    }

    // Get cancelled payments
    const { count: cancelledPayments, error: cancelledError } = await buildQuery(
      supabase.from('payments').select('*', { count: 'exact', head: true }).eq('payment_status', 'cancelled')
    )

    if (cancelledError) {
      console.error('Error fetching cancelled payments:', cancelledError)
      return NextResponse.json({ error: 'Failed to fetch cancelled payments' }, { status: 500 })
    }

    // Get monthly revenue (current month or filtered period)
    const currentDate = new Date()
    const startOfMonth = startDate ? new Date(startDate) : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = endDate ? new Date(endDate) : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    const { data: monthlyPayments, error: monthlyError } = await buildQuery(
      supabase.from('payments')
        .select('amount')
        .eq('payment_status', 'completed')
        .gte('payment_date', startOfMonth.toISOString())
        .lte('payment_date', endOfMonth.toISOString())
    )

    if (monthlyError) {
      console.error('Error fetching monthly revenue:', monthlyError)
      return NextResponse.json({ error: 'Failed to fetch monthly revenue' }, { status: 500 })
    }

    // Get annual revenue (current year or filtered period)
    const startOfYear = startDate ? new Date(startDate) : new Date(currentDate.getFullYear(), 0, 1)
    const endOfYear = endDate ? new Date(endDate) : new Date(currentDate.getFullYear(), 11, 31)

    const { data: annualPayments, error: annualError } = await buildQuery(
      supabase.from('payments')
        .select('amount')
        .eq('payment_status', 'completed')
        .gte('payment_date', startOfYear.toISOString())
        .lte('payment_date', endOfYear.toISOString())
    )

    if (annualError) {
      console.error('Error fetching annual revenue:', annualError)
      return NextResponse.json({ error: 'Failed to fetch annual revenue' }, { status: 500 })
    }

    // Calculate revenues
    const monthlyRevenue = monthlyPayments?.reduce((sum: number, payment: any) => sum + Number(payment.amount), 0) || 0
    const annualRevenue = annualPayments?.reduce((sum: number, payment: any) => sum + Number(payment.amount), 0) || 0
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
