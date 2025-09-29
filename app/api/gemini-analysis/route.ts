import { NextRequest, NextResponse } from 'next/server';
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
      return NextResponse.json({
        error: 'Missing required fields: pageId, content, url'
      }, {
        status: 400
      });
    }
    // Check if analysis already exists for this page
    const {
      data: existingAnalysis,
      error: fetchError
    } = await supabaseAdmin.from('scraped_pages').select('gemini_analysis').eq('id', pageId).single();
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[API] Error fetching existing analysis:', fetchError);
      return NextResponse.json({
        error: 'Failed to check existing analysis'
      }, {
        status: 500
      });
    }
    // If analysis already exists, return it
    if (existingAnalysis?.gemini_analysis) {
      const duration = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        analysis: existingAnalysis.gemini_analysis,
        cached: true
      });
    }
    // Check if Gemini API is available
    const isGeminiAvailable = await getGeminiAnalysisStatus();
    if (!isGeminiAvailable) {
      return NextResponse.json({
        error: 'Gemini API is not available'
      }, {
        status: 503
      });
    }
    const analysisStartTime = Date.now();

    // Perform Gemini analysis
    const analysis = await analyzeContentWithGemini(content, url);
    const analysisDuration = Date.now() - analysisStartTime;
    // Save analysis to database
    const {
      error: saveError
    } = await supabaseAdmin.from('scraped_pages').update({
      gemini_analysis: analysis
    }).eq('id', pageId);
    if (saveError) {
      console.error('[API] Error saving Gemini analysis:', saveError);
      return NextResponse.json({
        error: 'Failed to save analysis'
      }, {
        status: 500
      });
    }
    const totalDuration = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      analysis,
      cached: false
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Error in Gemini analysis API after ${duration}ms:`, error);
    console.error('[API] Error type:', typeof error);
    console.error('[API] Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({
      error: 'Internal server error'
    }, {
      status: 500
    });
  }
}
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const {
      searchParams
    } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    if (!pageId) {
      return NextResponse.json({
        error: 'Missing pageId parameter'
      }, {
        status: 400
      });
    }
    // Check if analysis exists for this page
    const {
      data: pageData,
      error
    } = await supabaseAdmin.from('scraped_pages').select('gemini_analysis').eq('id', pageId).single();
    if (error) {
      console.error('[API] Error fetching analysis:', error);
      return NextResponse.json({
        error: 'Failed to fetch analysis'
      }, {
        status: 500
      });
    }
    if (!pageData?.gemini_analysis) {
      const duration = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        analysis: null,
        cached: false
      });
    }
    const duration = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      analysis: pageData.gemini_analysis,
      cached: true
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Error in Gemini analysis GET API after ${duration}ms:`, error);
    console.error('[API] Error type:', typeof error);
    console.error('[API] Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({
      error: 'Internal server error'
    }, {
      status: 500
    });
  }
}