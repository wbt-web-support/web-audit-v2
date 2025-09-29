import { NextRequest } from 'next/server';
import { analyzeContentWithGemini, getGeminiAnalysisStatus } from '@/lib/gemini';
import { supabaseAdmin } from '@/lib/supabase';
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const requestBody = await request.json();
    const {
      pageId,
      content,
      url
    } = requestBody;
    if (!pageId || !content || !url) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: pageId, content, url'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // Check if analysis already exists for this page
    const {
      data: existingAnalysis,
      error: fetchError
    } = await supabaseAdmin.from('scraped_pages').select('gemini_analysis').eq('id', pageId).single();
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[API] Error fetching existing analysis:', fetchError);
      return new Response(JSON.stringify({
        error: 'Failed to check existing analysis'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // If analysis already exists, return it immediately
    if (existingAnalysis?.gemini_analysis) {
      const duration = Date.now() - startTime;
      return new Response(JSON.stringify({
        success: true,
        analysis: existingAnalysis.gemini_analysis,
        cached: true,
        status: 'completed'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        }
      });
    }
    // Check if Gemini API is available
    const isGeminiAvailable = await getGeminiAnalysisStatus();
    if (!isGeminiAvailable) {
      return new Response(JSON.stringify({
        error: 'Gemini API is not available'
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Create a readable stream for real-time updates
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            status: 'starting',
            message: 'Initializing AI analysis...',
            progress: 5
          })}\n\n`));

          // Send progress update
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            status: 'analyzing',
            message: 'AI is analyzing your content...',
            progress: 25
          })}\n\n`));
          const analysisStartTime = Date.now();

          // Perform Gemini analysis with progress updates
          const analysisPromise = analyzeContentWithGemini(content, url);

          // Send intermediate progress updates
          const progressInterval = setInterval(() => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              status: 'analyzing',
              message: 'AI is analyzing your content...',
              progress: Math.min(70, 25 + Math.random() * 45)
            })}\n\n`));
          }, 2000);
          const analysis = await analysisPromise;
          clearInterval(progressInterval);
          const analysisDuration = Date.now() - analysisStartTime;
          // Send progress update
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            status: 'saving',
            message: 'Saving analysis to database...',
            progress: 85
          })}\n\n`));
          // Save analysis to database in background (don't wait for it)
          const savePromise = supabaseAdmin.from('scraped_pages').update({
            gemini_analysis: analysis
          }).eq('id', pageId);

          // Send final result immediately
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            status: 'completed',
            analysis,
            cached: false,
            progress: 100
          })}\n\n`));

          // Handle save result in background
          savePromise.then(({
            error: saveError
          }) => {
            if (saveError) {
              console.error('[API] Error saving Gemini analysis:', saveError);
            } else {}
          });
          const totalDuration = Date.now() - startTime;
          controller.close();
        } catch (error) {
          console.error(`[API] Error in streaming analysis:`, error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            status: 'error',
            error: 'Analysis failed'
          })}\n\n`));
          controller.close();
        }
      }
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Error in Gemini analysis streaming API after ${duration}ms:`, error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}