import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get recent user registrations
    const { data: recentUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (usersError) {
      console.error('Error fetching recent users:', usersError)
    }

    // Get recent completed audits
    const { data: recentAudits, error: auditsError } = await supabase
      .from('audit_projects')
      .select('id, site_url, status, score, updated_at')
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
      .limit(5)

    if (auditsError) {
      console.error('Error fetching recent audits:', auditsError)
    }

    // Get recent payments
    const { data: recentPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, amount, plan_name, payment_status, payment_date, users!inner(email)')
      .order('payment_date', { ascending: false })
      .limit(5)

    if (paymentsError) {
      console.error('Error fetching recent payments:', paymentsError)
    }

    // Get recent tickets (if table exists)
    let recentTickets = null
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, title, status, priority, created_at, updated_at, users!inner(email)')
      .order('created_at', { ascending: false })
      .limit(5)

    if (ticketsError) {
      console.warn('Tickets table not found or error occurred. Skipping tickets data.')
    } else {
      recentTickets = ticketsData
    }

    // Format activity data
    type Activity = {
      id: string
      type: 'user_registration' | 'audit_completed' | 'payment_received' | 'ticket_created'
      message: string
      timestamp: string
      status: 'success' | 'warning' | 'error' | 'info'
      priority: number
    }
    const activities: Activity[] = []

    // Add user registrations
    recentUsers?.forEach((user) => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user_registration',
        message: `New user registered: ${user.email}`,
        timestamp: formatTimestamp(user.created_at),
        status: 'success',
        priority: 1
      })
    })

    // Add completed audits
    recentAudits?.forEach((audit) => {
      const status = audit.score >= 80 ? 'success' : audit.score >= 50 ? 'warning' : 'error'
      activities.push({
        id: `audit-${audit.id}`,
        type: 'audit_completed',
        message: `Audit completed for ${audit.site_url} (Score: ${audit.score})`,
        timestamp: formatTimestamp(audit.updated_at),
        status,
        priority: 2
      })
    })

    // Add payments
    recentPayments?.forEach((payment) => {
      const status = payment.payment_status === 'completed' ? 'success' : 'warning'
      activities.push({
        id: `payment-${payment.id}`,
        type: 'payment_received',
        message: `Payment received: $${payment.amount} for ${payment.plan_name}`,
        timestamp: formatTimestamp(payment.payment_date),
        status,
        priority: 3
      })
    })

    // Add tickets (if available)
    if (recentTickets) {
      recentTickets.forEach((ticket) => {
        const status = ticket.status === 'resolved' ? 'success' : 
                      ticket.status === 'closed' ? 'info' : 
                      ticket.priority === 'urgent' || ticket.priority === 'high' ? 'error' : 'warning'
        activities.push({
          id: `ticket-${ticket.id}`,
          type: 'ticket_created',
          message: `New ticket: ${ticket.title} (${ticket.priority} priority)`,
          timestamp: formatTimestamp(ticket.created_at),
          status,
          priority: ticket.priority === 'urgent' ? 1 : ticket.priority === 'high' ? 2 : 4
        })
      })
    }

    // Sort by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return NextResponse.json(sortedActivities)
  } catch (error) {
    console.error('Error in recent activity API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function formatTimestamp(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString()
}
