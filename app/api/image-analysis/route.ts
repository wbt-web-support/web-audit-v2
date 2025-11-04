import { NextRequest, NextResponse } from 'next/server';
import { analyzeImageWithGemini, getGeminiAnalysisStatus } from '@/lib/gemini';
import { supabaseAdmin } from '@/lib/supabase';
import { checkFeatureAccess } from '@/lib/plan-validation';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const requestBody = await request.json();
    const {
      pageId,
      imageUrl,
      pageUrl,
      userId
    } = requestBody;

    if (!pageId || !imageUrl || !pageUrl) {
      return NextResponse.json({
        error: 'Missing required fields: pageId, imageUrl, pageUrl'
      }, {
        status: 400
      });
    }

    // Server-side plan validation
    if (userId) {
      const featureAccess = await checkFeatureAccess(userId, 'grammar_content_analysis');
      if (!featureAccess.hasAccess) {
        return NextResponse.json({
          error: 'Access denied',
          message: featureAccess.error,
          userPlan: featureAccess.userPlan,
          requiredFeature: 'grammar_content_analysis'
        }, {
          status: 403
        });
      }
    }

    // Check if analysis already exists for this page
    try {
      const {
        data: existingPage,
        error: fetchError
      } = await supabaseAdmin
        .from('scraped_pages')
        .select('Image_gemini_analysis')
        .eq('id', pageId)
        .single();

      // PGRST116 means "not found" - that's fine, we'll create new analysis
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('[API] Error fetching existing image analysis:', fetchError);
        // Don't fail here, just log and continue to create new analysis
      }

      // If analysis already exists, return it
      if (existingPage?.Image_gemini_analysis) {
        return NextResponse.json({
          success: true,
          analysis: existingPage.Image_gemini_analysis,
          cached: true
        });
      }
    } catch (dbError) {
      // If database check fails, continue to create new analysis
      console.warn('[API] Could not check existing analysis, proceeding with new analysis:', dbError);
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

    // Perform Gemini image analysis
    const analysis = await analyzeImageWithGemini(imageUrl, pageUrl);

    // Save analysis to database
    const {
      error: saveError
    } = await supabaseAdmin
      .from('scraped_pages')
      .update({
        Image_gemini_analysis: analysis
      })
      .eq('id', pageId);

    if (saveError) {
      console.error('[API] Error saving image analysis:', saveError);
      return NextResponse.json({
        error: 'Failed to save analysis'
      }, {
        status: 500
      });
    }

    return NextResponse.json({
      success: true,
      analysis,
      cached: false
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API] Error in image analysis API after ${duration}ms:`, error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
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
    } = await supabaseAdmin
      .from('scraped_pages')
      .select('Image_gemini_analysis')
      .eq('id', pageId)
      .single();

    if (error) {
      console.error('[API] Error fetching image analysis:', error);
      return NextResponse.json({
        error: 'Failed to fetch analysis'
      }, {
        status: 500
      });
    }

    if (!pageData?.Image_gemini_analysis) {
      return NextResponse.json({
        success: true,
        analysis: null,
        cached: false
      });
    }

    return NextResponse.json({
      success: true,
      analysis: pageData.Image_gemini_analysis,
      cached: true
    });
  } catch (error) {
    console.error('[API] Error in image analysis GET API:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, {
      status: 500
    });
  }
}

