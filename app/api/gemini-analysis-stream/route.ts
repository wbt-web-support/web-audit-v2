import { NextRequest } from 'next/server'
import { analyzeContentWithGemini, getGeminiAnalysisStatus } from '@/lib/gemini'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log(`[API] POST /api/gemini-analysis-stream - Request started`)
  
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
      return new Response(
        JSON.stringify({ error: 'Missing required fields: pageId, content, url' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
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
      return new Response(
        JSON.stringify({ error: 'Failed to check existing analysis' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[API] Existing analysis check result:`, {
      hasExistingAnalysis: !!existingAnalysis?.gemini_analysis,
      fetchError: fetchError?.code
    })

    // If analysis already exists, return it immediately
    if (existingAnalysis?.gemini_analysis) {
      console.log(`[API] Returning cached analysis for pageId: ${pageId}`)
      const duration = Date.now() - startTime
      console.log(`[API] Request completed in ${duration}ms (cached)`)
      
      return new Response(
        JSON.stringify({
          success: true,
          analysis: existingAnalysis.gemini_analysis,
          cached: true,
          status: 'completed'
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
          } 
        }
      )
    }

    console.log(`[API] No existing analysis found, checking Gemini API availability...`)
    
    // Check if Gemini API is available
    const isGeminiAvailable = await getGeminiAnalysisStatus()
    console.log(`[API] Gemini API availability check: ${isGeminiAvailable}`)
    
    if (!isGeminiAvailable) {
      console.log(`[API] Gemini API not available, returning 503`)
      return new Response(
        JSON.stringify({ error: 'Gemini API is not available' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create a readable stream for real-time updates
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            status: 'starting',
            message: 'Initializing AI analysis...',
            progress: 5
          })}\n\n`))

          // Send progress update
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            status: 'analyzing',
            message: 'AI is analyzing your content...',
            progress: 25
          })}\n\n`))

          console.log(`[API] Starting Gemini analysis for URL: ${url}`)
          const analysisStartTime = Date.now()
          
          // Perform Gemini analysis with progress updates
          const analysisPromise = analyzeContentWithGemini(content, url)
          
          // Send intermediate progress updates
          const progressInterval = setInterval(() => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              status: 'analyzing',
              message: 'AI is analyzing your content...',
              progress: Math.min(70, 25 + Math.random() * 45)
            })}\n\n`))
          }, 2000)
          
          const analysis = await analysisPromise
          clearInterval(progressInterval)
          
          const analysisDuration = Date.now() - analysisStartTime
          console.log(`[API] Gemini analysis completed in ${analysisDuration}ms`)

          // Send progress update
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            status: 'saving',
            message: 'Saving analysis to database...',
            progress: 85
          })}\n\n`))

          console.log(`[API] Saving analysis to database for pageId: ${pageId}`)
          
          // Save analysis to database in background (don't wait for it)
          const savePromise = supabaseAdmin
            .from('scraped_pages')
            .update({ gemini_analysis: analysis })
            .eq('id', pageId)
          
          // Send final result immediately
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            status: 'completed',
            analysis,
            cached: false,
            progress: 100
          })}\n\n`))

          // Handle save result in background
          savePromise.then(({ error: saveError }) => {
            if (saveError) {
              console.error('[API] Error saving Gemini analysis:', saveError)
            } else {
              console.log(`[API] Analysis saved successfully to database`)
            }
          })

          const totalDuration = Date.now() - startTime
          console.log(`[API] Request completed successfully in ${totalDuration}ms`)

          controller.close()
        } catch (error) {
          console.error(`[API] Error in streaming analysis:`, error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            status: 'error',
            error: 'Analysis failed'
          })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API] Error in Gemini analysis streaming API after ${duration}ms:`, error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
