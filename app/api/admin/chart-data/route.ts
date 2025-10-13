import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const planId = searchParams.get('planId')
    const chartType = searchParams.get('chartType') || 'revenue'

    // Default to last 12 months if no dates provided
    const currentDate = new Date()
    const defaultStartDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1)
    const defaultEndDate = new Date()

    const start = startDate ? new Date(startDate) : defaultStartDate
    const end = endDate ? new Date(endDate) : defaultEndDate

    if (chartType === 'revenue') {
      // Get monthly revenue data
      let query = supabase
        .from('payments')
        .select('amount, payment_date')
        .eq('payment_status', 'completed')
        .gte('payment_date', start.toISOString())
        .lte('payment_date', end.toISOString())
        .order('payment_date', { ascending: true })

      if (planId) {
        query = query.eq('plan_id', planId)
      }

      const { data: payments, error } = await query

      if (error) {
        console.error('Error fetching revenue data:', error)
        return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 })
      }

      // Group by month
      const monthlyData = new Map()
      payments?.forEach(payment => {
        const date = new Date(payment.payment_date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            month: monthName,
            revenue: 0,
            users: 0
          })
        }
        
        const existing = monthlyData.get(monthKey)
        existing.revenue += Number(payment.amount)
        existing.users += 1
      })

      const revenueData = Array.from(monthlyData.values()).sort((a, b) => 
        new Date(a.month).getTime() - new Date(b.month).getTime()
      )

      return NextResponse.json(revenueData)
    }

    if (chartType === 'users') {
      // Get user growth data
      let query = supabase
        .from('payments')
        .select('user_id, payment_date')
        .eq('payment_status', 'completed')
        .gte('payment_date', start.toISOString())
        .lte('payment_date', end.toISOString())
        .order('payment_date', { ascending: true })

      if (planId) {
        query = query.eq('plan_id', planId)
      }

      const { data: payments, error } = await query

      if (error) {
        console.error('Error fetching user data:', error)
        return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
      }

      // Group by month
      const monthlyData = new Map()
      const uniqueUsers = new Set()
      
      payments?.forEach(payment => {
        const date = new Date(payment.payment_date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            month: monthName,
            newUsers: 0,
            totalUsers: 0
          })
        }
        
        const existing = monthlyData.get(monthKey)
        if (!uniqueUsers.has(payment.user_id)) {
          existing.newUsers += 1
          uniqueUsers.add(payment.user_id)
        }
        existing.totalUsers = uniqueUsers.size
      })

      const userData = Array.from(monthlyData.values()).sort((a, b) => 
        new Date(a.month).getTime() - new Date(b.month).getTime()
      )

      return NextResponse.json(userData)
    }

    if (chartType === 'plans') {
      // Get plan distribution data
      let query = supabase
        .from('payments')
        .select('plan_name, plan_type, amount')
        .eq('payment_status', 'completed')
        .gte('payment_date', start.toISOString())
        .lte('payment_date', end.toISOString())

      if (planId) {
        query = query.eq('plan_id', planId)
      }

      const { data: payments, error } = await query

      if (error) {
        console.error('Error fetching plan data:', error)
        return NextResponse.json({ error: 'Failed to fetch plan data' }, { status: 500 })
      }

      // Group by plan
      const planData = new Map()
      payments?.forEach(payment => {
        const planKey = `${payment.plan_name} (${payment.plan_type})`
        
        if (!planData.has(planKey)) {
          planData.set(planKey, {
            name: planKey,
            value: 0,
            color: '#3b82f6'
          })
        }
        
        const existing = planData.get(planKey)
        existing.value += 1
      })

      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
      const planDistribution = Array.from(planData.values()).map((plan, index) => ({
        ...plan,
        color: colors[index % colors.length]
      }))

      return NextResponse.json(planDistribution)
    }

    return NextResponse.json({ error: 'Invalid chart type' }, { status: 400 })
  } catch (error) {
    console.error('Error in chart data API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
