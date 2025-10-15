import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchPageSpeedInsights } from '@/lib/pagespeed';
import { checkFeatureAccess } from '@/lib/plan-validation';
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export async function POST(request: NextRequest) {
 
  try {
    const {
      projectId,
      url,
      userId
    } = await request.json();
    if (!url) {
      return NextResponse.json({
        error: 'URL is required'
      }, {
        status: 400
      });
    }

    // Server-side plan validation for performance metrics
    if (userId) {
      const featureAccess = await checkFeatureAccess(userId, 'performance_metrics');
      if (!featureAccess.hasAccess) {
        return NextResponse.json({
          error: 'Access denied',
          message: featureAccess.error,
          userPlan: featureAccess.userPlan,
          requiredFeature: 'performance_metrics'
        }, {
          status: 403
        });
      }
    }

    // For demo purposes, skip project validation if projectId is 'demo-project'
    if (projectId !== 'demo-project') {
      // Check if PageSpeed analysis already exists for this project
      const {
        data: existingProject,
        error: fetchError
      } = await supabaseAdmin.from('audit_projects').select('id, pagespeed_insights_data').eq('id', projectId).single();
      if (fetchError) {
        console.error('❌ Error fetching project data:', fetchError);
        return NextResponse.json({
          error: 'Failed to fetch project data'
        }, {
          status: 500
        });
      }
      if (!existingProject) {
        return NextResponse.json({
          error: 'Project not found'
        }, {
          status: 404
        });
      }

      // If analysis already exists, return it
      if (existingProject.pagespeed_insights_data) {
        return NextResponse.json({
          success: true,
          analysis: existingProject.pagespeed_insights_data,
          cached: true
        });
      }
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
    // Save PageSpeed analysis to project (only for real projects, not demo)
    if (projectId !== 'demo-project') {
      const {
        error: saveError
      } = await supabaseAdmin.from('audit_projects').update({
        pagespeed_insights_data: pagespeedData,
        pagespeed_insights_loading: false,
        pagespeed_insights_error: null
      }).eq('id', projectId);
      if (saveError) {
        console.error('❌ Error saving PageSpeed analysis:', saveError);
        return NextResponse.json({
          error: 'Failed to save PageSpeed analysis'
        }, {
          status: 500
        });
      }
    }
    return NextResponse.json({
      success: true,
      analysis: pagespeedData,
      cached: false
    });
  } catch (error) {
    console.error('❌ PageSpeed analysis error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, {
      status: 500
    });
  }
}