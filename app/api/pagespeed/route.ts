import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchPageSpeedInsights } from '@/lib/pagespeed'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { projectId, url } = await request.json()

    if (!projectId || !url) {
      return NextResponse.json({ error: 'Project ID and URL are required' }, { status: 400 })
    }

    console.log(`[PageSpeed API] Starting PageSpeed analysis for projectId: ${projectId}, URL: ${url}`)

    // Check if PageSpeed analysis already exists for this project
    const { data: existingProject, error: fetchError } = await supabaseAdmin
      .from('audit_projects')
      .select('id, pagespeed_insights_data')
      .eq('id', projectId)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching project data:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch project data' }, { status: 500 })
    }

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // If analysis already exists, return it
    if (existingProject.pagespeed_insights_data) {
      console.log(`[PageSpeed API] Returning cached PageSpeed analysis for projectId: ${projectId}`)
      const duration = Date.now() - startTime
      console.log(`[PageSpeed API] Request completed in ${duration}ms (cached)`)
      
      return NextResponse.json({
        success: true,
        analysis: existingProject.pagespeed_insights_data,
        cached: true
      })
    }

    console.log(`[PageSpeed API] No existing analysis found, starting PageSpeed analysis...`)
    
    // Perform PageSpeed analysis
    const { data: pagespeedData, error: pagespeedError } = await fetchPageSpeedInsights(url)
    
    if (pagespeedError) {
      console.error('❌ PageSpeed analysis error:', pagespeedError)
      return NextResponse.json({ error: pagespeedError }, { status: 500 })
    }

    if (!pagespeedData) {
      return NextResponse.json({ error: 'No PageSpeed data received' }, { status: 500 })
    }

    console.log(`[PageSpeed API] PageSpeed analysis completed, saving to database...`)
    
    // Save PageSpeed analysis to project
    const { error: saveError } = await supabaseAdmin
      .from('audit_projects')
      .update({ 
        pagespeed_insights_data: pagespeedData,
        pagespeed_insights_loading: false,
        pagespeed_insights_error: null
      })
      .eq('id', projectId)

    if (saveError) {
      console.error('❌ Error saving PageSpeed analysis:', saveError)
      return NextResponse.json({ error: 'Failed to save PageSpeed analysis' }, { status: 500 })
    }

    const duration = Date.now() - startTime
    console.log(`[PageSpeed API] PageSpeed analysis completed and saved in ${duration}ms`)
    
    return NextResponse.json({
      success: true,
      analysis: pagespeedData,
      cached: false
    })
  } catch (error) {
    console.error('❌ PageSpeed analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
