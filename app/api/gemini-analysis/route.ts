import { NextRequest, NextResponse } from 'next/server'
import { analyzeContentWithGemini, getGeminiAnalysisStatus } from '@/lib/gemini'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log(`[API] POST /api/gemini-analysis - Request started`)
  
  try {
    const requestBody = await request.json()
    console.log(`[API] Request body received:`, {
      pageId: requestBody.pageId,
      url: requestBody.url,
      contentLength: requestBody.content?.length || 0,
      hasContent: !!requestBody.content
    })

    const { pageId, content, url } = requestBody

    if (!pageId || !content || !url) {
      console.log(`[API] Missing required fields:`, { pageId: !!pageId, content: !!content, url: !!url })
      return NextResponse.json(
        { error: 'Missing required fields: pageId, content, url' },
        { status: 400 }
      )
    }

    console.log(`[API] Checking for existing analysis for pageId: ${pageId}`)
    
    // Check if analysis already exists for this page
    const { data: existingAnalysis, error: fetchError } = await supabaseAdmin
      .from('scraped_pages')
      .select('gemini_analysis')
      .eq('id', pageId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[API] Error fetching existing analysis:', fetchError)
      return NextResponse.json(
        { error: 'Failed to check existing analysis' },
        { status: 500 }
      )
    }

    console.log(`[API] Existing analysis check result:`, {
      hasExistingAnalysis: !!existingAnalysis?.gemini_analysis,
      fetchError: fetchError?.code
    })

    // If analysis already exists, return it
    if (existingAnalysis?.gemini_analysis) {
      console.log(`[API] Returning cached analysis for pageId: ${pageId}`)
      const duration = Date.now() - startTime
      console.log(`[API] Request completed in ${duration}ms (cached)`)
      
      return NextResponse.json({
        success: true,
        analysis: existingAnalysis.gemini_analysis,
        cached: true
      })
    }

    console.log(`[API] No existing analysis found, checking Gemini API availability...`)
    
    // Check if Gemini API is available
    const isGeminiAvailable = await getGeminiAnalysisStatus()
    console.log(`[API] Gemini API availability check: ${isGeminiAvailable}`)
    
    if (!isGeminiAvailable) {
      console.log(`[API] Gemini API not available, returning 503`)
      return NextResponse.json(
        { error: 'Gemini API is not available' },
        { status: 503 }
      )
    }

    console.log(`[API] Starting Gemini analysis for URL: ${url}`)
    const analysisStartTime = Date.now()
    
    // Perform Gemini analysis
    const analysis = await analyzeContentWithGemini(content, url)
    
    const analysisDuration = Date.now() - analysisStartTime
    console.log(`[API] Gemini analysis completed in ${analysisDuration}ms`)
    console.log(`[API] Analysis result summary:`, {
      overallScore: analysis.overall_score,
      grammarScore: analysis.grammar_score,
      consistencyScore: analysis.consistency_score,
      readabilityScore: analysis.readability_score,
      wordCount: analysis.word_count,
      sentenceCount: analysis.sentence_count
    })

    console.log(`[API] Saving analysis to database for pageId: ${pageId}`)
    
    // Save analysis to database
    const { error: saveError } = await supabaseAdmin
      .from('scraped_pages')
      .update({ gemini_analysis: analysis })
      .eq('id', pageId)

    if (saveError) {
      console.error('[API] Error saving Gemini analysis:', saveError)
      return NextResponse.json(
        { error: 'Failed to save analysis' },
        { status: 500 }
      )
    }

    console.log(`[API] Analysis saved successfully to database`)
    
    const totalDuration = Date.now() - startTime
    console.log(`[API] Request completed successfully in ${totalDuration}ms`)
    console.log(`[API] Returning analysis result`)

    return NextResponse.json({
      success: true,
      analysis,
      cached: false
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API] Error in Gemini analysis API after ${duration}ms:`, error)
    console.error('[API] Error type:', typeof error)
    console.error('[API] Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  console.log(`[API] GET /api/gemini-analysis - Request started`)
  
  try {
    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get('pageId')
    
    console.log(`[API] GET request for pageId: ${pageId}`)

    if (!pageId) {
      console.log(`[API] Missing pageId parameter`)
      return NextResponse.json(
        { error: 'Missing pageId parameter' },
        { status: 400 }
      )
    }

    console.log(`[API] Fetching analysis from database for pageId: ${pageId}`)
    
    // Check if analysis exists for this page
    const { data: pageData, error } = await supabaseAdmin
      .from('scraped_pages')
      .select('gemini_analysis')
      .eq('id', pageId)
      .single()

    if (error) {
      console.error('[API] Error fetching analysis:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analysis' },
        { status: 500 }
      )
    }

    console.log(`[API] Database query result:`, {
      hasPageData: !!pageData,
      hasAnalysis: !!pageData?.gemini_analysis,
      error: error ? 'Database error occurred' : null
    })

    if (!pageData?.gemini_analysis) {
      console.log(`[API] No analysis found for pageId: ${pageId}`)
      const duration = Date.now() - startTime
      console.log(`[API] GET request completed in ${duration}ms (no analysis)`)
      
      return NextResponse.json({
        success: true,
        analysis: null,
        cached: false
      })
    }

    console.log(`[API] Returning existing analysis for pageId: ${pageId}`)
    const duration = Date.now() - startTime
    console.log(`[API] GET request completed in ${duration}ms (cached)`)
    
    return NextResponse.json({
      success: true,
      analysis: pageData.gemini_analysis,
      cached: true
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API] Error in Gemini analysis GET API after ${duration}ms:`, error)
    console.error('[API] Error type:', typeof error)
    console.error('[API] Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
