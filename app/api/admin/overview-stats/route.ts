import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_request: NextRequest) {
  try {
    const supabase = supabaseAdmin

    // Get total users count
    const { count: totalUsers, error: totalUsersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (totalUsersError) {
      console.error('Error fetching total users:', totalUsersError)
      return NextResponse.json({ error: 'Failed to fetch total users' }, { status: 500 })
    }

    // Get active users (users with recent activity - last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: activeUsers, error: activeUsersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', thirtyDaysAgo.toISOString())

    if (activeUsersError) {
      console.error('Error fetching active users:', activeUsersError)
      return NextResponse.json({ error: 'Failed to fetch active users' }, { status: 500 })
    }

    // Get total projects count
    const { count: totalProjects, error: totalProjectsError } = await supabase
      .from('audit_projects')
      .select('*', { count: 'exact', head: true })

    if (totalProjectsError) {
      console.error('Error fetching total projects:', totalProjectsError)
      return NextResponse.json({ error: 'Failed to fetch total projects' }, { status: 500 })
    }

    // Get total audits count
    const { count: totalAudits, error: totalAuditsError } = await supabase
      .from('audit_projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    if (totalAuditsError) {
      console.error('Error fetching total audits:', totalAuditsError)
      return NextResponse.json({ error: 'Failed to fetch total audits' }, { status: 500 })
    }

    // Get critical issues (projects with low scores)
    const { count: criticalIssues, error: criticalIssuesError } = await supabase
      .from('audit_projects')
      .select('*', { count: 'exact', head: true })
      .lt('score', 50)

    if (criticalIssuesError) {
      console.error('Error fetching critical issues:', criticalIssuesError)
      return NextResponse.json({ error: 'Failed to fetch critical issues' }, { status: 500 })
    }

    // Get resolved issues (projects with high scores)
    const { count: resolvedIssues, error: resolvedIssuesError } = await supabase
      .from('audit_projects')
      .select('*', { count: 'exact', head: true })
      .gte('score', 80)

    if (resolvedIssuesError) {
      console.error('Error fetching resolved issues:', resolvedIssuesError)
      return NextResponse.json({ error: 'Failed to fetch resolved issues' }, { status: 500 })
    }

    // Get total scraped pages count
    const { count: totalScrapedPages, error: scrapedPagesError } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true })

    if (scrapedPagesError) {
      console.error('Error fetching scraped pages:', scrapedPagesError)
      return NextResponse.json({ error: 'Failed to fetch scraped pages' }, { status: 500 })
    }

    // Get pages with social meta tags
    const { count: pagesWithSocialMeta, error: socialMetaError } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true })
      .gt('social_meta_tags_count', 0)

    if (socialMetaError) {
      console.error('Error fetching pages with social meta:', socialMetaError)
    }

    // Get pages with CMS detection
    const { count: pagesWithCMS, error: cmsError } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true })
      .not('cms_type', 'is', null)

    if (cmsError) {
      console.error('Error fetching pages with CMS:', cmsError)
    }

    // Get ticket statistics
    const { count: totalTickets, error: totalTicketsError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })

    if (totalTicketsError) {
      console.error('Error fetching total tickets:', totalTicketsError)
    }

    // Get open tickets
    const { count: openTickets, error: openTicketsError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')

    if (openTicketsError) {
      console.error('Error fetching open tickets:', openTicketsError)
    }

    // Get in progress tickets
    const { count: inProgressTickets, error: inProgressTicketsError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress')

    if (inProgressTicketsError) {
      console.error('Error fetching in progress tickets:', inProgressTicketsError)
    }

    // Get resolved tickets
    const { count: resolvedTickets, error: resolvedTicketsError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved')

    if (resolvedTicketsError) {
      console.error('Error fetching resolved tickets:', resolvedTicketsError)
    }

    // Get high priority tickets
    const { count: highPriorityTickets, error: highPriorityTicketsError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .in('priority', ['high', 'urgent'])

    if (highPriorityTicketsError) {
      console.error('Error fetching high priority tickets:', highPriorityTicketsError)
    }

    // Calculate system uptime (mock calculation - in real scenario, this would come from monitoring)
    const systemUptime = '99.9%'
    
    // Calculate average response time (mock calculation)
    const responseTime = '120ms'

    const stats = {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalProjects: totalProjects || 0,
      totalAudits: totalAudits || 0,
      criticalIssues: criticalIssues || 0,
      resolvedIssues: resolvedIssues || 0,
      totalScrapedPages: totalScrapedPages || 0,
      pagesWithSocialMeta: pagesWithSocialMeta || 0,
      pagesWithCMS: pagesWithCMS || 0,
      totalTickets: totalTickets || 0,
      openTickets: openTickets || 0,
      inProgressTickets: inProgressTickets || 0,
      resolvedTickets: resolvedTickets || 0,
      highPriorityTickets: highPriorityTickets || 0,
      systemUptime,
      responseTime
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error in overview stats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
