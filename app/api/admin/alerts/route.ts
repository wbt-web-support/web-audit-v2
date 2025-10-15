import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const severity = searchParams.get('severity')

    let query = supabaseAdmin
      .from('admin_alerts')
      .select(`
        *,
        created_by_user:users!admin_alerts_created_by_fkey(first_name, last_name, email)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (type && type !== 'all') {
      query = query.eq('alert_type', type)
    }
    if (severity && severity !== 'all') {
      query = query.eq('severity', severity)
    }

    const { data: alerts, error } = await query

    if (error) {
      console.error('Error fetching alerts:', error)
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
    }

    return NextResponse.json({ alerts: alerts || [] })
  } catch (error) {
    console.error('Error in alerts GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      message,
      alert_type,
      severity,
      status,
      is_global,
      target_audience,
      start_date,
      end_date,
      priority,
      action_url,
      action_text,
      dismissible,
      auto_expire
    } = body

    const { data, error } = await supabaseAdmin
      .from('admin_alerts')
      .insert({
        title,
        message,
        alert_type,
        severity,
        status,
        is_global,
        target_audience,
        start_date,
        end_date,
        priority,
        action_url,
        action_text,
        dismissible,
        auto_expire,
        created_by: null
      })
      .select()

    if (error) {
      console.error('Error creating alert:', error)
      return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
    }

    return NextResponse.json({ alert: data[0] })
  } catch (error) {
    console.error('Error in alerts POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    const { data, error } = await supabaseAdmin
      .from('admin_alerts')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating alert:', error)
      return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
    }

    return NextResponse.json({ alert: data[0] })
  } catch (error) {
    console.error('Error in alerts PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('admin_alerts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting alert:', error)
      return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in alerts DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
