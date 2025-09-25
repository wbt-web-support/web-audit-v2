import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchPageSpeedInsights } from '@/lib/pagespeed'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pageId = searchParams.get('pageId')

  if (!pageId) {
    return NextResponse.json({ error: 'Page ID is required' }, { status: 400 })
  }

  try {
    console.log(`[Performance API] Checking existing performance analysis for pageId: ${pageId}`)

    // Check if performance analysis already exists
    const { data: existingPage, error: fetchError } = await supabaseAdmin
      .from('scraped_pages')
      .select('id, url, performance_analysis')
      .eq('id', pageId)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching page data:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch page data' }, { status: 500 })
    }

    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // If analysis already exists, return it
    if (existingPage.performance_analysis) {
      console.log(`[Performance API] Returning cached performance analysis for pageId: ${pageId}`)
      return NextResponse.json({
        success: true,
        analysis: existingPage.performance_analysis,
        cached: true
      })
    }

    return NextResponse.json({
      success: false,
      message: 'No performance analysis found'
    })
  } catch (error) {
    console.error('❌ Performance analysis check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { pageId, url } = await request.json()

    if (!pageId || !url) {
      return NextResponse.json({ error: 'Page ID and URL are required' }, { status: 400 })
    }

    console.log(`[Performance API] Starting performance analysis for pageId: ${pageId}, URL: ${url}`)

    // Check if performance analysis already exists
    const { data: existingPage, error: fetchError } = await supabaseAdmin
      .from('scraped_pages')
      .select('id, performance_analysis')
      .eq('id', pageId)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching page data:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch page data' }, { status: 500 })
    }

    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // If analysis already exists, return it
    if (existingPage.performance_analysis) {
      console.log(`[Performance API] Returning cached performance analysis for pageId: ${pageId}`)
      const duration = Date.now() - startTime
      console.log(`[Performance API] Request completed in ${duration}ms (cached)`)
      
      return NextResponse.json({
        success: true,
        analysis: existingPage.performance_analysis,
        cached: true
      })
    }

    console.log(`[Performance API] No existing analysis found, starting PageSpeed analysis...`)
    
    // Perform PageSpeed analysis
    const { data: pagespeedData, error: pagespeedError } = await fetchPageSpeedInsights(url)
    
    if (pagespeedError) {
      console.error('❌ PageSpeed analysis error:', pagespeedError)
      return NextResponse.json({ error: pagespeedError }, { status: 500 })
    }

    if (!pagespeedData) {
      return NextResponse.json({ error: 'No PageSpeed data received' }, { status: 500 })
    }

    console.log(`[Performance API] PageSpeed analysis completed, saving to database...`)
    
    // Save performance analysis to database
    const { error: saveError } = await supabaseAdmin
      .from('scraped_pages')
      .update({ performance_analysis: pagespeedData })
      .eq('id', pageId)

    if (saveError) {
      console.error('❌ Error saving performance analysis:', saveError)
      return NextResponse.json({ error: 'Failed to save performance analysis' }, { status: 500 })
    }

    const duration = Date.now() - startTime
    console.log(`[Performance API] Performance analysis completed and saved in ${duration}ms`)
    
    return NextResponse.json({
      success: true,
      analysis: pagespeedData,
      cached: false
    })
  } catch (error) {
    console.error('❌ Performance analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
