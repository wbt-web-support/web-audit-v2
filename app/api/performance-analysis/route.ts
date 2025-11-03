import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchPageSpeedInsights } from '@/lib/pagespeed';
import { checkFeatureAccess } from '@/lib/plan-validation';
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export async function GET(request: NextRequest) {
  const {
    searchParams
  } = new URL(request.url);
  const pageId = searchParams.get('pageId');
  if (!pageId) {
    return NextResponse.json({
      error: 'Page ID is required'
    }, {
      status: 400
    });
  }
  try {
    // Check if performance analysis already exists
    const {
      data: existingPage,
      error: fetchError
    } = await supabaseAdmin.from('scraped_pages').select('id, url, performance_analysis').eq('id', pageId).single();
    if (fetchError) {
      console.error('❌ Error fetching page data:', fetchError);
      return NextResponse.json({
        error: 'Failed to fetch page data'
      }, {
        status: 500
      });
    }
    if (!existingPage) {
      return NextResponse.json({
        error: 'Page not found'
      }, {
        status: 404
      });
    }

    // If analysis already exists, return it
    if (existingPage.performance_analysis) {
      return NextResponse.json({
        success: true,
        analysis: existingPage.performance_analysis,
        cached: true
      });
    }
    return NextResponse.json({
      success: false,
      message: 'No performance analysis found'
    });
  } catch (error) {
    console.error('❌ Performance analysis check error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, {
      status: 500
    });
  }
}
export async function POST(request: NextRequest) {
  try {
    const {
      pageId,
      url,
      userId
    } = await request.json();

    if (!pageId || !url) {
      console.error('❌ Missing required fields:', { pageId, url });
      return NextResponse.json({
        error: 'Page ID and URL are required'
      }, {
        status: 400
      });
    }

    // Server-side plan validation for performance metrics
    if (userId) {
      console.log('[API] 🔍 Checking feature access for user:', {
        userId,
        featureId: 'performance_metrics',
        pageId,
        url
      });
      
      const featureAccess = await checkFeatureAccess(userId, 'performance_metrics');
      
      console.log('[API] 📊 Feature access result:', {
        hasAccess: featureAccess.hasAccess,
        userPlan: featureAccess.userPlan,
        allowedFeatures: featureAccess.allowedFeatures,
        error: featureAccess.error
      });
      
      if (!featureAccess.hasAccess) {
        console.error('[API] ❌ Access denied:', {
          userId,
          userPlan: featureAccess.userPlan,
          error: featureAccess.error,
          allowedFeatures: featureAccess.allowedFeatures
        });
        
        return NextResponse.json({
          error: 'Access denied',
          message: featureAccess.error,
          userPlan: featureAccess.userPlan,
          requiredFeature: 'performance_metrics'
        }, {
          status: 403
        });
      }
      
      console.log('[API] ✅ Access granted for user:', userId);
    } else {
      console.warn('[API] ⚠️ No userId provided, skipping access check');
    }
    // Check if performance analysis already exists
    const {
      data: existingPage,
      error: fetchError
    } = await supabaseAdmin.from('scraped_pages').select('id, performance_analysis').eq('id', pageId).single();
    if (fetchError) {
      console.error('❌ Error fetching page data:', fetchError);
      return NextResponse.json({
        error: 'Failed to fetch page data'
      }, {
        status: 500
      });
    }
    if (!existingPage) {
      return NextResponse.json({
        error: 'Page not found'
      }, {
        status: 404
      });
    }

    // If analysis already exists, return it
    if (existingPage.performance_analysis) {
      return NextResponse.json({
        success: true,
        analysis: existingPage.performance_analysis,
        cached: true
      });
    }
    // Perform PageSpeed analysis

    const {
      data: pagespeedData,
      error: pagespeedError
    } = await fetchPageSpeedInsights(url);

    if (pagespeedError) {
      console.error('❌ PageSpeed analysis error:', pagespeedError);
      return NextResponse.json({
        error: pagespeedError
      }, {
        status: 500
      });
    }

    if (!pagespeedData) {
      return NextResponse.json({
        error: 'No PageSpeed data received'
      }, {
        status: 500
      });
    }
    // Save performance analysis to database
    const {
      error: saveError
    } = await supabaseAdmin.from('scraped_pages').update({
      performance_analysis: pagespeedData
    }).eq('id', pageId);
    if (saveError) {
      console.error('❌ Error saving performance analysis:', saveError);
      return NextResponse.json({
        error: 'Failed to save performance analysis'
      }, {
        status: 500
      });
    }
    return NextResponse.json({
      success: true,
      analysis: pagespeedData,
      cached: false
    });
  } catch (error) {
    console.error('❌ Performance analysis error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, {
      status: 500
    });
  }
}