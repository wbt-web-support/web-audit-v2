import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_request: NextRequest) {
  try {
    // Get total counts
    const { count: totalAlerts } = await supabaseAdmin
      .from('admin_alerts')
      .select('*', { count: 'exact', head: true })

    const { count: activeAlerts } = await supabaseAdmin
      .from('admin_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    const { count: inactiveAlerts } = await supabaseAdmin
      .from('admin_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'inactive')

    const { count: draftAlerts } = await supabaseAdmin
      .from('admin_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft')

    const { count: criticalAlerts } = await supabaseAdmin
      .from('admin_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('severity', 'critical')
      .eq('status', 'active')

    const { count: highPriorityAlerts } = await supabaseAdmin
      .from('admin_alerts')
      .select('*', { count: 'exact', head: true })
      .gte('priority', 8)
      .eq('status', 'active')

    // Get alerts by type
    const { data: alertsByType } = await supabaseAdmin
      .from('admin_alerts')
      .select('alert_type')
      .eq('status', 'active')

    type AlertTypeRow = { alert_type: string | null }
    const typeCounts = (alertsByType as AlertTypeRow[] | null)?.reduce<Record<string, number>>((acc, alert) => {
      const key = alert.alert_type || 'unknown'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {}) || {}

    const alertsByTypeArray = Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count: count as number
    }))

    // Get alerts by severity
    const { data: alertsBySeverity } = await supabaseAdmin
      .from('admin_alerts')
      .select('severity')
      .eq('status', 'active')

    type SeverityRow = { severity: string | null }
    const severityCounts = (alertsBySeverity as SeverityRow[] | null)?.reduce<Record<string, number>>((acc, alert) => {
      const key = alert.severity || 'unknown'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {}) || {}

    const alertsBySeverityArray = Object.entries(severityCounts).map(([severity, count]) => ({
      severity,
      count: count as number
    }))

    // Get recent alerts
    const { data: recentAlerts } = await supabaseAdmin
      .from('admin_alerts')
      .select(`
        *,
        created_by_user:users!admin_alerts_created_by_fkey(first_name, last_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    const stats = {
      totalAlerts: totalAlerts || 0,
      activeAlerts: activeAlerts || 0,
      inactiveAlerts: inactiveAlerts || 0,
      draftAlerts: draftAlerts || 0,
      criticalAlerts: criticalAlerts || 0,
      highPriorityAlerts: highPriorityAlerts || 0,
      alertsByType: alertsByTypeArray,
      alertsBySeverity: alertsBySeverityArray,
      recentAlerts: recentAlerts || []
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error in alerts stats GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
