import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/alerts - Get active alerts for users (public endpoint)
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated to get user-specific alerts
    const { data: { user } } = await supabase.auth.getUser()
    
    const { searchParams } = new URL(request.url)
    const userPlan = searchParams.get('plan') || 'free'

    // Get active alerts that are global or match user's plan
    let query = supabase
      .from('admin_alerts')
      .select(`
        id,
        title,
        message,
        alert_type,
        severity,
        priority,
        action_url,
        action_text,
        dismissible,
        start_date,
        end_date,
        created_at
      `)
      .eq('status', 'active')
      .lte('start_date', new Date().toISOString())
      .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    // Filter by target audience
    query = query.or(`target_audience.eq.all,target_audience.eq.${userPlan}`)

    const { data: alerts, error } = await query

    if (error) {
      console.error('Error fetching user alerts:', error)
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
    }

    // Increment view count for each alert
    if (alerts && alerts.length > 0) {
      const alertIds = alerts.map(alert => alert.id)
      await supabase
        .from('admin_alerts')
        .update({ view_count: 'view_count + 1' })
        .in('id', alertIds)
    }

    return NextResponse.json({ alerts: alerts || [] })
  } catch (error) {
    console.error('Error in GET /api/alerts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/alerts/click - Track alert click
export async function POST(request: NextRequest) {
  try {
    const { alertId } = await request.json()
    
    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 })
    }

    // Increment click count
    const { error } = await supabase
      .from('admin_alerts')
      .update({ click_count: 'click_count + 1' })
      .eq('id', alertId)

    if (error) {
      console.error('Error tracking alert click:', error)
      return NextResponse.json({ error: 'Failed to track click' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/alerts/click:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
