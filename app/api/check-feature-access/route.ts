import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserPlanInfo } from '@/lib/plan-validation';
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!);
export async function POST(request: NextRequest) {
  try {
    const {
      featureId
    } = await request.json();
    // Get user from auth header or session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({
        error: 'Authorization header required'
      }, {
        status: 401
      });
    }

    // Extract user ID from auth (you may need to adjust this based on your auth setup)
    const token = authHeader.replace('Bearer ', '');

    // Verify user session
    const {
      data: {
        user
      },
      error: authError
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({
        error: 'Invalid authentication'
      }, {
        status: 401
      });
    }

    // Get user plan info

    const userPlan = await getUserPlanInfo(user.id);
    if (!userPlan) {
      return NextResponse.json({
        hasAccess: false,
        userPlan: null,
        allowedFeatures: [],
        error: 'No plan found for user'
      });
    }

    // If no specific featureId is requested, return the user's full plan info
    if (!featureId) {
      return NextResponse.json({
        hasAccess: true,
        userPlan: userPlan.plan_type,
        allowedFeatures: userPlan.can_use_features,
        maxProjects: userPlan.max_projects
      });
    }
    const hasAccess = userPlan.can_use_features.includes(featureId);
    return NextResponse.json({
      hasAccess,
      userPlan: userPlan.plan_type,
      allowedFeatures: userPlan.can_use_features,
      error: hasAccess ? undefined : `Feature '${featureId}' not available in ${userPlan.plan_type} plan`
    });
  } catch (error) {
    console.error('Error checking feature access:', error);
    return NextResponse.json({
      error: 'Failed to check feature access'
    }, {
      status: 500
    });
  }
}