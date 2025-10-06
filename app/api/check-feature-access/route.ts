import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUserPlanInfo } from '@/lib/plan-validation'

export async function POST(request: NextRequest) {
  try {
    const { featureId } = await request.json()

    if (!featureId) {
      return NextResponse.json(
        { error: 'Feature ID is required' },
        { status: 400 }
      )
    }

    // Get user from auth header or session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Extract user ID from auth (you may need to adjust this based on your auth setup)
    const token = authHeader.replace('Bearer ', '')
    
    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Get user plan info
    const userPlan = await getUserPlanInfo(user.id)
    
    if (!userPlan) {
      return NextResponse.json({
        hasAccess: false,
        userPlan: null,
        allowedFeatures: [],
        error: 'No plan found for user'
      })
    }

    const hasAccess = userPlan.can_use_features.includes(featureId)
    
    return NextResponse.json({
      hasAccess,
      userPlan: userPlan.plan_type,
      allowedFeatures: userPlan.can_use_features,
      error: hasAccess ? undefined : `Feature '${featureId}' not available in ${userPlan.plan_type} plan`
    })

  } catch (error) {
    console.error('Error checking feature access:', error)
    return NextResponse.json(
      { error: 'Failed to check feature access' },
      { status: 500 }
    )
  }
}
